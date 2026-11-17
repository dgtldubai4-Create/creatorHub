/**
 * Pulls posts from Dabur's own social accounts into src/art/social, so the app
 * can show them without ever calling a network at runtime.
 *
 *   npm run social -- --from ./exports/instagram --platform instagram --handle daburarabia
 *       Copy images out of a folder: an Instagram or TikTok "Download your
 *       information" export, or any folder of saved post images. Captions are
 *       read from a sidecar <name>.txt or <name>.json ({ caption, permalink }).
 *
 *   IG_ACCESS_TOKEN=... npm run social -- --instagram
 *       Instagram Graph API, for an account you manage:
 *       GET https://graph.instagram.com/me/media
 *           ?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username
 *
 *   TIKTOK_ACCESS_TOKEN=... npm run social -- --tiktok
 *       TikTok Display API, for an account you manage:
 *       POST https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,share_url
 *
 *   Options: --max 12 (per run, default 12)   --brand vatika (tag posts with a brand id)
 *            --clear (empty the folder first)  --dry-run (print the plan, write nothing)
 *
 * Tokens come from the environment only. Never paste one into a chat or commit it.
 * The script needs network access to graph.instagram.com / open.tiktokapis.com and
 * to the image hosts those APIs return, so run it where those are reachable.
 *
 * Images are inlined into the single-file build. Keep them modest: 12 posts at
 * about 1080px and under 300 KB each is plenty.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

export interface SocialPost {
  id: string;
  platform: "instagram" | "tiktok";
  handle: string;
  caption: string;
  permalink: string;
  postedAt: string;
  file: string;
  brandId?: string;
}

const OUT = resolve(process.cwd(), "src/art/social");
const MANIFEST = join(OUT, "posts.json");
const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const MAX = Number(opt("max") ?? 12);
const BRAND = opt("brand");
const DRY = flag("dry-run");
const IMG = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const WARN_BYTES = 400 * 1024;

const safe = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
const load = (): SocialPost[] => (existsSync(MANIFEST) ? (JSON.parse(readFileSync(MANIFEST, "utf8")) as SocialPost[]) : []);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (IMG.has(extname(name).toLowerCase())) out.push(p);
  }
  return out;
}

function fromFolder(dir: string): { post: SocialPost; source: string }[] {
  const platform = (opt("platform") ?? "instagram") as SocialPost["platform"];
  const handle = (opt("handle") ?? "dabur").replace(/^@/, "");
  const files = walk(resolve(dir)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs).slice(0, MAX);
  return files.map((source) => {
    const stem = source.slice(0, -extname(source).length);
    let caption = "";
    let permalink = platform === "instagram" ? `https://www.instagram.com/${handle}/` : `https://www.tiktok.com/@${handle}`;
    if (existsSync(`${stem}.txt`)) caption = readFileSync(`${stem}.txt`, "utf8").trim();
    if (existsSync(`${stem}.json`)) {
      const j = JSON.parse(readFileSync(`${stem}.json`, "utf8")) as { caption?: string; permalink?: string };
      caption = j.caption ?? caption;
      permalink = j.permalink ?? permalink;
    }
    const id = `${platform}-${safe(basename(stem))}`;
    return { source, post: { id, platform, handle, caption, permalink, postedAt: statSync(source).mtime.toISOString(), file: `${id}${extname(source).toLowerCase()}`, brandId: BRAND } };
  });
}

async function download(url: string, to: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} fetching ${new URL(url).host}`);
  writeFileSync(to, Buffer.from(await res.arrayBuffer()));
}

async function fromInstagram(): Promise<{ post: SocialPost; url: string }[]> {
  const token = process.env.IG_ACCESS_TOKEN;
  if (!token) throw new Error("IG_ACCESS_TOKEN is not set");
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username";
  const res = await fetch(`https://graph.instagram.com/me/media?fields=${fields}&limit=${MAX}&access_token=${token}`);
  if (!res.ok) throw new Error(`Instagram ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const { data } = (await res.json()) as { data: { id: string; caption?: string; media_type: string; media_url?: string; thumbnail_url?: string; permalink: string; timestamp: string; username: string }[] };
  return data.map((m) => ({ url: (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) ?? "", post: { id: `instagram-${m.id}`, platform: "instagram" as const, handle: m.username, caption: m.caption ?? "", permalink: m.permalink, postedAt: m.timestamp, file: `instagram-${m.id}.jpg`, brandId: BRAND } })).filter((x) => x.url);
}

async function fromTikTok(): Promise<{ post: SocialPost; url: string }[]> {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) throw new Error("TIKTOK_ACCESS_TOKEN is not set");
  const res = await fetch("https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,share_url,create_time", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ max_count: Math.min(20, MAX) }) });
  if (!res.ok) throw new Error(`TikTok ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const { data } = (await res.json()) as { data: { videos: { id: string; title?: string; cover_image_url: string; share_url: string; create_time: number }[] } };
  const handle = (opt("handle") ?? "dabur").replace(/^@/, "");
  return data.videos.map((v) => ({ url: v.cover_image_url, post: { id: `tiktok-${v.id}`, platform: "tiktok" as const, handle, caption: v.title ?? "", permalink: v.share_url, postedAt: new Date(v.create_time * 1000).toISOString(), file: `tiktok-${v.id}.jpg`, brandId: BRAND } }));
}

async function main() {
  if (!flag("instagram") && !flag("tiktok") && !opt("from")) {
    console.log("Nothing to do. Pass --from <folder>, --instagram or --tiktok. See the header of this file.");
    return;
  }
  if (!DRY) mkdirSync(OUT, { recursive: true });
  let posts = flag("clear") ? [] : load();
  if (flag("clear") && !DRY) for (const f of readdirSync(OUT)) if (IMG.has(extname(f).toLowerCase())) rmSync(join(OUT, f));
  const added: SocialPost[] = [];

  const from = opt("from");
  if (from) {
    for (const { post, source } of fromFolder(from)) {
      console.log(`${DRY ? "would copy" : "copy"} ${basename(source)} -> ${post.file}`);
      if (!DRY) copyFileSync(source, join(OUT, post.file));
      added.push(post);
    }
  }
  for (const [on, pull] of [[flag("instagram"), fromInstagram], [flag("tiktok"), fromTikTok]] as const) {
    if (!on) continue;
    for (const { post, url } of await pull()) {
      console.log(`${DRY ? "would fetch" : "fetch"} ${post.id}`);
      if (!DRY) await download(url, join(OUT, post.file));
      added.push(post);
    }
  }

  const ids = new Set(added.map((p) => p.id));
  posts = [...added, ...posts.filter((p) => !ids.has(p.id))].sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  if (!DRY) {
    writeFileSync(MANIFEST, `${JSON.stringify(posts, null, 2)}\n`);
    let total = 0;
    for (const p of posts) {
      const size = statSync(join(OUT, p.file)).size;
      total += size;
      if (size > WARN_BYTES) console.warn(`  ${p.file} is ${(size / 1024).toFixed(0)} KB; resize it to about 1080px to keep the build small`);
    }
    console.log(`${posts.length} posts in src/art/social (${(total / 1024 / 1024).toFixed(1)} MB). Rebuild to see them.`);
  } else {
    console.log(`${added.length} posts would be added.`);
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
