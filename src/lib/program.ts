// ─────────────────────────────────────────────────────────────────────────────
// DaburStars "Miles & Stamps" program logic.
// EARN (stamps + miles) → LEVEL (four classes, lifetime miles, never drops)
// → SPEND (shop; balance only). Tier is always derived from lifetimePoints.
// DB columns keep the neutral names points/lifetimePoints; "miles" is display
// language only.
// ─────────────────────────────────────────────────────────────────────────────

export const PROGRAM_NAME = "DaburStars";

export const PROGRAM_TIERS = [
  {
    key: "SCOUT",
    label: "Scout",
    emoji: "🧭",
    min: 0,
    blurb: "Day one. Play quests, take your first brief, earn your first stamp.",
    perks: ["Open campaigns", "Side quests", "The Academy", "Miles on every approval"],
    gradient: "from-emerald-500 to-teal-600",
    text: "text-emerald-700",
    soft: "bg-emerald-50 border-emerald-200",
  },
  {
    key: "VOYAGER",
    label: "Voyager",
    emoji: "🌿",
    min: 500,
    blurb: "A trusted regular — product drops find your doorstep first.",
    perks: ["48h priority review", "Seasonal product drops", "Full shop access", "Voyager badge"],
    gradient: "from-dabur-500 to-dabur-700",
    text: "text-dabur-700",
    soft: "bg-dabur-50 border-dabur-200",
  },
  {
    key: "ENVOY",
    label: "Envoy",
    emoji: "✨",
    min: 1500,
    blurb: "A headline creator — paid-first briefs and amplified reach.",
    perks: ["Paid-first briefs", "Paid media boosts", "Co-creation calls", "Early brief access"],
    gradient: "from-mango to-tang",
    text: "text-tang-deep",
    soft: "bg-tang-soft border-mango",
  },
  {
    key: "AMBASSADOR",
    label: "Ambassador",
    emoji: "🏆",
    min: 4000,
    blurb: "The endgame is real: a contract, shoots, and a seat at the table.",
    perks: ["Ambassador contract track", "Brand shoot invitations", "Dubai creator summit", "Dedicated manager"],
    gradient: "from-tang to-stampred",
    text: "text-stampred",
    soft: "bg-stampred-soft border-stampred",
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

// ── Mile values ──────────────────────────────────────────────────────────────

export const POINTS = {
  SIGNUP: 50,
  JOIN_APPROVED: 40,
  ASSET_LIVE_BONUS: 50, // on top of the campaign's basePoints at approval
  SIDE_QUEST_CAP: 325, // hard server-side cap on escrowed guest-quest miles
} as const;

export const POINTS_EVENT_TYPES = [
  "SIGNUP",
  "SIDE_QUEST",
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
  SIDE_QUEST: "Side quest cleared",
  JOIN_APPROVED: "Cast in a campaign",
  ASSET_APPROVED: "Stamped — content approved",
  ASSET_LIVE: "Content went live",
  COURSE_COMPLETED: "Academy course completed",
  REDEMPTION: "Shop redemption",
  BONUS: "Bonus",
};

// ── Shop / courses / earnings enums ─────────────────────────────────────────

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

/** Display formatting for miles. */
export function formatMiles(points: number): string {
  return points.toLocaleString("en-US");
}
// Back-compat alias used by earlier pages.
export const formatPoints = formatMiles;
