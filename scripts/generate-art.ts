/**
 * Fills every slot in src/art/manifest.ts with a photograph.
 *
 * With a Gemini API key (https://aistudio.google.com/apikey):
 *   GEMINI_API_KEY=... npm run art
 *   npm run art -- --only hero-golden-hour,mission-team   # a subset
 *   npm run art -- --group portrait                       # ids starting with "portrait"
 *   npm run art -- --force                                # overwrite existing files
 *   npm run art -- --dry-run                              # print the plan, call nothing
 *   GEMINI_IMAGE_MODEL=<model id> npm run art             # default gemini-2.5-flash-image
 *
 * Without a key, using the Gemini app (gemini.google.com):
 *   npm run art -- --prompts            # writes docs/art-prompts.md: one prompt per image
 *   ...make each image in the Gemini app and save it as <id>.png (or .jpg) in one folder...
 *   npm run art -- --from ./my-folder   # resizes, converts and files every image it recognises
 *
 * Gemini:  POST https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent
 *          header x-goog-api-key, body { contents: [{ parts: [{ text }] }],
 *          generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio } } }
 *          -> candidates[0].content.parts[].inlineData.data (base64)
 * Recraft and Hugging Face remain available with --tool recraft / --tool hf.
 *
 * Every image is resized to its slot and saved as src/art/generated/<id>.webp, where
 * <ArtSlot id="..."/> and <Face/> pick it up. Services are called only from this
 * script, never from the app at runtime.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { ART_SLOTS, type ArtSlot } from "../src/art/manifest";

const OUT_DIR = resolve(process.cwd(), "src/art/generated");
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const only = opt("only")?.split(",").map((s) => s.trim()).filter(Boolean);
const toolOverride = opt("tool") as ArtSlot["tool"] | undefined;
const group = opt("group");
const from = opt("from");
const force = flag("force");
const dry = flag("dry-run");

const RECRAFT_KEY = process.env.RECRAFT_API_KEY;
const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = process.env.HF_MODEL ?? "black-forest-labs/FLUX.1-schnell";
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
// Override only to route through a gateway or a local stub in tests.
const GEMINI_BASE = process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com";

const RATIOS: [string, number][] = [["1:1", 1], ["4:5", 0.8], ["3:4", 0.75], ["2:3", 2 / 3], ["9:16", 9 / 16], ["5:4", 1.25], ["4:3", 4 / 3], ["3:2", 1.5], ["16:9", 16 / 9], ["21:9", 21 / 9]];
export const aspectFor = (w: number, h: number) => RATIOS.reduce((best, r) => (Math.abs(r[1] - w / h) < Math.abs(best[1] - w / h) ? r : best))[0];

async function gemini(slot: ArtSlot): Promise<Buffer> {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY is not set");
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${GEMINI_BASE}/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": GEMINI_KEY, "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: slot.prompt }] }], generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspectFor(slot.width, slot.height) } } }),
    });
    if (res.status === 429 || res.status === 503) {
      console.log(`  ${res.status}, retrying in ${10 * (attempt + 1)}s`);
      await sleep(10_000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[] };
    const data = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
    if (!data) throw new Error("Gemini returned no image (the prompt may have been declined)");
    return Buffer.from(data, "base64");
  }
  throw new Error("Gemini kept rate-limiting");
}

/** Resize to the slot and convert to WebP. Keeps the build small enough to inline. */
async function optimise(buf: Buffer, slot: ArtSlot): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp(buf).resize(slot.width, slot.height, { fit: "cover", position: "attention" }).webp({ quality: 78 }).toBuffer();
}

function writePrompts() {
  const out = resolve(process.cwd(), "docs/art-prompts.md");
  const lines = ["# Image prompts", "", "One prompt per image. Paste each into the Gemini app, save the result under the file name shown, put them all in one folder, then run `npm run art -- --from <folder>`.", ""];
  for (const slot of ART_SLOTS) lines.push(`## ${slot.label}`, "", `Save as: \`${slot.id}.png\` (${aspectFor(slot.width, slot.height)})`, "", `> ${slot.prompt}`, "");
  writeFileSync(out, lines.join("\n"));
  console.log(`${ART_SLOTS.length} prompts written to docs/art-prompts.md`);
}

