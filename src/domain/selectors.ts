import type { AppState, Badge, Campaign, Creator, Level, Mission, MissionType, Participation, Season, Stage } from "./types";
import { actorFor, phaseOf, stageProgress } from "./stages";
import { monthKey, prevMonthKey } from "./simulate";

// Every list view derives from the same entities. Nothing here is cached state.

export function balance(state: AppState, creatorId: string): number {
  return state.ledger.filter((l) => l.creatorId === creatorId).reduce((s, l) => s + l.delta, 0);
}

export function lifetimeSparks(state: AppState, creatorId: string): number {
  return state.ledger.filter((l) => l.creatorId === creatorId && l.delta > 0).reduce((s, l) => s + l.delta, 0);
}

// ---------- Seasons ----------

export function currentSeason(state: AppState): Season {
  const day = state.now.slice(0, 10);
  return state.seasons.find((s) => s.start <= day && day <= s.end) ?? state.seasons[state.seasons.length - 1];
}

export function seasonById(state: AppState, id: string): Season | undefined {
  return state.seasons.find((s) => s.id === id);
}

export function seasonSparks(state: AppState, creatorId: string, season: Season = currentSeason(state)): number {
  return state.ledger
    .filter((l) => l.creatorId === creatorId && l.delta > 0 && l.at.slice(0, 10) >= season.start && l.at.slice(0, 10) <= season.end)
    .reduce((s, l) => s + l.delta, 0);
}

export function daysLeftInSeason(state: AppState, season: Season = currentSeason(state)): number {
  return Math.max(0, Math.ceil((new Date(season.end).getTime() - new Date(state.now).getTime()) / 86_400_000));
}

export function leaderboard(state: AppState, season: Season = currentSeason(state)): { creator: Creator; sparks: number; level: Level }[] {
  return state.creators
    .map((creator) => ({ creator, sparks: seasonSparks(state, creator.id, season), level: level(state, creator.id).level }))
    .filter((x) => x.sparks > 0)
    .sort((a, b) => b.sparks - a.sparks);
}

// ---------- Quality and levels ----------

/** 0-100. Share of reviewed submissions (campaign cuts and mission posts) that were approved, blended with auto-check scores. */
export function qualityScore(state: AppState, creatorId: string): number {
  const cuts = state.participations
    .filter((p) => p.creatorId === creatorId)
    .flatMap((p) => p.submissions.filter((s) => p.reviews.some((r) => r.submissionId === s.id)).map((s) => ({ score: s.check.score, approved: p.reviews.some((r) => r.submissionId === s.id && r.decision === "approved") })));
  const posts = state.missions.flatMap((m) => (m.entries[creatorId]?.submissions ?? []).filter((s) => s.decision).map((s) => ({ score: s.check.passed ? 100 : 50, approved: s.decision === "approved" })));
  const all = [...cuts, ...posts];
  // No reviewed content yet: neutral score, so Sparks alone can reach Insider but not Pro.
  if (all.length === 0) return 70;
  const auto = all.reduce((s, x) => s + x.score, 0) / all.length;
  const approved = (all.filter((x) => x.approved).length / all.length) * 100;
  return Math.round(auto * 0.4 + approved * 0.6);
}

export const LEVEL_ORDER: Level[] = ["member", "insider", "pro", "ambassador"];
export const LEVEL_RULES = {
  insider: { sparks: 400, quality: 60 },
  pro: { sparks: 1200, quality: 75 },
};

export function levelIndex(l: Level): number {
  return LEVEL_ORDER.indexOf(l);
}

export function level(state: AppState, creatorId: string): { level: Level; seasonSparks: number; quality: number; next: Level | null; toNext: number; progress: number } {
  const season = currentSeason(state);
  const sparks = seasonSparks(state, creatorId, season);
  const quality = qualityScore(state, creatorId);
  let lvl: Level = "member";
  if (sparks >= LEVEL_RULES.insider.sparks && quality >= LEVEL_RULES.insider.quality) lvl = "insider";
  if (sparks >= LEVEL_RULES.pro.sparks && quality >= LEVEL_RULES.pro.quality) lvl = "pro";
  if (season.ambassadors.cohort.includes(creatorId)) lvl = "ambassador";
  const next: Level | null = lvl === "member" ? "insider" : lvl === "insider" ? "pro" : lvl === "pro" ? "ambassador" : null;
  const target = next === "insider" ? LEVEL_RULES.insider.sparks : next === "pro" ? LEVEL_RULES.pro.sparks : sparks;
  const floor = lvl === "member" ? 0 : lvl === "insider" ? LEVEL_RULES.insider.sparks : LEVEL_RULES.pro.sparks;
  const toNext = next && next !== "ambassador" ? Math.max(0, target - sparks) : 0;
  const progress = next === "ambassador" || !next ? 1 : Math.min(1, (sparks - floor) / Math.max(1, target - floor));
  return { level: lvl, seasonSparks: sparks, quality, next, toNext, progress };
}

