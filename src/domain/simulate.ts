// Everything external is simulated in-process. Every result carries `simulated: true`
// and the UI labels it as such.
import type { AcceptanceCriterion, AutoCheck, CheckKey, CheckResult, Courier, Localised, ShipmentStatus, Stage } from "./types";

/** FNV-1a 32-bit. Deterministic, dependency-free, good enough to fan out into a bit field. */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function hashToHex(n: number): string {
  return n.toString(16).padStart(8, "0");
}

const CHECK_ORDER: readonly CheckKey[] = ["captions", "loudness", "hook", "productVisibility", "duration"];

const NOTES: Record<CheckKey, { pass: Localised; fail: Localised }> = {
  captions: {
    pass: { en: "Burned-in captions detected on every spoken line.", ar: "تم رصد ترجمات مدمجة على كل جملة منطوقة." },
    fail: { en: "No captions found between 0:04 and 0:11. Add burned-in captions.", ar: "لا توجد ترجمات بين 0:04 و0:11. أضِف ترجمات مدمجة." },
  },
  loudness: {
    pass: { en: "Integrated loudness sits inside the -16 to -12 LUFS band.", ar: "مستوى الصوت ضمن النطاق المطلوب من -16 إلى -12 LUFS." },
    fail: { en: "Audio peaks above -1 dBTP and dialogue dips under -20 LUFS. Normalise before resubmitting.", ar: "الصوت يتجاوز -1 dBTP والحوار ينخفض تحت -20 LUFS. اضبط المستوى قبل إعادة الرفع." },
  },
  hook: {
    pass: { en: "The hook lands inside the first 3 seconds.", ar: "الافتتاحية تظهر خلال أول 3 ثوانٍ." },
    fail: { en: "The first cut to the product happens at 0:06. Bring the hook forward.", ar: "أول لقطة للمنتج تظهر عند 0:06. قدّم الافتتاحية." },
  },
  productVisibility: {
    pass: { en: "Pack is readable in frame for over 4 seconds total.", ar: "العبوة واضحة في الإطار لأكثر من 4 ثوانٍ إجمالاً." },
    fail: { en: "Pack is partly covered by the caption safe zone. Reframe or move captions.", ar: "العبوة مغطاة جزئياً بمنطقة الترجمة. أعد التأطير أو حرّك الترجمة." },
  },
  duration: {
    pass: { en: "Runtime is inside the brief window.", ar: "المدة ضمن النطاق المطلوب في الموجز." },
    fail: { en: "Runtime falls outside the brief window. Trim or extend.", ar: "المدة خارج النطاق المطلوب. قصّ أو أطِل المقطع." },
  },
};

export const PASS_THRESHOLD = 70;

/**
 * Deterministic automated content check.
 * Hash `filename:size:version` into a bit field, evaluate each acceptance criterion
 * into pass/fail, weight into a 0-100 score. Later versions bias toward passing so
 * the revise loop converges: version n gets n independent chances per check.
 */
export function autoCheck(
  filename: string,
  sizeBytes: number,
  version: number,
  criteria: AcceptanceCriterion[],
  durationSec: number,
  window: { min: number; max: number },
): AutoCheck {
  const key = `${filename}:${sizeBytes}:${version}`;
  const hash = fnv1a(key);
  // One bit field per version so far; a check passes if any version's bit is set.
  // The set only grows with the version number, so v(n+1) can never score below v(n).
  const fields = Array.from({ length: Math.max(1, version) }, (_, k) => fnv1a(`${filename}:${sizeBytes}:${k + 1}`));
  const results: CheckResult[] = criteria.map((c) => {
    const i = CHECK_ORDER.indexOf(c.key);
    let passed: boolean;
    if (c.key === "duration") {
      // Duration is the one check we can evaluate for real.
      passed = durationSec >= window.min && durationSec <= window.max;
    } else {
      passed = fields.some((f) => ((f >>> i) & 1) === 1);
    }
    return { key: c.key, passed, weight: c.weight, note: passed ? NOTES[c.key].pass : NOTES[c.key].fail };
  });
  const total = results.reduce((s, r) => s + r.weight, 0) || 1;
  const earned = results.reduce((s, r) => s + (r.passed ? r.weight : 0), 0);
  const score = Math.round((earned / total) * 100);
  return { score, passed: score >= PASS_THRESHOLD, results, hash: hashToHex(hash), simulated: true };
}

// ---------- Courier ----------

export const COURIERS: readonly Courier[] = ["Aramex", "Fetchr", "SMSA", "DHL Express"];

const PREFIX: Record<Courier, string> = { Aramex: "ARX", Fetchr: "FTC", SMSA: "SMS", "DHL Express": "DHL" };

export function trackingNumber(courier: Courier, seed: string): string {
  const h = fnv1a(`${courier}:${seed}`);
  const digits = (h % 1_000_000_000).toString().padStart(9, "0");
  return `${PREFIX[courier]}${digits}AE`;
}

export const SHIPMENT_ORDER: readonly ShipmentStatus[] = ["address_confirmed", "preparing", "dispatched", "out_for_delivery", "delivered"];

export function nextShipmentStatus(s: ShipmentStatus): ShipmentStatus | null {
  const i = SHIPMENT_ORDER.indexOf(s);
  return i < SHIPMENT_ORDER.length - 1 ? SHIPMENT_ORDER[i + 1] : null;
}

/** Shipment status and journey stage advance in lockstep. */
export const SHIPMENT_STAGE: Record<ShipmentStatus, Stage> = {
  address_confirmed: "profile_confirmed",
  preparing: "preparing",
  dispatched: "dispatched",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
};

// ---------- Ids ----------

let counter = 0;
export function newId(prefix: string, seed?: string): string {
  counter += 1;
  const salt = seed ? hashToHex(fnv1a(seed + counter)) : hashToHex(fnv1a(`${Date.now()}:${counter}:${Math.random()}`));
  return `${prefix}_${salt}`;
}

export function resetIdCounter(): void {
  counter = 0;
}

// ---------- Content-check-free helpers ----------

export function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export function addDays(iso: string, days: number): string {
  return addMinutes(iso, days * 24 * 60);
}
