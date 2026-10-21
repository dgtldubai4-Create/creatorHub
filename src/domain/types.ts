// Domain types for the Dabur Squad portal.
// Every entity has a stable string id. Nothing here knows about React.

export type Lang = "en" | "ar";
export type Localised = { en: string; ar: string };

export type Market = "UAE" | "KSA" | "Kuwait" | "Qatar" | "Oman" | "Bahrain";
export type Language = "ar" | "en";
/** Program levels. Recalculated each season from Sparks and quality; Ambassador is selected. */
export type Level = "member" | "insider" | "pro" | "ambassador";
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
  /** Audience data pulled through the (simulated) platform APIs on connect. */
  connected: Partial<Record<Platform, ConnectedAccount>>;
  languages: Language[];
  /** The playful one-liner from the application: "your vibe". */
  vibe: Localised;
  favouritePosts: string[];
  email: string;
  mobile: string;
  mobileVerified: boolean;
  /** Creator advertising licence (required for paid content in UAE and KSA). */
  licence: { state: VerificationState; number?: string };
  address: Address;
  joinedAt: string;
  /** Consecutive months with at least one Sparks-earning action. */
  streakMonths: number;
  referredBy?: string;
}

export interface ConnectedAccount {
  handle: string;
  followers: number;
  engagementRate: number;
  connectedAt: string;
  simulated: true;
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

// ---------- Missions ----------

export type MissionType = "starter" | "routine" | "monthly" | "team" | "review" | "event" | "academy" | "referral";
export type MissionStatus = "draft" | "live" | "closed";
export type EntryState = "joined" | "submitted" | "approved" | "changes" | "completed";

/** Deterministic pre-review check on a mission submission. */
export interface MissionCheck {
  hashtags: boolean;
  disclosure: boolean;
  timing: boolean;
  passed: boolean;
  simulated: true;
}

export interface MissionSubmission {
  id: string;
  url: string;
  caption: string;
  at: string;
  check: MissionCheck;
  decision?: "approved" | "changes";
  note?: string;
  reviewedAt?: string;
  reviewerName?: string;
}

export interface MissionEntry {
  state: EntryState;
  joinedAt: string;
  squadId?: string;
  submissions: MissionSubmission[];
  /** Sparks actually awarded (doubled during a surprise drop). */
  awarded?: number;
}

export interface Squad {
  id: string;
  name: Localised;
  memberIds: string[];
}

export interface Mission {
  id: string;
  type: MissionType;
  status: MissionStatus;
  title: Localised;
  prompt: Localised;
  brandId: string | null;
  sparks: number;
  /** Sparks the creator gets if the mission is paid work (Pro level and up). */
  paid: boolean;
  window: { start: string; end: string };
  markets: Market[];
  languages: Language[];
  niches: Niche[];
  levelRequired: Level;
  requiredHashtags: string[];
  /** Surprise drop: double Sparks until this time. */
  doubleSparksUntil?: string;
  /** Routine missions wrap a campaign journey. */
  campaignId?: string;
  /** Academy missions require this track to be completed first. */
  trackId?: string;
  place?: Localised;
  squads?: Squad[];
  entries: Record<string, MissionEntry>;
}

// ---------- Seasons & Ambassadors ----------

export type AmbassadorPhase = "upcoming" | "wildcard_open" | "voting" | "selected";

export interface Season {
  id: string;
  name: Localised;
  theme: Localised;
  start: string;
  end: string;
  finalePrize: Localised;
  ambassadors: {
    phase: AmbassadorPhase;
    /** Top Pro creators invited by Sparks and quality. */
    shortlist: string[];
    /** Public wildcard entries from newcomers. */
    wildcards: string[];
    /** voterId -> candidateId. One vote per creator per season. */
    votes: Record<string, string>;
    cohort: string[];
  };
}

// ---------- Academy ----------

export type ModuleKind = "video" | "live" | "workshop" | "walkthrough" | "session";

export interface AcademyModule {
  id: string;
  title: Localised;
  summary: Localised;
  minutes: number;
  kind: ModuleKind;
}

export interface AcademyTrack {
  id: string;
  title: Localised;
  blurb: Localised;
  format: Localised;
  levelRequired: Level;
  sparks: number;
  modules: AcademyModule[];
}

export interface MentorSession {
  id: string;
  title: Localised;
  kind: "group" | "one_to_one";
  mentor: string;
  at: string;
  levelRequired: Level;
  seats: number;
  bookedBy: string[];
}

export interface Referral {
  id: string;
  referrerId: string;
  handle: string;
  status: "pending" | "approved" | "rejected";
  at: string;
}

// ---------- Loyalty ----------

export interface LedgerEntry {
  id: string;
  creatorId: string;
  delta: number;
  reason: Localised;
  ref: { kind: "participation" | "mission" | "academy" | "referral" | "streak" | "redemption" | "bonus"; id: string };
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
  rule:
    | "first_campaign"
    | "three_campaigns"
    | "first_mission"
    | "streak_3"
    | "all_verified"
    | "first_publish"
    | "five_published"
    | "revision_free"
    | "early_bird"
    | "first_paid"
    | "academy_graduate"
    | "top_voted"
    | "squad_player"
    | "referrer";
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
  missions: Mission[];
  seasons: Season[];
  academy: {
    tracks: AcademyTrack[];
    /** creatorId -> moduleId -> completedAt */
    progress: Record<string, Record<string, string>>;
    /** creatorId -> trackIds with a certificate */
    certificates: Record<string, string[]>;
  };
  mentorSessions: MentorSession[];
  referrals: Referral[];
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
