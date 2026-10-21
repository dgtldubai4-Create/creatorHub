import { describe, expect, it } from "vitest";
import { createSeed } from "../src/domain/seed";
import { reducer, safeReducer, type Action } from "../src/domain/reducer";
import { STAGES } from "../src/domain/stages";
import type { AppState } from "../src/domain/types";
import { balance, level, monthlyStreak, currentSeason, missionsFor, leaderboard, trackProgress, qualityScore } from "../src/domain/selectors";
import { missionCheck, otpFor } from "../src/domain/simulate";

const AT = "2026-10-22T10:00:00.000Z";
const run = (state: AppState, ...actions: Action[]) => actions.reduce((s, a) => reducer(s, { ...a, at: AT }), state);

describe("seed", () => {
  it("exercises every stage at once", () => {
    const s = createSeed();
    const present = new Set(s.participations.map((p) => p.stage));
    for (const st of STAGES) expect(present.has(st), st).toBe(true);
    expect(present.has("declined")).toBe(true);
    expect(s.creators.length).toBeGreaterThanOrEqual(20);
    expect(s.campaigns.length).toBeGreaterThanOrEqual(11);
    expect(s.missions.length).toBeGreaterThanOrEqual(10);
    expect(s.seasons.length).toBe(3);
    expect(s.academy.tracks.length).toBe(6);
    expect(new Set(s.creators.map((c) => c.market)).size).toBe(6);
    expect(s.rewards.length).toBeGreaterThanOrEqual(19);
    expect(s.badges.length).toBeGreaterThanOrEqual(9);
    expect(s.products.length).toBeGreaterThan(20);
  });

  it("is deterministic", () => {
    expect(JSON.stringify(createSeed())).toEqual(JSON.stringify(createSeed()));
  });

  it("has a consistent stage log per participation", () => {
    for (const p of createSeed().participations) {
      expect(p.stageLog[0].stage).toBe("invited");
      expect(p.stageLog[p.stageLog.length - 1].stage).toBe(p.stage);
      for (let i = 1; i < p.stageLog.length; i++) expect(p.stageLog[i].at >= p.stageLog[i - 1].at).toBe(true);
    }
  });
});

