import type { AppState, Badge, Campaign, Creator, Participation, Stage } from "./types";
import { actorFor, phaseOf, stageProgress } from "./stages";

// Every list view derives from the same entities. Nothing here is cached state.

export function balance(state: AppState, creatorId: string): number {
  return state.ledger.filter((l) => l.creatorId === creatorId).reduce((s, l) => s + l.delta, 0);
}

export function lifetimePoints(state: AppState, creatorId: string): number {
  return state.ledger.filter((l) => l.creatorId === creatorId && l.delta > 0).reduce((s, l) => s + l.delta, 0);
}

/** Standing tiers named after how a banyan grows. */
export type Standing = "seed" | "sprout" | "bloom" | "banyan";
export const STANDING_THRESHOLDS: Record<Standing, number> = { seed: 0, sprout: 500, bloom: 1500, banyan: 4000 };

export function standing(state: AppState, creatorId: string): { tier: Standing; points: number; next: Standing | null; toNext: number; progress: number } {
  const points = lifetimePoints(state, creatorId);
  const order: Standing[] = ["seed", "sprout", "bloom", "banyan"];
  let tier: Standing = "seed";
  for (const t of order) if (points >= STANDING_THRESHOLDS[t]) tier = t;
  const idx = order.indexOf(tier);
  const next = order[idx + 1] ?? null;
  const floor = STANDING_THRESHOLDS[tier];
  const ceil = next ? STANDING_THRESHOLDS[next] : floor;
  const toNext = next ? ceil - points : 0;
  const progress = next ? (points - floor) / (ceil - floor) : 1;
  return { tier, points, next, toNext, progress };
}

export function participationsFor(state: AppState, creatorId: string): Participation[] {
  return state.participations.filter((p) => p.creatorId === creatorId).sort((a, b) => b.invitedAt.localeCompare(a.invitedAt));
}

export function campaignById(state: AppState, id: string): Campaign | undefined {
  return state.campaigns.find((c) => c.id === id);
}

export function creatorById(state: AppState, id: string): Creator | undefined {
  return state.creators.find((c) => c.id === id);
}

export function participationById(state: AppState, id: string): Participation | undefined {
  return state.participations.find((p) => p.id === id);
}

export function invitationsFor(state: AppState, creatorId: string): Participation[] {
  return participationsFor(state, creatorId).filter((p) => p.stage === "invited");
}

export function activeFor(state: AppState, creatorId: string): Participation[] {
  return participationsFor(state, creatorId).filter((p) => p.stage !== "invited" && p.stage !== "declined" && p.stage !== "completed");
}

export function completedFor(state: AppState, creatorId: string): Participation[] {
  return participationsFor(state, creatorId).filter((p) => p.stage === "completed");
}

export interface NextAction {
  kind: "respond" | "confirm_address" | "track" | "shoot" | "upload" | "revise" | "publish" | "wait" | "quest" | "rest";
  participation?: Participation;
  questId?: string;
}

/** The single next best action for the creator home. */
export function nextBestAction(state: AppState, creatorId: string): NextAction {
  const mine = participationsFor(state, creatorId);
  const byStage = (s: Stage) => mine.find((p) => p.stage === s);
  const invited = byStage("invited");
  if (invited) return { kind: "respond", participation: invited };
  const changes = byStage("changes_requested");
  if (changes) return { kind: "revise", participation: changes };
  const approved = byStage("approved_to_publish");
  if (approved) return { kind: "publish", participation: approved };
  const accepted = byStage("accepted");
  if (accepted) return { kind: "confirm_address", participation: accepted };
  const shoot = byStage("shoot");
  if (shoot) return { kind: "upload", participation: shoot };
  const delivered = byStage("delivered");
  if (delivered) return { kind: "shoot", participation: delivered };
  const inTransit = mine.find((p) => ["preparing", "dispatched", "out_for_delivery"].includes(p.stage));
  if (inTransit) return { kind: "track", participation: inTransit };
  const waiting = mine.find((p) => actorFor(p.stage) === "brand");
  if (waiting) return { kind: "wait", participation: waiting };
  const quest = state.quests.find((q) => (q.states[creatorId] ?? "open") === "open" || q.states[creatorId] === "joined");
  if (quest) return { kind: "quest", questId: quest.id };
  return { kind: "rest" };
}

export function unreadCount(state: AppState, audience: string): number {
  return state.notifications.filter((n) => n.audience === audience && !n.read).length;
}

export function notificationsFor(state: AppState, audience: string) {
  return state.notifications.filter((n) => n.audience === audience);
}

// ---------- brand-team views ----------

export function reviewQueue(state: AppState): Participation[] {
  return state.participations.filter((p) => p.stage === "manual_review").sort((a, b) => a.stageLog[a.stageLog.length - 1].at.localeCompare(b.stageLog[b.stageLog.length - 1].at));
}

