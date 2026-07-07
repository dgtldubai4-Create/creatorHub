// Single source of truth for enum-like values stored as Strings in SQLite.
// When the datasource moves to Postgres these become native Prisma enums.

export const ROLES = ["CREATOR", "MARKETER", "BRAND_LEAD", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const REGIONS = ["UAE", "KSA", "KUWAIT", "QATAR", "OMAN", "BAHRAIN", "EGYPT"] as const;
export type Region = (typeof REGIONS)[number];

export const CATEGORIES = ["HAIR", "ORAL", "HEALTH_OTC", "SKIN"] as const;
export type Category = (typeof CATEGORIES)[number];

export const BRANDS = ["DABUR_AMLA", "VATIKA", "HAJMOLA", "DABUR_HERBL", "REAL"] as const;
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
  DABUR_AMLA: "Dabur Amla",
  VATIKA: "Vatika",
  HAJMOLA: "Hajmola",
  DABUR_HERBL: "Dabur Herb'l",
  REAL: "Real",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  HAIR: "Hair",
  ORAL: "Oral",
  HEALTH_OTC: "Health / OTC",
  SKIN: "Skin",
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

export const BRAND_GRADIENTS: Record<Brand, string> = {
  DABUR_AMLA: "from-emerald-600 via-emerald-700 to-teal-800",
  VATIKA: "from-lime-600 via-emerald-700 to-emerald-900",
  HAJMOLA: "from-amber-500 via-orange-600 to-red-700",
  DABUR_HERBL: "from-teal-600 via-emerald-700 to-green-900",
  REAL: "from-orange-500 via-red-500 to-rose-700",
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
