/**
 * Generates every art slot listed in src/art/manifest.ts.
 *
 *   RECRAFT_API_KEY=... HF_TOKEN=... npm run art
 *   npm run art -- --only level-pro,mission-team      # a subset
 *   npm run art -- --tool recraft                     # one provider only
 *   npm run art -- --force                            # overwrite existing files
 *   npm run art -- --dry-run                          # print the plan, call nothing
 *
 * Recraft:       POST https://external.api.recraft.ai/v1/images/generations
 *                body { prompt, style, substyle?, size: "WxH", n: 1, response_format: "b64_json" }
 *                https://www.recraft.ai/docs
 * Hugging Face:  POST https://router.huggingface.co/hf-inference/models/<model>
 *                body { inputs: prompt, parameters: { width, height } }  ->  image bytes
 *                default model black-forest-labs/FLUX.1-schnell (override with HF_MODEL)
 *
 * Output goes to src/art/generated/<id>.png and is picked up by <ArtSlot id="..."/>.
 * Both services are called only from this script, never from the app at runtime.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ART_SLOTS, type ArtSlot } from "../src/art/manifest";

const OUT_DIR = resolve(process.cwd(), "src/art/generated");
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const only = opt("only")?.split(",").map((s) => s.trim()).filter(Boolean);
const toolFilter = opt("tool") as ArtSlot["tool"] | undefined;
const force = flag("force");
const dry = flag("dry-run");

const RECRAFT_KEY = process.env.RECRAFT_API_KEY;
const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = process.env.HF_MODEL ?? "black-forest-labs/FLUX.1-schnell";

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
  const plan = ART_SLOTS.filter((s) => (!only || only.includes(s.id)) && (!toolFilter || s.tool === toolFilter));
  console.log(`${plan.length} slots${dry ? " (dry run)" : ""}`);
  let ok = 0;
  let skipped = 0;
  let failed = 0;
  for (const slot of plan) {
    const file = resolve(OUT_DIR, `${slot.id}.png`);
    if (existsSync(file) && !force) {
      skipped += 1;
      continue;
    }
    console.log(`${slot.tool === "recraft" ? "[recraft]" : "[hf]     "} ${slot.id}  ${slot.width}x${slot.height}`);
    if (dry) continue;
    try {
      const buf = slot.tool === "recraft" ? await recraft(slot) : await huggingFace(slot);
      writeFileSync(file, buf);
      ok += 1;
      await sleep(slot.tool === "recraft" ? 1200 : 2500);
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
