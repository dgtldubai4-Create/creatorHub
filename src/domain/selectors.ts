import type { AppState, Badge, Campaign, Creator, Level, LevelKit, Localised, Mission, MissionType, Participation, Platform, PostFormat, Season, SparksQuote, Stage } from "./types";
import { actorFor, phaseOf, stageProgress } from "./stages";
import { addDays, monthKey, prevMonthKey } from "./simulate";
import { DEFAULT_FORMATS, EXPIRY_DAYS, EXPIRY_WARN_DAYS, FLAT_TYPES, KIT_LEVELS, LEVEL_ORDER, LEVEL_RULES, LEVEL_TASKS, LICENCE_MARKETS, LIVE_DAYS, quoteSparks, type KitLevel, type TaskKey } from "./policy";

export { LEVEL_ORDER, LEVEL_RULES };

// Every list view derives from the same entities. Nothing here is cached state.

export function balance(state: AppState, creatorId: string): number {
  return state.ledger.filter((l) => l.creatorId === creatorId).reduce((s, l) => s + l.delta, 0);
}

/** Earned Sparks: every award, less any that were taken back because the post came down. */
const earns = (l: AppState["ledger"][number]) => l.delta > 0 || l.ref.kind === "clawback";

export function lifetimeSparks(state: AppState, creatorId: string): number {
  return state.ledger.filter((l) => l.creatorId === creatorId && earns(l)).reduce((s, l) => s + l.delta, 0);
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
  return Math.max(0, state.ledger
    .filter((l) => l.creatorId === creatorId && earns(l) && l.at.slice(0, 10) >= season.start && l.at.slice(0, 10) <= season.end)
    .reduce((s, l) => s + l.delta, 0));
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

export function levelIndex(l: Level): number {
  return LEVEL_ORDER.indexOf(l);
}

function inSeason(iso: string | undefined, season: Season): boolean {
  const day = (iso ?? "").slice(0, 10);
  return day >= season.start && day <= season.end;
}

/** One named requirement on the way to a level. Sparks and quality carry numbers; the rest are done or not. */
export interface LevelTask {
  key: TaskKey;
  done: boolean;
  current?: number;
  target?: number;
  /** Where the creator goes to do it. */
  link: string;
  /** The mission or track the task points at, when there is one to name. */
  missionId?: string;
  trackId?: string;
}

function taskDone(state: AppState, creator: Creator, key: TaskKey, season: Season, sparks: number, quality: number): boolean {
  const id = creator.id;
  const approved = (m: Mission) => m.entries[id]?.state === "completed" && !m.entries[id].clawedBack;
  switch (key) {
    case "sparks":
    case "quality":
      return true; // judged against the level's own thresholds by the caller
    case "starter":
      return state.missions.some((m) => m.type === "starter" && !m.kitLevel && approved(m));
    case "challenge":
      return state.missions.some((m) => (m.type === "monthly" || m.type === "team") && approved(m) && inSeason(m.entries[id].submissions.at(-1)?.reviewedAt, season));
    case "journey":
      return state.participations.some((p) => p.creatorId === id && (p.stage === "points_released" || p.stage === "completed") && !p.clawedBack);
    case "certificate":
      return certificatesFor(state, id).length >= 1;
    case "licence":
      return !LICENCE_MARKETS.includes(creator.market) || creator.licence.state === "verified";
    case "hold_pro":
      return earnedLevel(state, creator, season, sparks, quality) === "pro";
    case "entered":
      return season.ambassadors.shortlist.includes(id) || season.ambassadors.wildcards.includes(id);
    case "selected":
      return season.ambassadors.cohort.includes(id);
  }
}

/** The level a creator has earned this season, before the Ambassador cohort is applied. */
function earnedLevel(state: AppState, creator: Creator, season: Season, sparks: number, quality: number): Level {
  const tasks = (lvl: "insider" | "pro") => LEVEL_TASKS[lvl].every((k) => taskDone(state, creator, k, season, sparks, quality));
  const insider = sparks >= LEVEL_RULES.insider.sparks && quality >= LEVEL_RULES.insider.quality && tasks("insider");
  const pro = insider && sparks >= LEVEL_RULES.pro.sparks && quality >= LEVEL_RULES.pro.quality && tasks("pro");
  return pro ? "pro" : insider ? "insider" : "member";
}

export function level(state: AppState, creatorId: string): { level: Level; earned: Level; seasonSparks: number; quality: number; next: Level | null; toNext: number; progress: number } {
  const season = currentSeason(state);
  const sparks = seasonSparks(state, creatorId, season);
  const quality = qualityScore(state, creatorId);
  const creator = creatorById(state, creatorId);
  const earned: Level = creator ? earnedLevel(state, creator, season, sparks, quality) : "member";
  let lvl: Level = earned;
  if (season.ambassadors.cohort.includes(creatorId)) lvl = "ambassador";
  const next: Level | null = lvl === "member" ? "insider" : lvl === "insider" ? "pro" : lvl === "pro" ? "ambassador" : null;
  const target = next === "insider" ? LEVEL_RULES.insider.sparks : next === "pro" ? LEVEL_RULES.pro.sparks : sparks;
  const floor = lvl === "member" ? 0 : lvl === "insider" ? LEVEL_RULES.insider.sparks : LEVEL_RULES.pro.sparks;
  const toNext = next && next !== "ambassador" ? Math.max(0, target - sparks) : 0;
  const progress = next === "ambassador" || !next ? 1 : Math.min(1, (sparks - floor) / Math.max(1, target - floor));
  return { level: lvl, earned, seasonSparks: sparks, quality, next, toNext, progress };
}

/** The "next level" checklist: every requirement for `target`, each marked done or not, with somewhere to go. */
export function levelTasks(state: AppState, creatorId: string, target: KitLevel): LevelTask[] {
  const creator = creatorById(state, creatorId);
  if (!creator) return [];
  const season = currentSeason(state);
  const sparks = seasonSparks(state, creatorId, season);
  const quality = qualityScore(state, creatorId);
  const open = (pred: (m: Mission) => boolean) => missionsFor(state, creator).find((m) => pred(m) && m.entries[creatorId]?.state !== "completed");
  return LEVEL_TASKS[target].map((key): LevelTask => {
    switch (key) {
      case "sparks": {
        const need = LEVEL_RULES[target as "insider" | "pro"].sparks;
        return { key, done: sparks >= need, current: Math.min(sparks, need), target: need, link: "/creator/missions" };
      }
      case "quality": {
        const need = LEVEL_RULES[target as "insider" | "pro"].quality;
        return { key, done: quality >= need, current: quality, target: need, link: "/creator/sparks" };
      }
      case "starter": {
        const m = open((x) => x.type === "starter" && !x.kitLevel);
        return { key, done: taskDone(state, creator, key, season, sparks, quality), link: m ? `/creator/missions/${m.id}` : "/creator/missions", missionId: m?.id };
      }
      case "challenge": {
        const m = open((x) => x.type === "monthly" || x.type === "team");
        return { key, done: taskDone(state, creator, key, season, sparks, quality), link: m ? `/creator/missions/${m.id}` : "/creator/missions", missionId: m?.id };
      }
      case "journey": {
        const p = participationsFor(state, creatorId).find((x) => x.stage !== "declined" && x.stage !== "completed");
        return { key, done: taskDone(state, creator, key, season, sparks, quality), link: p ? (p.stage === "invited" ? "/creator/invitations" : `/creator/campaigns/${p.id}`) : "/creator/campaigns" };
      }
      case "certificate": {
        const tr = state.academy.tracks.find((x) => !trackProgress(state, creatorId, x.id).complete && levelIndex(x.levelRequired) <= levelIndex(level(state, creatorId).level));
        return { key, done: taskDone(state, creator, key, season, sparks, quality), link: tr ? `/creator/academy/${tr.id}` : "/creator/academy", trackId: tr?.id };
      }
      case "licence":
        return { key, done: taskDone(state, creator, key, season, sparks, quality), link: "/creator/profile" };
      default:
        return { key, done: taskDone(state, creator, key, season, sparks, quality), link: "/creator/season" };
    }
  });
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

/** Base Sparks for a mission, before the table. Doubled during a surprise drop. */
export function missionSparks(state: AppState, m: Mission): number {
  return isDoubleSparks(state, m) ? m.sparks * 2 : m.sparks;
}

export function platformOf(url: string): Platform {
  return /tiktok\.com/i.test(url) ? "tiktok" : "instagram";
}

/** Audience numbers for the platform a post went out on, from the connected account. */
export function audienceFor(creator: Creator, platform: Platform): { followers: number; engagementRate: number } {
  const acc = creator.connected[platform] ?? creator.connected.instagram ?? creator.connected.tiktok;
  return { followers: acc?.followers ?? creator.followers, engagementRate: acc?.engagementRate ?? 0 };
}

export function formatsFor(m: Mission): PostFormat[] {
  return m.formats?.length ? m.formats : DEFAULT_FORMATS;
}

/** What this creator earns on this mission, with the working shown. */
export function missionQuote(state: AppState, m: Mission, creator: Creator, opts: { format?: PostFormat; url?: string; brandIds?: string[] } = {}): SparksQuote {
  const audience = audienceFor(creator, platformOf(opts.url ?? ""));
  const brands = new Set([m.brandId, ...(opts.brandIds ?? [])].filter(Boolean));
  return quoteSparks({ base: m.sparks, format: opts.format ?? formatsFor(m)[0], ...audience, brandCount: brands.size, double: isDoubleSparks(state, m), flat: FLAT_TYPES.includes(m.type) });
}

/** Campaign journeys are video deliverables on one brand: reach and engagement apply. */
export function campaignQuote(campaign: Campaign, creator: Creator, platform: Platform = "instagram"): SparksQuote {
  return quoteSparks({ base: campaign.points, format: "video", ...audienceFor(creator, platform), brandCount: 1 });
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
      (levelIndex(m.levelRequired) <= levelIndex(lvl) || !!m.entries[creator.id]) &&
      (!m.kitLevel || !!m.entries[creator.id] || kitDelivered(state, creator.id, m.kitLevel)),
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

// ---------- Level-up kits ----------

export function kitsFor(state: AppState, creatorId: string): LevelKit[] {
  return state.levelKits.filter((k) => k.creatorId === creatorId).sort((a, b) => levelIndex(a.level) - levelIndex(b.level));
}

export function kitDelivered(state: AppState, creatorId: string, lvl: KitLevel): boolean {
  return state.levelKits.some((k) => k.creatorId === creatorId && k.level === lvl && k.shipment?.status === "delivered");
}

/**
 * Levels this creator has reached and has no kit for yet. One kit per level, ever.
 * Insider and Pro kits follow the level earned; the Ambassador kit follows selection.
 */
export function kitsOwed(state: AppState, creatorId: string): KitLevel[] {
  const lv = level(state, creatorId);
  const reached = (l: KitLevel) => (l === "ambassador" ? lv.level === "ambassador" : levelIndex(l) <= levelIndex(lv.earned));
  return KIT_LEVELS.filter((l) => reached(l) && !state.levelKits.some((k) => k.creatorId === creatorId && k.level === l));
}

/** Claimed kits that logistics still has to move. */
export function kitQueue(state: AppState): LevelKit[] {
  return state.levelKits.filter((k) => k.shipment && k.shipment.status !== "delivered").sort((a, b) => a.shipment!.updatedAt.localeCompare(b.shipment!.updatedAt));
}

// ---------- Posts stay live ----------

export interface DuePost {
  kind: "mission" | "participation";
  /** missionId:creatorId or the participation id. */
  id: string;
  creatorId: string;
  title: Localised;
  url: string;
  approvedAt: string;
  amount: number;
}

/** Approved posts past the 30-day mark that have not been re-checked yet. */
export function postsDueForCheck(state: AppState): DuePost[] {
  const cutoff = addDays(state.now, -LIVE_DAYS);
  const out: DuePost[] = [];
  for (const m of state.missions) {
    if (FLAT_TYPES.includes(m.type)) continue;
    for (const [creatorId, e] of Object.entries(m.entries)) {
      const sub = e.submissions.at(-1);
      if (e.state !== "completed" || e.clawedBack || !sub?.reviewedAt || sub.live || sub.reviewedAt > cutoff) continue;
      out.push({ kind: "mission", id: `${m.id}:${creatorId}`, creatorId, title: m.title, url: sub.url, approvedAt: sub.reviewedAt, amount: e.awarded ?? 0 });
    }
  }
  for (const p of state.participations) {
    const pub = p.publish;
    if (!pub?.verified || !pub.verifiedAt || pub.live || p.clawedBack || pub.verifiedAt > cutoff) continue;
    const paid = state.ledger.find((l) => l.ref.kind === "participation" && l.ref.id === p.id);
    if (!paid) continue;
    const c = campaignById(state, p.campaignId);
    out.push({ kind: "participation", id: p.id, creatorId: p.creatorId, title: c?.title ?? { en: "Campaign", ar: "حملة" }, url: pub.url, approvedAt: pub.verifiedAt, amount: paid.delta });
  }
  return out.sort((a, b) => a.approvedAt.localeCompare(b.approvedAt));
}

export function clawbacks(state: AppState): AppState["ledger"] {
  return state.ledger.filter((l) => l.ref.kind === "clawback").slice().reverse();
}

// ---------- Sparks expiry ----------

export interface Expiry {
  balance: number;
  lastActivityAt: string | null;
  expiresAt: string | null;
  daysLeft: number | null;
  /** Inside the warning window with Sparks still to lose. */
  atRisk: boolean;
  expired: boolean;
}

/** Sparks lapse after a year with no earning and no spending. Any award or redemption resets the clock. */
export function sparksExpiry(state: AppState, creatorId: string): Expiry {
  const bal = balance(state, creatorId);
  const last = state.ledger.filter((l) => l.creatorId === creatorId && l.ref.kind !== "expiry" && l.ref.kind !== "clawback").reduce<string | null>((m, l) => (m === null || l.at > m ? l.at : m), null);
  if (!last) return { balance: bal, lastActivityAt: null, expiresAt: null, daysLeft: null, atRisk: false, expired: false };
  const expiresAt = addDays(last, EXPIRY_DAYS);
  const daysLeft = Math.ceil((new Date(expiresAt).getTime() - new Date(state.now).getTime()) / 86_400_000);
  return { balance: bal, lastActivityAt: last, expiresAt, daysLeft, atRisk: bal > 0 && daysLeft > 0 && daysLeft <= EXPIRY_WARN_DAYS, expired: bal > 0 && daysLeft <= 0 };
}

export function expiryWatch(state: AppState): { creator: Creator; expiry: Expiry }[] {
  return state.creators.map((creator) => ({ creator, expiry: sparksExpiry(state, creator.id) })).filter((x) => x.expiry.atRisk || x.expiry.expired).sort((a, b) => (a.expiry.daysLeft ?? 0) - (b.expiry.daysLeft ?? 0));
}

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
  const kitsToShip = kitQueue(state).length;
  const postsDue = postsDueForCheck(state).length;
  const expiring = expiryWatch(state).length;
  return { live, inFlight, pendingReview, missionReview, toShip, toVerify, toRelease, toFulfil, verifiedCreators, creators: state.creators.length, pointsOut, liveMissions, monthActive, referralsPending, kitsToShip, postsDue, expiring };
}