export function meetsLevel(state: AppState, creatorId: string, required: Level): boolean {
  return levelIndex(level(state, creatorId).level) >= levelIndex(required);
}

/** Consecutive months, ending this month or last month, with at least one Sparks-earning entry. */
export function monthlyStreak(state: AppState, creatorId: string): number {
  const months = new Set(state.ledger.filter((l) => l.creatorId === creatorId && l.delta > 0).map((l) => monthKey(l.at)));
  let key = monthKey(state.now);
  if (!months.has(key)) key = prevMonthKey(key);
  let n = 0;
  while (months.has(key)) {
    n += 1;
    key = prevMonthKey(key);
  }
  return n;
}

// ---------- Participations ----------

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

// ---------- Missions ----------

export function missionById(state: AppState, id: string): Mission | undefined {
  return state.missions.find((m) => m.id === id);
}

export function isDoubleSparks(state: AppState, m: Mission): boolean {
  return !!m.doubleSparksUntil && m.doubleSparksUntil > state.now;
}

export function missionSparks(state: AppState, m: Mission): number {
  return isDoubleSparks(state, m) ? m.sparks * 2 : m.sparks;
}

/** Missions a creator can see: live, in their market, in a language they speak, in their niche (or open to all), at their level. */
export function missionsFor(state: AppState, creator: Creator): Mission[] {
  const lvl = level(state, creator.id).level;
  return state.missions.filter(
    (m) =>
      m.status === "live" &&
      m.markets.includes(creator.market) &&
      m.languages.some((l) => creator.languages.includes(l)) &&
      (m.niches.length === 0 || m.niches.includes(creator.niche)) &&
      (levelIndex(m.levelRequired) <= levelIndex(lvl) || !!m.entries[creator.id]),
  );
}

export function missionEntriesToReview(state: AppState): { mission: Mission; creatorId: string }[] {
  return state.missions.flatMap((mission) => Object.entries(mission.entries).filter(([, e]) => e.state === "submitted").map(([creatorId]) => ({ mission, creatorId })));
}

export function squadTotals(m: Mission): { squad: NonNullable<Mission["squads"]>[number]; sparks: number; submitted: number }[] {
  return (m.squads ?? []).map((squad) => {
    const entries = squad.memberIds.map((id) => m.entries[id]).filter(Boolean);
    return { squad, sparks: entries.reduce((s, e) => s + (e.awarded ?? 0), 0), submitted: entries.filter((e) => e.state !== "joined").length };
  }).sort((a, b) => b.sparks - a.sparks || b.submitted - a.submitted);
}

export const MISSION_TYPES: MissionType[] = ["starter", "routine", "monthly", "team", "review", "event", "academy", "referral"];

// ---------- Academy ----------

export function trackProgress(state: AppState, creatorId: string, trackId: string): { done: number; total: number; complete: boolean } {
  const track = state.academy.tracks.find((t) => t.id === trackId);
  const progress = state.academy.progress[creatorId] ?? {};
  const total = track?.modules.length ?? 0;
  const done = track ? track.modules.filter((m) => progress[m.id]).length : 0;
  return { done, total, complete: total > 0 && done === total };
}

export function certificatesFor(state: AppState, creatorId: string): string[] {
  return state.academy.certificates[creatorId] ?? [];
}

// ---------- Next best action ----------