describe("full journey", () => {
  it("walks a participation from invite to completion with one revise loop", () => {
    let s = createSeed();
    // Brand invites Hessa to the Fem campaign.
    s = run(s, { type: "signIn", seat: "brand", role: "super_admin" }, { type: "invite", campaignId: "cp_grwm", creatorIds: ["cr_hessamoves"] });
    const p = s.participations.find((x) => x.campaignId === "cp_grwm" && x.creatorId === "cr_hessamoves")!;
    expect(p.stage).toBe("invited");
    expect(s.campaigns.find((c) => c.id === "cp_grwm")!.status).toBe("inviting");

    // Creator accepts and confirms.
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_hessamoves" }, { type: "respondInvite", participationId: p.id, accept: true }, { type: "confirmProfile", participationId: p.id });
    expect(s.participations.find((x) => x.id === p.id)!.stage).toBe("profile_confirmed");
    expect(s.participations.find((x) => x.id === p.id)!.shipment?.status).toBe("address_confirmed");

    // Logistics ships it.
    s = run(s, { type: "signIn", seat: "brand", role: "logistics" });
    for (let i = 0; i < 4; i++) s = run(s, { type: "advanceShipment", participationId: p.id });
    expect(s.participations.find((x) => x.id === p.id)!.stage).toBe("delivered");
    expect(() => reducer(s, { type: "advanceShipment", participationId: p.id, at: AT })).toThrow();

    // Creator shoots and uploads.
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_hessamoves" }, { type: "startShoot", participationId: p.id }, { type: "upload", participationId: p.id, filename: "grwm_v1.mp4", sizeBytes: 31_000_000, durationSec: 38 });
    let cur = s.participations.find((x) => x.id === p.id)!;
    expect(cur.stage).toBe("manual_review");
    expect(cur.submissions).toHaveLength(1);
    expect(cur.stageLog.map((e) => e.stage).slice(-3)).toEqual(["first_cut", "auto_check", "manual_review"]);

    // Reviewer asks for changes, creator revises, reviewer approves.
    s = run(s, { type: "signIn", seat: "brand", role: "content_reviewer" }, { type: "review", participationId: p.id, submissionId: cur.submissions[0].id, decision: "changes", note: "Hook is late.", notes: [{ t: 4, text: "cut here" }] });
    expect(s.participations.find((x) => x.id === p.id)!.stage).toBe("changes_requested");
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_hessamoves" }, { type: "upload", participationId: p.id, filename: "grwm_v2.mp4", sizeBytes: 30_500_000, durationSec: 36 });
    cur = s.participations.find((x) => x.id === p.id)!;
    expect(cur.submissions[1].version).toBe(2);
    expect(cur.stage).toBe("manual_review");
    s = run(s, { type: "signIn", seat: "brand", role: "content_reviewer" }, { type: "review", participationId: p.id, submissionId: cur.submissions[1].id, decision: "approved", note: "Go.", notes: [] });
    expect(s.participations.find((x) => x.id === p.id)!.stage).toBe("approved_to_publish");

    // Publish, verify, release, complete.
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_hessamoves" }, { type: "publish", participationId: p.id, platform: "instagram", url: "https://www.instagram.com/reel/abc/" });
    const before = balance(s, "cr_hessamoves");
    s = run(s, { type: "signIn", seat: "brand", role: "finance" });
    expect(() => reducer(s, { type: "releasePoints", participationId: p.id, at: AT })).toThrow(/verified/);
    s = run(s, { type: "signIn", seat: "brand", role: "content_reviewer" }, { type: "verifyPost", participationId: p.id });
    s = run(s, { type: "signIn", seat: "brand", role: "finance" }, { type: "releasePoints", participationId: p.id });
    expect(balance(s, "cr_hessamoves")).toBe(before + 550);
    expect(() => reducer(s, { type: "releasePoints", participationId: p.id, at: AT })).toThrow();
    s = run(s, { type: "complete", participationId: p.id });
    expect(s.participations.find((x) => x.id === p.id)!.stage).toBe("completed");
    expect(s.participations.find((x) => x.id === p.id)!.stageLog.filter((e) => e.stage === "manual_review")).toHaveLength(2);
  });

  it("refuses skips and regressions", () => {
    let s = createSeed();
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_laylaoils" });
    const invited = s.participations.find((p) => p.creatorId === "cr_laylaoils" && p.stage === "invited")!;
    expect(() => reducer(s, { type: "startShoot", participationId: invited.id, at: AT })).toThrow(/Illegal/);
    expect(() => reducer(s, { type: "publish", participationId: invited.id, platform: "tiktok", url: "https://x", at: AT })).toThrow();
  });

  it("enforces permissions on brand mutations", () => {
    let s = createSeed();
    s = run(s, { type: "signIn", seat: "brand", role: "finance" });
    const q = s.participations.find((p) => p.stage === "manual_review")!;
    expect(() => reducer(s, { type: "review", participationId: q.id, submissionId: q.submissions[0].id, decision: "approved", note: "", notes: [], at: AT })).toThrow(/permission/);
    const safe = safeReducer(s, { type: "review", participationId: q.id, submissionId: q.submissions[0].id, decision: "approved", note: "", notes: [], at: AT });
    expect(safe.lastError?.action).toBe("review");
    expect(safe.participations).toBe(s.participations);
  });

  it("keeps the ledger append-only and balance-guarded", () => {
    let s = createSeed();
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_mahasultan" });
    expect(() => reducer(s, { type: "redeem", creatorId: "cr_mahasultan", rewardId: "rw_studio_day", at: AT })).toThrow(/more Sparks/);
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_laylaoils" });
    const len = s.ledger.length;
    s = run(s, { type: "redeem", creatorId: "cr_laylaoils", rewardId: "rw_boost_shoutout" });
    expect(s.ledger.length).toBe(len + 1);
    expect(s.ledger[len].delta).toBe(-150);
  });

  it("registers a creator and signs them in", () => {
    const s = run(createSeed(), { type: "registerCreator", input: { name: "Test Person", handle: "@testperson", email: "t@example.com", mobile: "+971 50 123 4567", market: "UAE", city: "Dubai", niche: "food", tier: "nano", followers: 1200, languages: ["en"], vibe: "hi", favouritePosts: [], socials: { instagram: "testperson" }, bio: "hi" } });
    expect(s.session.seat).toBe("creator");
    expect(s.creators.at(-1)?.handle).toBe("testperson");
    expect(s.notifications.some((n) => n.audience === "brand")).toBe(true);
  });
});