async function importFolder(dir: string) {
  const ids = new Map(ART_SLOTS.map((s) => [s.id, s]));
  let ok = 0;
  const unknown: string[] = [];
  for (const name of readdirSync(resolve(dir))) {
    if (!/\.(png|jpe?g|webp)$/i.test(name)) continue;
    const slot = ids.get(basename(name, extname(name)).toLowerCase());
    if (!slot) { unknown.push(name); continue; }
    writeFileSync(resolve(OUT_DIR, `${slot.id}.webp`), await optimise(readFileSync(join(resolve(dir), name)), slot));
    ok += 1;
  }
  console.log(`${ok} images imported${unknown.length ? `; not recognised: ${unknown.join(", ")}` : ""}`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function recraft(slot: ArtSlot): Promise<Buffer> {
  if (!RECRAFT_KEY) throw new Error("RECRAFT_API_KEY is not set");
  const res = await fetch("https://external.api.recraft.ai/v1/images/generations", {
    method: "POST",
    headers: { authorization: `Bearer ${RECRAFT_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ prompt: slot.prompt, style: slot.style ?? "digital_illustration", ...(slot.substyle ? { substyle: slot.substyle } : {}), size: `${slot.width}x${slot.height}`, n: 1, response_format: "b64_json" }),
  });
  if (!res.ok) throw new Error(`Recraft ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
  const item = json.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, "base64");
  if (item?.url) {
    const img = await fetch(item.url);
    return Buffer.from(await img.arrayBuffer());
  }
  throw new Error("Recraft returned no image");
}

async function huggingFace(slot: ArtSlot): Promise<Buffer> {
  if (!HF_TOKEN) throw new Error("HF_TOKEN is not set");
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`https://router.huggingface.co/hf-inference/models/${HF_MODEL}`, {
      method: "POST",
      headers: { authorization: `Bearer ${HF_TOKEN}`, "content-type": "application/json", accept: "image/png" },
      body: JSON.stringify({ inputs: slot.prompt, parameters: { width: slot.width, height: slot.height, num_inference_steps: 4 } }),
    });
    if (res.status === 503) {
      // Model is loading on the inference side; wait and retry.
      const wait = Number((await res.json().catch(() => ({ estimated_time: 20 })) as { estimated_time?: number }).estimated_time ?? 20);
      console.log(`  model loading, retrying in ${Math.ceil(wait)}s`);
      await sleep(Math.min(60, wait) * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`Hugging Face ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) throw new Error(`Unexpected content-type ${type}`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error("Hugging Face model did not become ready");
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  if (flag("prompts")) return writePrompts();
  if (from) return importFolder(from);
  const plan = ART_SLOTS.filter((s) => (!only || only.includes(s.id)) && (!group || s.id.startsWith(group)));
  console.log(`${plan.length} slots${dry ? " (dry run)" : ""}`);
  let ok = 0;
  let skipped = 0;
  let failed = 0;
  for (const slot of plan) {
    const file = resolve(OUT_DIR, `${slot.id}.webp`);
    if (existsSync(file) && !force) {
      skipped += 1;
      continue;
    }
    const tool = toolOverride ?? slot.tool;
    console.log(`[${tool}] ${slot.id}  ${slot.width}x${slot.height}`);
    if (dry) continue;
    try {
      const raw = tool === "recraft" ? await recraft(slot) : tool === "hf" ? await huggingFace(slot) : await gemini(slot);
      writeFileSync(file, await optimise(raw, slot));
      ok += 1;
      await sleep(tool === "gemini" ? 1500 : 2500);
    } catch (e) {
      failed += 1;
      console.error(`  failed: ${(e as Error).message}`);
    }
  }
  console.log(`done: ${ok} written, ${skipped} already present, ${failed} failed`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
