// Program rules in one place. Everything a creator reads on the "How Sparks work" page
// comes from here, so the published table can never drift from what the reducer pays.
import type { Level, Localised, Market, MissionType, PostFormat, SparksQuote } from "./types";

// ---------- Reach-weighted Sparks ----------

/** Format multiplier. A story only counts when the mission asks for one. */
export const FORMAT_MULT: Record<PostFormat, number> = { video: 1, post: 0.8, story: 0.5 };
export const FORMATS: PostFormat[] = ["video", "post", "story"];
export const DEFAULT_FORMATS: PostFormat[] = ["video", "post"];

export interface Band { min: number; mult: number }
/** Followers on the platform the post went out on. The floor is 1, so a small account never earns below base. */
export const REACH_BANDS: Band[] = [
  { min: 0, mult: 1 },
  { min: 5_000, mult: 1.05 },
  { min: 25_000, mult: 1.1 },
  { min: 100_000, mult: 1.2 },
  { min: 500_000, mult: 1.3 },
];
/** Engagement rate, percent. Small accounts usually sit in the higher bands. */
export const ENGAGEMENT_BANDS: Band[] = [
  { min: 0, mult: 1 },
  { min: 2, mult: 1.05 },
  { min: 4, mult: 1.1 },
  { min: 7, mult: 1.2 },
];
/** A post that features two or more Dabur brands. */
export const MULTI_BRAND_MULT = 1.1;
export const DOUBLE_MULT = 2;
export const ROUND_TO = 5;
/** Mission types paid flat: no social post to weigh. */
export const FLAT_TYPES: MissionType[] = ["referral", "review"];

export function bandFor(bands: Band[], value: number): Band {
  let hit = bands[0];
  for (const b of bands) if (value >= b.min) hit = b;
  return hit;
}

export interface QuoteInput {
  base: number;
  format: PostFormat;
  followers: number;
  engagementRate: number;
  brandCount: number;
  double?: boolean;
  flat?: boolean;
}

/** Base Sparks times format, reach, engagement and brand mix, rounded to 5, then doubled during a drop. */
export function quoteSparks(i: QuoteInput): SparksQuote {
  const formatMult = i.flat ? 1 : FORMAT_MULT[i.format];
  const reachMult = i.flat ? 1 : bandFor(REACH_BANDS, i.followers).mult;
  const engagementMult = i.flat ? 1 : bandFor(ENGAGEMENT_BANDS, i.engagementRate).mult;
  const brandMult = !i.flat && i.brandCount >= 2 ? MULTI_BRAND_MULT : 1;
  const weighted = Math.round((i.base * formatMult * reachMult * engagementMult * brandMult) / ROUND_TO) * ROUND_TO;
  const total = weighted * (i.double ? DOUBLE_MULT : 1);
  return { base: i.base, format: i.format, formatMult, followers: i.followers, reachMult, engagementRate: i.engagementRate, engagementMult, brandCount: i.brandCount, brandMult, double: !!i.double, flat: !!i.flat, total };
}

// ---------- Levels ----------

export const LEVEL_ORDER: Level[] = ["member", "insider", "pro", "ambassador"];
export const LEVEL_RULES = {
  insider: { sparks: 400, quality: 60 },
  pro: { sparks: 1200, quality: 75 },
};
/** Markets where paid creator work needs an advertising licence. */
export const LICENCE_MARKETS: Market[] = ["UAE", "KSA"];

export type TaskKey = "sparks" | "quality" | "starter" | "challenge" | "journey" | "certificate" | "licence" | "hold_pro" | "entered" | "selected";
/** Named things to finish on top of the Sparks and quality thresholds. */
export const LEVEL_TASKS: Record<Exclude<Level, "member">, TaskKey[]> = {
  insider: ["sparks", "quality", "starter", "challenge"],
  pro: ["sparks", "quality", "journey", "certificate", "licence"],
  ambassador: ["hold_pro", "entered", "selected"],
};

// ---------- Level-up kits ----------