export interface NextAction {
  kind: "respond" | "confirm_address" | "track" | "shoot" | "upload" | "revise" | "publish" | "wait" | "mission" | "academy" | "vote" | "rest";
  participation?: Participation;
  missionId?: string;
  trackId?: string;
}

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
  const creator = creatorById(state, creatorId);
  const joined = creator ? missionsFor(state, creator).find((m) => m.entries[creatorId]?.state === "joined" || m.entries[creatorId]?.state === "changes") : undefined;
  if (joined) return { kind: "mission", missionId: joined.id };
  const season = currentSeason(state);
  if (season.ambassadors.phase === "voting" && !season.ambassadors.votes[creatorId]) return { kind: "vote" };
  const open = creator ? missionsFor(state, creator).find((m) => !m.entries[creatorId] && m.type !== "routine") : undefined;
  if (open) return { kind: "mission", missionId: open.id };
  const waiting = mine.find((p) => actorFor(p.stage) === "brand");
  if (waiting) return { kind: "wait", participation: waiting };
  const track = state.academy.tracks.find((t) => !trackProgress(state, creatorId, t.id).complete && meetsLevel(state, creatorId, t.levelRequired));
  if (track) return { kind: "academy", trackId: track.id };
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
  reasons: { key: "niche" | "market" | "tier" | "verified" | "history" | "streak" | "level"; ok: boolean; weight: number }[];
}

export function matchScore(state: AppState, creator: Creator, campaign: Campaign): MatchScore {
  const history = completedFor(state, creator.id).length;
  const allVerified = Object.values(creator.verification).every((v) => v === "verified");
  const reasons: MatchScore["reasons"] = [
    { key: "niche", ok: campaign.targetNiches.includes(creator.niche), weight: 30 },
    { key: "market", ok: campaign.targetMarkets.includes(creator.market), weight: 25 },
    { key: "tier", ok: campaign.targetTiers.includes(creator.tier), weight: 15 },
    { key: "verified", ok: allVerified, weight: 10 },
    { key: "history", ok: history > 0, weight: 10 },
    { key: "level", ok: levelIndex(level(state, creator.id).level) >= 1, weight: 5 },
    { key: "streak", ok: monthlyStreak(state, creator.id) >= 2, weight: 5 },
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
  const missionsDone = state.missions.filter((m) => m.entries[creatorId]?.state === "completed");
  const revisionFree = mine.some((p) => p.reviews.length === 1 && p.reviews[0].decision === "approved");
  const earlyBird = mine.some((p) => {
    const inv = p.stageLog.find((e) => e.stage === "invited");
    const acc = p.stageLog.find((e) => e.stage === "accepted");
    return inv && acc && new Date(acc.at).getTime() - new Date(inv.at).getTime() <= 24 * 60 * 60 * 1000;
  });
  const votes = state.seasons.reduce((n, s) => n + Object.values(s.ambassadors.votes).filter((v) => v === creatorId).length, 0);
  const rules: Record<Badge["rule"], boolean> = {
    first_campaign: completed.length >= 1,
    three_campaigns: completed.length >= 3,
    first_mission: missionsDone.length >= 1,
    streak_3: monthlyStreak(state, creatorId) >= 3,
    all_verified: Object.values(creator.verification).every((v) => v === "verified"),
    first_publish: verifiedPosts >= 1,
    five_published: verifiedPosts >= 5,
    revision_free: revisionFree,
    early_bird: earlyBird,
    first_paid: missionsDone.some((m) => m.paid),
    academy_graduate: certificatesFor(state, creatorId).length >= 1,
    top_voted: votes >= 3,
    squad_player: missionsDone.some((m) => m.type === "team"),
    referrer: state.referrals.some((r) => r.referrerId === creatorId && r.status === "approved"),
  };
  return state.badges.filter((b) => rules[b.rule]);
}

export function adminOverview(state: AppState) {
  const live = state.campaigns.filter((c) => ["inviting", "active", "review", "publishing"].includes(c.status)).length;
  const inFlight = state.participations.filter((p) => !["completed", "declined", "invited"].includes(p.stage)).length;
  const pendingReview = reviewQueue(state).length;
  const missionReview = missionEntriesToReview(state).length;
  const toShip = logisticsQueue(state).length;
  const toVerify = verifyQueue(state).length;
  const toRelease = pointsQueue(state).length;
  const toFulfil = state.redemptions.filter((r) => r.status === "requested").length;
  const verifiedCreators = state.creators.filter((c) => c.verification.identity === "verified").length;
  const pointsOut = state.ledger.filter((l) => l.delta > 0).reduce((s, l) => s + l.delta, 0);
  const liveMissions = state.missions.filter((m) => m.status === "live").length;
  const monthActive = new Set(state.ledger.filter((l) => l.delta > 0 && monthKey(l.at) === monthKey(state.now)).map((l) => l.creatorId)).size;
  const referralsPending = state.referrals.filter((r) => r.status === "pending").length;
  return { live, inFlight, pendingReview, missionReview, toShip, toVerify, toRelease, toFulfil, verifiedCreators, creators: state.creators.length, pointsOut, liveMissions, monthActive, referralsPending };
}