export function verifyQueue(state: AppState): Participation[] {
  return state.participations.filter((p) => p.stage === "link_submitted");
}

export function logisticsQueue(state: AppState): Participation[] {
  return state.participations.filter((p) => p.shipment && p.shipment.status !== "delivered").sort((a, b) => a.shipment!.updatedAt.localeCompare(b.shipment!.updatedAt));
}

export function pointsQueue(state: AppState): Participation[] {
  return state.participations.filter((p) => p.stage === "post_verified");
}

export function campaignParticipations(state: AppState, campaignId: string): Participation[] {
  return state.participations.filter((p) => p.campaignId === campaignId);
}

/** Aggregate phase counts across a campaign for the admin campaign card. */
export function campaignFunnel(state: AppState, campaignId: string) {
  const ps = campaignParticipations(state, campaignId);
  const counts = { invite: 0, kit: 0, create: 0, review: 0, publish: 0, done: 0, declined: 0 };
  for (const p of ps) {
    if (p.stage === "declined") counts.declined += 1;
    else counts[phaseOf(p.stage)] += 1;
  }
  return { total: ps.length, counts, progress: ps.length ? ps.reduce((s, p) => s + stageProgress(p.stage), 0) / ps.length : 0 };
}

export interface MatchScore {
  score: number;
  reasons: { key: "niche" | "market" | "tier" | "verified" | "history" | "streak"; ok: boolean; weight: number }[];
}

/** Deterministic creator-to-campaign match score for the shortlist view. */
export function matchScore(state: AppState, creator: Creator, campaign: Campaign): MatchScore {
  const history = completedFor(state, creator.id).length;
  const allVerified = Object.values(creator.verification).every((v) => v === "verified");
  const reasons: MatchScore["reasons"] = [
    { key: "niche", ok: campaign.targetNiches.includes(creator.niche), weight: 35 },
    { key: "market", ok: campaign.targetMarkets.includes(creator.market), weight: 25 },
    { key: "tier", ok: campaign.targetTiers.includes(creator.tier), weight: 15 },
    { key: "verified", ok: allVerified, weight: 10 },
    { key: "history", ok: history > 0, weight: 10 },
    { key: "streak", ok: creator.streakWeeks >= 3, weight: 5 },
  ];
  const score = reasons.reduce((s, r) => s + (r.ok ? r.weight : 0), 0);
  return { score, reasons };
}

export function earnedBadges(state: AppState, creatorId: string): Badge[] {
  const creator = creatorById(state, creatorId);
  if (!creator) return [];
  const mine = participationsFor(state, creatorId);
  const completed = mine.filter((p) => p.stage === "completed");
  const verifiedPosts = mine.filter((p) => p.publish?.verified).length;
  const questDone = state.quests.some((q) => q.states[creatorId] === "completed");
  const revisionFree = mine.some((p) => p.reviews.length === 1 && p.reviews[0].decision === "approved");
  const earlyBird = mine.some((p) => {
    const inv = p.stageLog.find((e) => e.stage === "invited");
    const acc = p.stageLog.find((e) => e.stage === "accepted");
    return inv && acc && new Date(acc.at).getTime() - new Date(inv.at).getTime() <= 24 * 60 * 60 * 1000;
  });
  const rules: Record<Badge["rule"], boolean> = {
    first_campaign: completed.length >= 1,
    three_campaigns: completed.length >= 3,
    first_quest: questDone,
    streak_4: creator.streakWeeks >= 4,
    all_verified: Object.values(creator.verification).every((v) => v === "verified"),
    first_publish: verifiedPosts >= 1,
    five_published: verifiedPosts >= 5,
    revision_free: revisionFree,
    early_bird: earlyBird,
  };
  return state.badges.filter((b) => rules[b.rule]);
}

export function adminOverview(state: AppState) {
  const live = state.campaigns.filter((c) => ["inviting", "active", "review", "publishing"].includes(c.status)).length;
  const inFlight = state.participations.filter((p) => !["completed", "declined", "invited"].includes(p.stage)).length;
  const pendingReview = reviewQueue(state).length;
  const toShip = logisticsQueue(state).length;
  const toVerify = verifyQueue(state).length;
  const toRelease = pointsQueue(state).length;
  const toFulfil = state.redemptions.filter((r) => r.status === "requested").length;
  const verifiedCreators = state.creators.filter((c) => c.verification.identity === "verified").length;
  const pointsOut = state.ledger.filter((l) => l.delta > 0).reduce((s, l) => s + l.delta, 0);
  return { live, inFlight, pendingReview, toShip, toVerify, toRelease, toFulfil, verifiedCreators, creators: state.creators.length, pointsOut };
}
