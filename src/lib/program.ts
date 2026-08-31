// ─────────────────────────────────────────────────────────────────────────────
// DaburStars program logic — tiers, point values, level math.
// Tier is always derived from lifetime points (never stored) so ledger and
// tier can't drift apart.
// ─────────────────────────────────────────────────────────────────────────────

export const PROGRAM_NAME = "DaburStars";

export const PROGRAM_TIERS = [
  {
    key: "SPROUT",
    label: "Sprout",
    emoji: "🌱",
    min: 0,
    blurb: "Every star starts as a seed. Join launches, learn the craft, earn your first points.",
    perks: ["Access to open launches", "Creator Academy", "Barter collabs", "Points on every approval"],
    gradient: "from-emerald-400 to-teal-600",
    ring: "ring-emerald-400/40",
    text: "text-emerald-700",
    soft: "bg-emerald-50 border-emerald-200",
  },
  {
    key: "TULSI",
    label: "Tulsi",
    emoji: "🌿",
    min: 500,
    blurb: "A trusted regular. Priority review and seasonal product drops land on your doorstep.",
    perks: ["48h priority review", "Seasonal product drops", "Rewards store access", "Tulsi badge on profile"],
    gradient: "from-dabur-500 to-dabur-700",
    ring: "ring-dabur-500/40",
    text: "text-dabur-700",
    soft: "bg-dabur-50 border-dabur-200",
  },
  {
    key: "AMLA",
    label: "Amla",
    emoji: "✨",
    min: 1500,
    blurb: "A headline creator. Paid-first briefs, campaign co-creation and amplified reach.",
    perks: ["Paid-first briefs", "Paid media amplification", "Campaign co-creation calls", "Early brief access"],
    gradient: "from-amber-400 to-orange-600",
    ring: "ring-amber-400/50",
    text: "text-amber-700",
    soft: "bg-amber-50 border-amber-200",
  },
  {
    key: "KESAR",
    label: "Kesar",
    emoji: "👑",
    min: 4000,
    blurb: "The saffron circle. Annual ambassador contracts, shoots, and a seat at the table.",
    perks: ["Ambassador contract track", "Brand shoot invitations", "Dubai creator summit", "Dedicated manager"],
    gradient: "from-rose-500 via-red-500 to-amber-500",
    ring: "ring-rose-400/50",
    text: "text-rose-700",
    soft: "bg-rose-50 border-rose-200",
  },
] as const;

export type ProgramTierKey = (typeof PROGRAM_TIERS)[number]["key"];
export type ProgramTier = (typeof PROGRAM_TIERS)[number];

export function tierForPoints(points: number): ProgramTier {
  let current: ProgramTier = PROGRAM_TIERS[0];
  for (const tier of PROGRAM_TIERS) {
    if (points >= tier.min) current = tier;
  }
  return current;
}

export function nextTier(points: number): ProgramTier | null {
  return PROGRAM_TIERS.find((t) => t.min > points) ?? null;
}

/** 0–1 progress from the current tier floor to the next tier floor. */
export function tierProgress(points: number): number {
  const current = tierForPoints(points);
  const next = nextTier(points);
  if (!next) return 1;
  return Math.min(1, (points - current.min) / (next.min - current.min));
}

export function tierByKey(key: string): ProgramTier {
  return PROGRAM_TIERS.find((t) => t.key === key) ?? PROGRAM_TIERS[0];
}

/** Index of a tier in the ladder (for min-tier gating). */
export function tierRank(key: string): number {
  const idx = PROGRAM_TIERS.findIndex((t) => t.key === key);
  return idx === -1 ? 0 : idx;
}

// ── Point values ─────────────────────────────────────────────────────────────

export const POINTS = {
  SIGNUP: 50,
  JOIN_APPROVED: 40,
  ASSET_LIVE_BONUS: 50, // on top of the campaign's basePoints at approval
} as const;

export const POINTS_EVENT_TYPES = [
  "SIGNUP",
  "JOIN_APPROVED",
  "ASSET_APPROVED",
  "ASSET_LIVE",
  "COURSE_COMPLETED",
  "REDEMPTION",
  "BONUS",
] as const;
export type PointsEventType = (typeof POINTS_EVENT_TYPES)[number];

export const POINTS_EVENT_LABELS: Record<PointsEventType, string> = {
  SIGNUP: "Joined DaburStars",
  JOIN_APPROVED: "Accepted into a launch",
  ASSET_APPROVED: "Content approved",
  ASSET_LIVE: "Content went live",
  COURSE_COMPLETED: "Academy course completed",
  REDEMPTION: "Reward redeemed",
  BONUS: "Bonus",
};

// ── Rewards / courses / earnings enums ───────────────────────────────────────

export const REWARD_CATEGORIES = ["PRODUCT", "EXPERIENCE", "BOOST", "VOUCHER"] as const;
export type RewardCategory = (typeof REWARD_CATEGORIES)[number];

export const REWARD_CATEGORY_LABELS: Record<RewardCategory, string> = {
  PRODUCT: "Product drop",
  EXPERIENCE: "Experience",
  BOOST: "Career boost",
  VOUCHER: "Voucher",
};

export const COURSE_LEVELS = ["FOUNDATION", "INTERMEDIATE", "ADVANCED"] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

export const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = {
  FOUNDATION: "Foundation",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const EARNING_STATUSES = ["PENDING", "APPROVED", "PAID"] as const;
export type EarningStatus = (typeof EARNING_STATUSES)[number];

// ── Brief JSON shapes (stored stringified in SQLite) ────────────────────────

export type Deliverable = { type: string; qty: number; notes?: string };

export type Lesson = { title: string; body: string };
export type QuizQuestion = { question: string; options: string[]; answer: number };

export function formatPoints(points: number): string {
  return points.toLocaleString("en-US");
}
