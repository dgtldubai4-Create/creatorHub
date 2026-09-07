import { describe, expect, it } from "vitest";
import { createSeed } from "../src/domain/seed";
import { reducer, safeReducer, type Action } from "../src/domain/reducer";
import { STAGES } from "../src/domain/stages";
import type { AppState } from "../src/domain/types";
import { balance } from "../src/domain/selectors";

const AT = "2026-09-08T10:00:00.000Z";
const run = (state: AppState, ...actions: Action[]) => actions.reduce((s, a) => reducer(s, { ...a, at: AT }), state);

describe("seed", () => {
  it("exercises every stage at once", () => {
    const s = createSeed();
    const present = new Set(s.participations.map((p) => p.stage));
    for (const st of STAGES) expect(present.has(st), st).toBe(true);
    expect(present.has("declined")).toBe(true);
    expect(s.creators.length).toBeGreaterThanOrEqual(20);
    expect(s.campaigns.length).toBeGreaterThanOrEqual(11);
    expect(s.quests.length).toBeGreaterThanOrEqual(6);
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
    expect(() => reducer(s, { type: "redeem", creatorId: "cr_mahasultan", rewardId: "rw_studio_day", at: AT })).toThrow(/more points/);
    s = run(s, { type: "signIn", seat: "creator", creatorId: "cr_laylaoils" });
    const len = s.ledger.length;
    s = run(s, { type: "redeem", creatorId: "cr_laylaoils", rewardId: "rw_boost_shoutout" });
    expect(s.ledger.length).toBe(len + 1);
    expect(s.ledger[len].delta).toBe(-150);
  });

  it("registers a creator and signs them in", () => {
    const s = run(createSeed(), { type: "registerCreator", input: { name: "Test Person", handle: "@testperson", market: "UAE", city: "Dubai", niche: "food", tier: "nano", followers: 1200, socials: { instagram: "testperson" }, bio: "hi" } });
    expect(s.session.seat).toBe("creator");
    expect(s.creators.at(-1)?.handle).toBe("testperson");
    expect(s.notifications.some((n) => n.audience === "brand")).toBe(true);
  });
});
