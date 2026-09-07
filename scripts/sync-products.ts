/**
 * Imports the Dabur International UAE catalogue into src/data/catalogue.json.
 *
 *   npm run sync:products            # crawl https://www.daburinternational.com/uae
 *   npm run sync:products -- --from ./saved-page.html   # parse a saved HTML page offline
 *
 * The output is treated as read-only by the app. Product text is copied verbatim from
 * the source page; nothing is rewritten. Fields that the page does not expose stay empty
 * so the UI can show "not in source" rather than an invented value.
 *
 * The crawler is deliberately conservative: it starts at the country landing page,
 * follows links that look like brand or product pages on the same host, and reads
 * schema.org Product JSON-LD first, falling back to Open Graph and headings.
 */
import { load, type CheerioAPI } from "cheerio";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = "https://www.daburinternational.com";
const START = `${ROOT}/uae`;
const OUT = resolve(process.cwd(), "src/data/catalogue.json");
const MAX_PAGES = 400;

type Localised = { en: string; ar: string };
interface Brand { id: string; name: string; localisedName: Localised; category: string; catalogueUrl: string; hue: string }
interface Product {
  id: string; brandId: string; names: Localised; type: string; packType: string; description: Localised;
  ingredients: string[]; benefits: Localised[]; usageSteps: Localised[]; image: string | null; sourceUrl: string; pendingSync: boolean;
}

const args = process.argv.slice(2);
const fromFile = args.includes("--from") ? args[args.indexOf("--from") + 1] : null;

const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
const clean = (s: string | undefined | null) => (s ?? "").replace(/\s+/g, " ").trim();
const L = (en: string, ar = ""): Localised => ({ en, ar });

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": "DaburSquadSync/1.0 (+catalogue import)" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

function sameHostLinks($: CheerioAPI, base: string): string[] {
  const out = new Set<string>();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    try {
      const u = new URL(href, base);
      if (u.host !== new URL(ROOT).host) return;
      u.hash = "";
      u.search = "";
      if (/\/(uae)\/.*(product|brand)/i.test(u.pathname) || /\/uae\/[^/]+\/[^/]+/.test(u.pathname)) out.add(u.toString());
    } catch {
      // ignore malformed links
    }
  });
  return [...out];
}

function jsonLdProducts($: CheerioAPI): Record<string, unknown>[] {
  const found: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text());
      const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] ?? [parsed];
      for (const n of nodes) if (n && (n["@type"] === "Product" || (Array.isArray(n["@type"]) && n["@type"].includes("Product")))) found.push(n);
    } catch {
      // not JSON
    }
  });
  return found;
}

function listUnder($: CheerioAPI, headingPattern: RegExp): string[] {
  const items: string[] = [];
  $("h2, h3, h4, strong, dt").each((_, h) => {
    if (!headingPattern.test(clean($(h).text()))) return;
    const next = $(h).nextAll("ul, ol, p, dd").first();
    next.find("li").each((_, li) => {
      items.push(clean($(li).text()));
    });
    if (items.length === 0) {
      const text = clean(next.text());
      if (text) items.push(...text.split(/[.;•]\s+/).map(clean).filter(Boolean));
    }
  });
  return items;
}

function guessPackType(text: string): string {
  const t = text.toLowerCase();
  if (/tube|toothpaste|cream/.test(t)) return "tube";
  if (/jar|chyawanprash|hammam/.test(t)) return "jar";
  if (/carton|juice|litre/.test(t)) return "carton";
  if (/sachet/.test(t)) return "sachet";
  if (/box|bleach|freshener/.test(t)) return "box";
  if (/spray/.test(t)) return "spray";
  return "bottle";
}

function parseProduct(html: string, url: string, brands: Map<string, Brand>): Product | null {
  const $ = load(html);
  const ld = jsonLdProducts($)[0];
  const name = clean((ld?.name as string) ?? $('meta[property="og:title"]').attr("content") ?? $("h1").first().text());
  if (!name) return null;
  const description = clean((ld?.description as string) ?? $('meta[property="og:description"]').attr("content") ?? $("main p").first().text());
  const image = (ld?.image as string) ?? $('meta[property="og:image"]').attr("content") ?? null;
  const brandName = clean(typeof ld?.brand === "object" && ld?.brand ? (ld.brand as { name?: string }).name : (ld?.brand as string)) || clean($('[class*="brand"]').first().text()) || name.split(" ")[0];
  const brandId = slug(brandName) || "dabur";
  if (!brands.has(brandId)) brands.set(brandId, { id: brandId, name: brandName, localisedName: L(brandName), category: clean((ld?.category as string) ?? ""), catalogueUrl: url, hue: "#1B7A3E" });
  const nameAr = clean($('[lang="ar"] h1, h1[lang="ar"], .ar h1').first().text());
  return {
    id: slug(name),
    brandId,
    names: L(name, nameAr),
    type: clean((ld?.category as string) ?? ""),
    packType: guessPackType(`${name} ${description}`),
    description: L(description),
    ingredients: listUnder($, /ingredient/i),
    benefits: listUnder($, /benefit/i).map((b) => L(b)),
    usageSteps: listUnder($, /how to use|usage|direction/i).map((s) => L(s)),
    image: image ? new URL(image, url).toString() : null,
    sourceUrl: url,
    pendingSync: false,
  };
}

async function main() {
  const brands = new Map<string, Brand>();
  const products = new Map<string, Product>();

  if (fromFile) {
    const html = readFileSync(resolve(fromFile), "utf8");
    const p = parseProduct(html, START, brands);
    if (p) products.set(p.id, p);
  } else {
    const seen = new Set<string>();
    const queue = [START];
    while (queue.length && seen.size < MAX_PAGES) {
      const url = queue.shift()!;
      if (seen.has(url)) continue;
      seen.add(url);
      let html: string;
      try {
        html = await fetchHtml(url);
      } catch (e) {
        console.warn(`skip ${url}: ${(e as Error).message}`);
        continue;
      }
      const $ = load(html);
      const product = parseProduct(html, url, brands);
      if (product && (jsonLdProducts($).length > 0 || /product/i.test(url))) {
        products.set(product.id, product);
        console.log(`+ ${product.names.en}`);
      }
      for (const link of sameHostLinks($, url)) if (!seen.has(link)) queue.push(link);
    }
  }

  if (products.size === 0) {
    console.error("No products found. The site structure may have changed; inspect a product page and adjust parseProduct().");
    process.exit(1);
  }

  const out = {
    source: START,
    syncedAt: new Date().toISOString(),
    note: "Imported verbatim by scripts/sync-products.ts. Do not hand-edit.",
    brands: [...brands.values()],
    products: [...products.values()],
  };
  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${out.products.length} products and ${out.brands.length} brands to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
