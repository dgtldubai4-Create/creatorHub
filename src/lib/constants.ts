// Single source of truth for enum-like values stored as Strings in SQLite.
// When the datasource moves to Postgres these become native Prisma enums.

export const ROLES = ["CREATOR", "MARKETER", "BRAND_LEAD", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const REGIONS = ["UAE", "KSA", "KUWAIT", "QATAR", "OMAN", "BAHRAIN", "EGYPT"] as const;
export type Region = (typeof REGIONS)[number];

export const CATEGORIES = ["HAIR", "ORAL", "SKIN", "GROOMING", "KIDS_FAMILY"] as const;
export type Category = (typeof CATEGORIES)[number];

// The real Dabur Middle East portfolio (per brand team, Sep 2026).
export const BRANDS = [
  "VATIKA_NATURALS",
  "DABUR_AMLA",
  "AMLA_KIDS",
  "VATIKA_MENZ",
  "HERBOLENE",
  "DABUR_MISWAK",
  "DERMOVIVA",
] as const;
export type Brand = (typeof BRANDS)[number];

export const PLATFORMS = ["INSTAGRAM", "TIKTOK", "YOUTUBE", "SNAPCHAT"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const FOLLOWER_TIERS = ["NANO", "MICRO", "MACRO", "MEGA"] as const;
export type FollowerTier = (typeof FOLLOWER_TIERS)[number];

export const COLLAB_TYPES = ["BARTER", "PAID", "BOTH"] as const;
export type CollabType = (typeof COLLAB_TYPES)[number];

export const CREATOR_STATUSES = ["PROSPECT", "ACTIVE", "PAUSED"] as const;
export type CreatorStatus = (typeof CREATOR_STATUSES)[number];

export const CAMPAIGN_STATUSES = ["PLANNING", "LIVE", "CLOSED"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const JOIN_REQUEST_TYPES = ["JOIN", "BARTER"] as const;
export type JoinRequestType = (typeof JOIN_REQUEST_TYPES)[number];

export const DECISION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export const ASSET_TYPES = ["REEL", "STORY", "UGC", "POST"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const ASSET_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "LIVE"] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

// ── Display labels ───────────────────────────────────────────────────────────

export const BRAND_LABELS: Record<Brand, string> = {
  VATIKA_NATURALS: "Vatika Naturals",
  DABUR_AMLA: "Dabur Amla",
  AMLA_KIDS: "Amla Kids",
  VATIKA_MENZ: "Vatika Menz",
  HERBOLENE: "Herbolene",
  DABUR_MISWAK: "Dabur Miswak",
  DERMOVIVA: "Dermoviva",
};

export const BRAND_TAGLINES: Record<Brand, string> = {
  VATIKA_NATURALS: "Hair & body",
  DABUR_AMLA: "Hair oils · est. 1940",
  AMLA_KIDS: "Kids haircare",
  VATIKA_MENZ: "Styling",
  HERBOLENE: "Skin",
  DABUR_MISWAK: "Oral care",
  DERMOVIVA: "Skin & baby",
};

/** Which creator category each brand primarily casts from. */
export const BRAND_CATEGORY: Record<Brand, Category> = {
  VATIKA_NATURALS: "HAIR",
  DABUR_AMLA: "HAIR",
  AMLA_KIDS: "KIDS_FAMILY",
  VATIKA_MENZ: "GROOMING",
  HERBOLENE: "SKIN",
  DABUR_MISWAK: "ORAL",
  DERMOVIVA: "SKIN",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  HAIR: "Hair",
  ORAL: "Oral care",
  SKIN: "Skin",
  GROOMING: "Men's grooming",
  KIDS_FAMILY: "Kids & family",
};

export const REGION_LABELS: Record<Region, string> = {
  UAE: "UAE",
  KSA: "KSA",
  KUWAIT: "Kuwait",
  QATAR: "Qatar",
  OMAN: "Oman",
  BAHRAIN: "Bahrain",
  EGYPT: "Egypt",
};

export const REGION_FLAGS: Record<Region, string> = {
  UAE: "🇦🇪",
  KSA: "🇸🇦",
  KUWAIT: "🇰🇼",
  QATAR: "🇶🇦",
  OMAN: "🇴🇲",
  BAHRAIN: "🇧🇭",
  EGYPT: "🇪🇬",
};

export const TIER_LABELS: Record<FollowerTier, string> = {
  NANO: "Nano · <10K",
  MICRO: "Micro · 10–100K",
  MACRO: "Macro · 100K–1M",
  MEGA: "Mega · 1M+",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  SNAPCHAT: "Snapchat",
};

export const COLLAB_LABELS: Record<CollabType, string> = {
  BARTER: "Barter",
  PAID: "Paid",
  BOTH: "Barter + Paid",
};

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  REEL: "Reel",
  STORY: "Story",
  UGC: "UGC",
  POST: "Post",
};

/** Brand banner gradients — tuned for the light Miles & Stamps system. */
export const BRAND_GRADIENTS: Record<Brand, string> = {
  VATIKA_NATURALS: "from-emerald-600 to-teal-700",
  DABUR_AMLA: "from-green-700 to-emerald-900",
  AMLA_KIDS: "from-pink-500 to-rose-600",
  VATIKA_MENZ: "from-slate-700 to-zinc-900",
  HERBOLENE: "from-lime-600 to-green-700",
  DABUR_MISWAK: "from-amber-600 to-yellow-800",
  DERMOVIVA: "from-sky-500 to-cyan-700",
};

/** Soft chip tones per brand (bg + text), for the light system. */
export const BRAND_TONES: Record<Brand, string> = {
  VATIKA_NATURALS: "bg-emerald-100 text-emerald-800",
  DABUR_AMLA: "bg-green-100 text-green-900",
  AMLA_KIDS: "bg-pink-100 text-pink-800",
  VATIKA_MENZ: "bg-slate-200 text-slate-800",
  HERBOLENE: "bg-lime-100 text-lime-800",
  DABUR_MISWAK: "bg-amber-100 text-amber-800",
  DERMOVIVA: "bg-sky-100 text-sky-800",
};

// ── JSON field helpers (SQLite stores JSON as strings) ──────────────────────

export function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export type Handles = Partial<Record<Platform, string>>;
export const parseHandles = (raw: string): Handles => parseJson<Handles>(raw, {});
export const parseTags = (raw: string): string[] => parseJson<string[]>(raw, []);
export const parseKpis = (raw: string): Record<string, string> =>
  parseJson<Record<string, string>>(raw, {});
export const parseStringList = (raw: string): string[] => parseJson<string[]>(raw, []);
export const parseNumberList = (raw: string): number[] => parseJson<number[]>(raw, []);