describe("missions", () => {
  it("runs a mission from join to Sparks, with the pre-review check", () => {
    let s = createSeed();
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_reemq" });
    const before = balance(s, "cr_reemq");
    s = run(s, { type: "joinMission", missionId: "ms_goldenhour", creatorId: "cr_reemq" });
    expect(s.missions.find((m) => m.id === "ms_goldenhour")!.entries.cr_reemq.state).toBe("joined");
    expect(() => reducer(s, { type: "submitMission", missionId: "ms_goldenhour", creatorId: "cr_reemq", url: "not a url", caption: "x", at: AT })).toThrow(/https/);
    s = run(s, { type: "submitMission", missionId: "ms_goldenhour", creatorId: "cr_reemq", url: "https://www.instagram.com/reel/x/", caption: "Sunset oil #DaburSquad #GoldenHour #ad" });
    const e = s.missions.find((m) => m.id === "ms_goldenhour")!.entries.cr_reemq;
    expect(e.state).toBe("submitted");
    expect(e.submissions[0].check.passed).toBe(true);
    s = run(s, { type: "signIn", seat: "brand", role: "content_reviewer" }, { type: "reviewMission", missionId: "ms_goldenhour", creatorId: "cr_reemq", decision: "approved", note: "Lovely." });
    expect(s.missions.find((m) => m.id === "ms_goldenhour")!.entries.cr_reemq.state).toBe("completed");
    expect(balance(s, "cr_reemq")).toBe(before + 180);
    expect(() => reducer(s, { type: "reviewMission", missionId: "ms_goldenhour", creatorId: "cr_reemq", decision: "approved", note: "", at: AT })).toThrow();
  });

  it("flags missing disclosure and hashtags", () => {
    const c = missionCheck("just a caption", ["#DaburSquad"], AT, { start: "2026-10-01", end: "2026-10-31" });
    expect(c).toMatchObject({ hashtags: false, disclosure: false, timing: true, passed: false, simulated: true });
    expect(missionCheck("#DaburSquad #ad", ["#DaburSquad"], AT, { start: "2026-10-01", end: "2026-10-31" }).passed).toBe(true);
    expect(missionCheck("#DaburSquad #ad", ["#DaburSquad"], AT, { start: "2026-09-01", end: "2026-09-30" }).timing).toBe(false);
  });

  it("doubles Sparks during a surprise drop and enforces level gates", () => {
    let s = createSeed();
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_linabarakat" });
    s = run(s, { type: "joinMission", missionId: "ms_honeyhack", creatorId: "cr_linabarakat" }, { type: "submitMission", missionId: "ms_honeyhack", creatorId: "cr_linabarakat", url: "https://t.co/x", caption: "#DaburSquad #HoneyHack #gifted" });
    const before = balance(s, "cr_linabarakat");
    s = run(s, { type: "signIn", seat: "brand", role: "super_admin" }, { type: "reviewMission", missionId: "ms_honeyhack", creatorId: "cr_linabarakat", decision: "approved", note: "" });
    expect(balance(s, "cr_linabarakat")).toBe(before + 180);
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_zahramuscat" });
    expect(() => reducer(s, { type: "joinMission", missionId: "ms_circlecamp", creatorId: "cr_zahramuscat", at: AT })).toThrow(/level/);
  });

  it("filters the mission board by market, language, niche and level", () => {
    const s = createSeed();
    const zahra = s.creators.find((c) => c.id === "cr_zahramuscat")!;
    const ids = missionsFor(s, zahra).map((m) => m.id);
    expect(ids).not.toContain("ms_hairbar");
    expect(ids).not.toContain("ms_ramadan");
    expect(ids).toContain("ms_unbox");
    const sara = s.creators.find((c) => c.id === "cr_saraalsheikh")!;
    expect(missionsFor(s, sara).map((m) => m.id)).toContain("ms_riyadh_workshop");
  });

  it("joins a team mission into the smallest squad", () => {
    let s = createSeed();
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_noorhaddad" }, { type: "joinMission", missionId: "ms_masknight", creatorId: "cr_noorhaddad" });
    const m = s.missions.find((x) => x.id === "ms_masknight")!;
    expect(m.entries.cr_noorhaddad.squadId).toBe("sq_coconut");
    expect(m.squads!.find((q) => q.id === "sq_coconut")!.memberIds).toContain("cr_noorhaddad");
  });
});

