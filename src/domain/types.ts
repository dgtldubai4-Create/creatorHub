// Domain types for the Dabur Squad portal.
// Every entity has a stable string id. Nothing here knows about React.

export type Lang = "en" | "ar";
export type Localised = { en: string; ar: string };

export type Market = "UAE" | "KSA";
export type Platform = "instagram" | "tiktok";
export type Seat = "creator" | "brand";
export type VerificationState = "pending" | "verified" | "action";
export type FollowerTier = "nano" | "micro" | "macro" | "mega";
export type Niche =
  | "haircare"
  | "beauty"
  | "family"
  | "wellness"
  | "food"
  | "fitness"
  | "lifestyle"
  | "oralcare"
  | "comedy";

// ---------- Brand & Product ----------

export interface Brand {
  id: string;
  name: string;
  localisedName: Localised;
  category: string;
  catalogueUrl: string;
  /** Brand colour used for product art and campaign accents. */
  hue: string;
}

export type PackType = "bottle" | "tube" | "jar" | "sachet" | "carton" | "pouch" | "box" | "spray";

export interface Product {
  id: string;
  brandId: string;
  names: Localised;
  type: string;
  packType: PackType;
  description: Localised;
  ingredients: string[];
  benefits: Localised[];
  usageSteps: Localised[];
  image: string | null;
  sourceUrl: string;
  /** true while the catalogue has not yet been replaced by scripts/sync-products.ts */
  pendingSync: boolean;
}

// ---------- Creator ----------

export interface Address {
  line1: string;
  city: string;
  market: Market;
  phone: string;
  confirmed: boolean;
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  market: Market;
  city: string;
  niche: Niche;
  tier: FollowerTier;
  followers: number;
  photo: string | null;
  /** Deterministic accent for the generated avatar. */
  hue: number;
  bio: Localised;
  verification: {
    identity: VerificationState;
    instagram: VerificationState;
    tiktok: VerificationState;
  };
  socials: Partial<Record<Platform, string>>;
  address: Address;
  joinedAt: string;
  /** Consecutive weeks with at least one completed action. */
  streakWeeks: number;
}

// ---------- Campaign ----------

export type CampaignStatus = "draft" | "inviting" | "active" | "review" | "publishing" | "completed";

export type CheckKey = "captions" | "loudness" | "hook" | "productVisibility" | "duration";

export interface AcceptanceCriterion {
  key: CheckKey;
  weight: number;
  /** Human-readable requirement, e.g. "Product in frame within the first 3 seconds". */
  label: Localised;
}

export interface Brief {
  deliverable: Localised;
  shotList: Localised[];
  dos: Localised[];
  donts: Localised[];
  acceptance: AcceptanceCriterion[];
  /** Target length in seconds. */
  durationSec: { min: number; max: number };
}

export interface Campaign {
  id: string;
  brandId: string;
  title: Localised;
  hook: Localised;
  status: CampaignStatus;
  brief: Brief;
  kit: { productId: string; qty: number }[];
  points: number;
  window: { start: string; end: string };
  targetNiches: Niche[];
  targetMarkets: Market[];
  targetTiers: FollowerTier[];
  createdAt: string;
}

// ---------- Participation (the central entity) ----------

export type Stage =
  | "invited"
  | "accepted"
  | "profile_confirmed"
  | "preparing"
  | "dispatched"
  | "out_for_delivery"
  | "delivered"
  | "shoot"
  | "first_cut"
  | "auto_check"
  | "manual_review"
  | "changes_requested"
  | "revised_cut"
  | "approved_to_publish"
  | "link_submitted"
  | "post_verified"
  | "points_released"
  | "completed"
  | "declined";

export interface StageLogEntry {
  stage: Stage;
  at: string;
  /** Optional short reason (e.g. decline reason, revision note). */
  note?: string;
  by?: string;
}

export interface CheckResult {
  key: CheckKey;
  passed: boolean;
  weight: number;
  note: Localised;
}

export interface AutoCheck {
  score: number;
  passed: boolean;
  results: CheckResult[];
  hash: string;
  simulated: true;
}