export type KitLevel = Exclude<Level, "member">;
export const KIT_LEVELS: KitLevel[] = ["insider", "pro", "ambassador"];
/** One kit per creator per level, the first time they reach it. */
export const LEVEL_KITS: Record<KitLevel, { items: { productId: string; qty: number }[]; unboxSparks: number; missionId: string }> = {
  insider: {
    items: [{ productId: "vatika-black-seed-hair-oil", qty: 1 }, { productId: "dabur-herbl-charcoal-toothpaste", qty: 1 }, { productId: "dabur-honey", qty: 1 }],
    unboxSparks: 100,
    missionId: "ms_kit_insider",
  },
  pro: {
    items: [{ productId: "vatika-argan-hair-oil", qty: 1 }, { productId: "vatika-argan-shampoo", qty: 1 }, { productId: "dabur-amla-gold-hair-oil", qty: 1 }, { productId: "dermoviva-skin-naturals-lotion", qty: 1 }, { productId: "real-mango-juice", qty: 2 }],
    unboxSparks: 150,
    missionId: "ms_kit_pro",
  },
  ambassador: {
    items: [{ productId: "vatika-hammam-zaith", qty: 1 }, { productId: "vatika-black-seed-shampoo", qty: 1 }, { productId: "vatika-black-seed-conditioner", qty: 1 }, { productId: "dabur-amla-jasmine-hair-oil", qty: 1 }, { productId: "fem-gold-creme-bleach", qty: 1 }, { productId: "dabur-chyawanprash", qty: 1 }, { productId: "hajmola-imli", qty: 2 }],
    unboxSparks: 200,
    missionId: "ms_kit_ambassador",
  },
};

// ---------- Posts stay live, Sparks expire ----------

/** A post is re-checked this many days after approval. Gone means the Sparks go back. */
export const LIVE_DAYS = 30;
/** Sparks lapse after this long with no earning and no spending. */
export const EXPIRY_DAYS = 365;
export const EXPIRY_WARN_DAYS = 30;

// ---------- Squad charter ----------

export const CHARTER_VERSION = "2026.1";
export const CHARTER: { key: string; title: Localised; body: Localised }[] = [
  { key: "disclose", title: { en: "Say it is a partnership, every time", ar: "صرّح بالشراكة في كل مرة" }, body: { en: "Every post made for a mission or with a kit carries #ad or #gifted, or the platform's paid-partnership label.", ar: "كل منشور لمهمة أو بكيت يحمل #إعلان أو #هدية أو شارة الشراكة المدفوعة في المنصة." } },
  { key: "honest", title: { en: "Your honest opinion, no health claims", ar: "رأيك الصادق بلا ادعاءات صحية" }, body: { en: "Say what you really think. Do not promise medical or miracle results for any product.", ar: "قل ما تراه فعلاً. لا تَعِد بنتائج طبية أو خارقة لأي منتج." } },
  { key: "real", title: { en: "A real audience", ar: "جمهور حقيقي" }, body: { en: "No bought followers, likes or comments, and no engagement pods.", ar: "لا متابعين ولا إعجابات ولا تعليقات مشتراة، ولا مجموعات تفاعل مصطنعة." } },
  { key: "respect", title: { en: "Respect, on and off the mission", ar: "الاحترام داخل المهمة وخارجها" }, body: { en: "No hateful, discriminatory or bullying content on the accounts you connect, now or in the past.", ar: "لا محتوى كراهية أو تمييز أو تنمّر على الحسابات التي تربطها، الآن أو سابقاً." } },
  { key: "live", title: { en: "Posts stay up for 30 days", ar: "المنشورات تبقى 30 يوماً" }, body: { en: "We re-check the link after 30 days. If the post is gone, its Sparks go back.", ar: "نعيد فحص الرابط بعد 30 يوماً. إذا حُذف المنشور تُسترد سباركس الخاصة به." } },
  { key: "rules", title: { en: "Local rules apply", ar: "الأنظمة المحلية سارية" }, body: { en: "You hold the creator licence your country asks for before taking paid work, and you are 18 or over.", ar: "تحمل ترخيص صانع المحتوى المطلوب في بلدك قبل أي عمل مدفوع، وعمرك 18 عاماً أو أكثر." } },
];