describe("levels, seasons and academy", () => {
  it("derives levels from season Sparks, quality and the ambassador cohort", () => {
    const s = createSeed();
    expect(currentSeason(s).id).toBe("sn_2");
    expect(level(s, "cr_laylaoils").level).toBe("pro");
    expect(level(s, "cr_zahramuscat").level).toBe("member");
    expect(level(s, "cr_saraalsheikh").level).toBe("insider");
    expect(leaderboard(s)[0].creator.id).toBeTruthy();
    expect(qualityScore(s, "cr_laylaoils")).toBeGreaterThan(0);
  });

  it("counts monthly streaks from the ledger", () => {
    const s = createSeed();
    expect(monthlyStreak(s, "cr_laylaoils")).toBeGreaterThanOrEqual(2);
    expect(monthlyStreak(s, "cr_zahramuscat")).toBeLessThanOrEqual(1);
  });

  it("awards a certificate and Sparks when a track completes", () => {
    let s = createSeed();
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_tariqbrushes" });
    const before = balance(s, "cr_tariqbrushes");
    for (const id of ["md_uae_licence", "md_ksa_licence", "md_disclosure"]) s = run(s, { type: "completeModule", creatorId: "cr_tariqbrushes", trackId: "tr_licensing", moduleId: id });
    expect(trackProgress(s, "cr_tariqbrushes", "tr_licensing").complete).toBe(true);
    expect(s.academy.certificates.cr_tariqbrushes).toContain("tr_licensing");
    expect(balance(s, "cr_tariqbrushes")).toBe(before + 100);
    expect(() => reducer(s, { type: "completeModule", creatorId: "cr_tariqbrushes", trackId: "tr_business", moduleId: "md_pricing", at: AT })).toThrow(/level/);
  });

  it("runs the ambassador round: wildcard, vote, select", () => {
    let s = createSeed();
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_alyadoha" });
    expect(() => reducer(s, { type: "voteAmbassador", voterId: "cr_alyadoha", candidateId: "cr_laylaoils", at: AT })).toThrow(/One vote/);
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_zahramuscat" }, { type: "voteAmbassador", voterId: "cr_zahramuscat", candidateId: "cr_maryamks" });
    expect(currentSeason(s).ambassadors.votes.cr_zahramuscat).toBe("cr_maryamks");
    s = run(s, { type: "signIn", seat: "brand", role: "campaign_manager" }, { type: "selectAmbassadors", seasonId: "sn_2", cohort: ["cr_laylaoils", "cr_maryamks"] });
    expect(currentSeason(s).ambassadors.phase).toBe("selected");
    expect(level(s, "cr_maryamks").level).toBe("ambassador");
    // Season 3 opens wildcards, then voting pulls a shortlist of Pros.
    s = run(s, { type: "advanceSeason", seasonId: "sn_3" });
    expect(s.seasons[2].ambassadors.phase).toBe("wildcard_open");
    expect(() => reducer(s, { type: "advanceSeason", seasonId: "sn_3", at: AT })).not.toThrow();
  });

  it("verifies the simulated OTP and connects accounts", () => {
    let s = createSeed();
    const code = otpFor("+971 50 123 4567");
    expect(code).toMatch(/^\d{4}$/);
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_mahasultan" }, { type: "connectSocial", creatorId: "cr_mahasultan", platform: "tiktok", handle: "@mahasultan" });
    expect(s.creators.find((c) => c.id === "cr_mahasultan")!.connected.tiktok?.simulated).toBe(true);
  });
});