export interface Submission {
  id: string;
  participationId: string;
  filename: string;
  sizeBytes: number;
  durationSec: number;
  version: number;
  uploadedAt: string;
  check: AutoCheck;
}

export interface TimedNote {
  t: number;
  text: string;
}

export interface Review {
  id: string;
  participationId: string;
  submissionId: string;
  decision: "changes" | "approved";
  note: string;
  notes: TimedNote[];
  reviewerId: string;
  reviewerName: string;
  at: string;
}

export type ShipmentStatus = "address_confirmed" | "preparing" | "dispatched" | "out_for_delivery" | "delivered";
export type Courier = "Aramex" | "Fetchr" | "SMSA" | "DHL Express";

export interface Shipment {
  courier: Courier;
  trackingNumber: string;
  status: ShipmentStatus;
  updatedAt: string;
  simulated: true;
}

export interface Publish {
  platform: Platform;
  url: string;
  postedAt: string;
  verified: boolean;
  verifiedAt?: string;
}

export interface Participation {
  id: string;
  creatorId: string;
  campaignId: string;
  stage: Stage;
  stageLog: StageLogEntry[];
  submissions: Submission[];
  reviews: Review[];
  shipment: Shipment | null;
  publish: Publish | null;
  invitedAt: string;
}

// ---------- Side quests ----------

export type QuestState = "open" | "joined" | "submitted" | "reviewed" | "completed";

export interface SideQuest {
  id: string;
  title: Localised;
  prompt: Localised;
  brandId: string | null;
  points: number;
  deadline: string;
  /** Per-creator state map. A creator absent from the map sees the quest as "open". */
  states: Record<string, QuestState>;
  submissions: Record<string, { filename: string; at: string }>;
  emojiFree: true;
}

// ---------- Loyalty ----------

export interface LedgerEntry {
  id: string;
  creatorId: string;
  delta: number;
  reason: Localised;
  ref: { kind: "participation" | "quest" | "redemption" | "bonus"; id: string };
  at: string;
}

export interface Reward {
  id: string;
  title: Localised;
  description: Localised;
  cost: number;
  kind: "product" | "experience" | "voucher" | "boost";
  brandId: string | null;
  stock: number;
}

export interface Redemption {
  id: string;
  creatorId: string;
  rewardId: string;
  cost: number;
  status: "requested" | "fulfilled";
  at: string;
  fulfilledAt?: string;
}

export interface Badge {
  id: string;
  title: Localised;
  description: Localised;
  /** Predicate key evaluated by selectors. */
  rule: "first_campaign" | "three_campaigns" | "first_quest" | "streak_4" | "all_verified" | "first_publish" | "five_published" | "revision_free" | "early_bird";
  icon: string;
}

// ---------- Notifications ----------

export interface Notification {
  id: string;
  /** "creator:<id>" or "brand" */
  audience: string;
  channel: "email" | "push" | "inapp";
  title: Localised;
  body: Localised;
  link?: string;
  at: string;
  read: boolean;
  simulated: true;
}

// ---------- Roles ----------

export type Role = "super_admin" | "brand_manager" | "campaign_manager" | "content_reviewer" | "logistics" | "finance";
export type Permission = "campaigns" | "invite" | "review" | "logistics" | "loyalty" | "products";

export interface BrandUser {
  id: string;
  name: string;
  role: Role;
  market: Market | "all";
}

// ---------- Session & root state ----------

export interface Session {
  seat: Seat | null;
  creatorId: string | null;
  role: Role;
  brandUserId: string;
}

export interface AppState {
  seedVersion: string;
  lang: Lang;
  session: Session;
  brands: Brand[];
  products: Product[];
  creators: Creator[];
  campaigns: Campaign[];
  participations: Participation[];
  quests: SideQuest[];
  ledger: LedgerEntry[];
  rewards: Reward[];
  redemptions: Redemption[];
  badges: Badge[];
  notifications: Notification[];
  brandUsers: BrandUser[];
  /** Simulated wall clock, advanced by the reducer so seeds and demos are deterministic. */
  now: string;
  /** Transient, never persisted. */
  lastError?: { message: string; at: string; action: string };
}
