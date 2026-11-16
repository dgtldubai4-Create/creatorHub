import { describe, expect, it } from "vitest";
import { createSeed } from "../src/domain/seed";
import { reducer, type Action } from "../src/domain/reducer";
import type { AppState } from "../src/domain/types";
import { balance, kitsFor, kitsOwed, level, levelTasks, missionsFor, postsDueForCheck, seasonSparks, sparksExpiry } from "../src/domain/selectors";
import { ENGAGEMENT_BANDS, LEVEL_KITS, REACH_BANDS, bandFor, quoteSparks } from "../src/domain/policy";
import { postLiveCheck } from "../src/domain/simulate";

const AT = "2026-10-22T10:00:00.000Z";
const run = (state: AppState, ...actions: Action[]) => actions.reduce((s, a) => reducer(s, { ...a, at: a.at ?? AT }), state);
const brand = (role: "super_admin" | "content_reviewer" | "logistics" | "finance" = "super_admin"): Action => ({ type: "signIn", seat: "brand", role });
const as = (creatorId: string): Action => ({ type: "signIn", seat: "creator", creatorId });

describe("Sparks table", () => {
  it("never pays a small account below base", () => {
    const q = quoteSparks({ base: 180, format: "video", followers: 900, engagementRate: 0.5, brandCount: 1 });
    expect(q.total).toBe(180);
    expect(q.reachMult).toBe(1);
  });

  it("weights format, reach, engagement and brand mix, rounds to 5, then doubles", () => {
    expect(bandFor(REACH_BANDS, 412_000).mult).toBe(1.2);
    expect(bandFor(ENGAGEMENT_BANDS, 6.5).mult).toBe(1.1);
    const q = quoteSparks({ base: 180, format: "video", followers: 412_000, engagementRate: 6.5, brandCount: 2 });
    expect(q.total).toBe(Math.round((180 * 1.2 * 1.1 * 1.1) / 5) * 5);
    expect(quoteSparks({ base: 180, format: "post", followers: 900, engagementRate: 0, brandCount: 1 }).total).toBe(145);
    expect(quoteSparks({ base: 90, format: "video", followers: 900, engagementRate: 0, brandCount: 1, double: true }).total).toBe(180);
  });

  it("pays referrals and retailer reviews flat", () => {
    const q = quoteSparks({ base: 150, format: "video", followers: 2_000_000, engagementRate: 9, brandCount: 3, flat: true });
    expect(q.total).toBe(150);
  });

  it("only takes a story when the mission asks for one", () => {
    let s = run(createSeed(), as("cr_reemq"), { type: "joinMission", missionId: "ms_goldenhour", creatorId: "cr_reemq" });
    expect(() => reducer(s, { type: "submitMission", missionId: "ms_goldenhour", creatorId: "cr_reemq", url: "https://www.instagram.com/stories/x/", caption: "#DaburSquad #GoldenHour #ad", format: "story", at: AT })).toThrow(/Stories/);
    s = run(s, { type: "submitMission", missionId: "ms_goldenhour", creatorId: "cr_reemq", url: "https://www.instagram.com/p/x/", caption: "#DaburSquad #GoldenHour #ad", format: "post", brandIds: ["dabur-honey", "vatika"] });
    s = run(s, brand("content_reviewer"), { type: "reviewMission", missionId: "ms_goldenhour", creatorId: "cr_reemq", decision: "approved", note: "" });
    const award = s.missions.find((m) => m.id === "ms_goldenhour")!.entries.cr_reemq.award!;
    expect(award.format).toBe("post");
    expect(award.brandCount).toBe(2);
    expect(award.brandMult).toBe(1.1);
  });
});

describe("levels and the next-level checklist", () => {
  it("keeps the seed coherent: nobody is owed a kit", () => {
    const s = createSeed();
    expect(s.creators.flatMap((c) => kitsOwed(s, c.id))).toEqual([]);
  });

  it("needs the named missions, not just the Sparks", () => {
    const s0 = createSeed();
    // Zahra gets enough Sparks for Insider but has not finished a starter mission or a challenge.
    const s: AppState = { ...s0, ledger: [...s0.ledger, { id: "led_test", creatorId: "cr_zahramuscat", delta: 600, reason: { en: "Test", ar: "Test" }, ref: { kind: "bonus", id: "test" }, at: AT }] };
    expect(seasonSparks(s, "cr_zahramuscat")).toBe(600);
    expect(level(s, "cr_zahramuscat").level).toBe("member");
    const tasks = levelTasks(s, "cr_zahramuscat", "insider");
    expect(tasks.find((t) => t.key === "sparks")).toMatchObject({ done: true, target: 400 });
    expect(tasks.find((t) => t.key === "starter")).toMatchObject({ done: false, missionId: "ms_unbox" });
    expect(tasks.find((t) => t.key === "challenge")?.done).toBe(false);
  });

  it("lists what stands between an Insider and Pro", () => {
    const s = createSeed();
    const tasks = levelTasks(s, "cr_saraalsheikh", "pro");
    expect(tasks.map((t) => t.key)).toEqual(["sparks", "quality", "journey", "certificate", "licence"]);
    expect(tasks.find((t) => t.key === "certificate")?.done).toBe(false);
  });
});

describe("level kits", () => {
  it("unlocks a kit on level-up, ships it, then opens the unboxing mission", () => {
    const s0 = createSeed();
    // Ghada has landed a team challenge this season; give her the Sparks, then let her finish the starter mission.
    let s: AppState = { ...s0, ledger: [...s0.ledger, { id: "led_test", creatorId: "cr_ghadaaziz", delta: 200, reason: { en: "Test", ar: "Test" }, ref: { kind: "bonus", id: "test" }, at: AT }] };
    expect(level(s, "cr_ghadaaziz").level).toBe("member");
    s = run(s, as("cr_ghadaaziz"), { type: "joinMission", missionId: "ms_unbox", creatorId: "cr_ghadaaziz" }, { type: "submitMission", missionId: "ms_unbox", creatorId: "cr_ghadaaziz", url: "https://www.instagram.com/reel/ghada/", caption: "#DaburSquad #WelcomeKit #gifted" });
    s = run(s, brand("content_reviewer"), { type: "reviewMission", missionId: "ms_unbox", creatorId: "cr_ghadaaziz", decision: "approved", note: "" });
    expect(level(s, "cr_ghadaaziz").level).toBe("insider");
    const kit = kitsFor(s, "cr_ghadaaziz").find((k) => k.level === "insider")!;
    expect(kit.shipment).toBeNull();
    expect(kit.items).toEqual(LEVEL_KITS.insider.items);
    expect(s.notifications.some((n) => n.audience === "creator:cr_ghadaaziz" && /kit is unlocked/.test(n.title.en))).toBe(true);
    const ghada = s.creators.find((c) => c.id === "cr_ghadaaziz")!;
    expect(missionsFor(s, ghada).map((m) => m.id)).not.toContain("ms_kit_insider");

    // Logistics cannot move a kit nobody has claimed.
    s = run(s, brand("logistics"));
    expect(() => reducer(s, { type: "advanceKitShipment", kitId: kit.id, at: AT })).toThrow(/claimed/);
    s = run(s, as("cr_ghadaaziz"), { type: "claimLevelKit", kitId: kit.id });
    expect(() => reducer(s, { type: "claimLevelKit", kitId: kit.id, at: AT })).toThrow(/on its way/);
    expect(() => reducer(s, { type: "joinMission", missionId: "ms_kit_insider", creatorId: "cr_ghadaaziz", at: AT })).toThrow(/delivered/);
    s = run(s, brand("logistics"));
    for (let i = 0; i < 4; i++) s = run(s, { type: "advanceKitShipment", kitId: kit.id });
    expect(kitsFor(s, "cr_ghadaaziz")[0].shipment?.status).toBe("delivered");
    expect(() => reducer(s, { type: "advanceKitShipment", kitId: kit.id, at: AT })).toThrow();
    expect(missionsFor(s, s.creators.find((c) => c.id === "cr_ghadaaziz")!).map((m) => m.id)).toContain("ms_kit_insider");
    s = run(s, as("cr_ghadaaziz"), { type: "joinMission", missionId: "ms_kit_insider", creatorId: "cr_ghadaaziz" });
    expect(s.missions.find((m) => m.id === "ms_kit_insider")!.entries.cr_ghadaaziz.state).toBe("joined");
    // One kit per level, ever.
    expect(kitsOwed(s, "cr_ghadaaziz")).toEqual([]);
    expect(kitsFor(s, "cr_ghadaaziz")).toHaveLength(1);
  });
});

describe("posts stay live", () => {
  it("re-checks posts after 30 days and takes back Sparks for one that came down", () => {
    let s = createSeed();
    const due = postsDueForCheck(s);
    expect(due.length).toBeGreaterThan(0);
    const removed = due.find((d) => d.id === "ms_unbox:cr_noorhaddad")!;
    expect(postLiveCheck(removed.url, AT).live).toBe(false);
    const before = balance(s, "cr_noorhaddad");
    const ledgerBefore = s.ledger.length;
    expect(() => reducer(run(s, brand("logistics")), { type: "recheckPosts", at: AT })).toThrow();
    s = run(s, brand("content_reviewer"), { type: "recheckPosts" });
    expect(balance(s, "cr_noorhaddad")).toBe(before - removed.amount);
    expect(s.ledger.slice(0, ledgerBefore)).toEqual(createSeed().ledger);
    expect(s.ledger.some((l) => l.ref.kind === "clawback" && l.ref.id === removed.id && l.delta === -removed.amount)).toBe(true);
    const entry = s.missions.find((m) => m.id === "ms_unbox")!.entries.cr_noorhaddad;
    expect(entry.clawedBack?.amount).toBe(removed.amount);
    expect(entry.submissions.at(-1)?.live).toMatchObject({ live: false, simulated: true });
    // A post that passed is marked and not checked twice.
    expect(s.missions.find((m) => m.id === "ms_unbox")!.entries.cr_laylaoils.submissions.at(-1)?.live?.live).toBe(true);
    expect(() => reducer(s, { type: "recheckPosts", at: AT })).toThrow(/No posts/);
    // The removed starter post no longer counts toward Insider.
    expect(levelTasks(s, "cr_noorhaddad", "insider").find((t) => t.key === "starter")?.done).toBe(false);
  });
});

describe("Sparks expiry", () => {
  it("warns once inside the window, then lapses the balance after a year without activity", () => {
    let s = createSeed();
    const x = sparksExpiry(s, "cr_nourakw");
    expect(x.atRisk).toBe(true);
    expect(sparksExpiry(s, "cr_laylaoils").atRisk).toBe(false);
    s = run(s, brand("finance"), { type: "expireSparks" });
    expect(s.creators.find((c) => c.id === "cr_nourakw")!.expiryWarnedFor).toBe(x.expiresAt);
    expect(balance(s, "cr_nourakw")).toBe(x.balance);
    expect(() => reducer(s, { type: "expireSparks", at: AT })).toThrow(/near expiry/);
    const later = "2026-11-10T10:00:00.000Z";
    s = run(s, { type: "expireSparks", at: later });
    expect(balance(s, "cr_nourakw")).toBe(0);
    expect(s.ledger.at(-1)).toMatchObject({ creatorId: "cr_nourakw", delta: -x.balance, ref: { kind: "expiry" } });
  });

  it("resets the clock on any earning or spending", () => {
    const s0 = createSeed();
    const s: AppState = { ...s0, ledger: [...s0.ledger, { id: "led_test", creatorId: "cr_nourakw", delta: 10, reason: { en: "Test", ar: "Test" }, ref: { kind: "bonus", id: "test" }, at: AT }] };
    expect(sparksExpiry(s, "cr_nourakw").atRisk).toBe(false);
    expect(sparksExpiry(s, "cr_nourakw").daysLeft).toBeGreaterThan(360);
  });
});

describe("charter and alerts", () => {
  const input = { name: "Test Person", handle: "@charter", email: "t@example.com", mobile: "+971 50 123 4567", market: "UAE" as const, city: "Dubai", niche: "food" as const, tier: "nano" as const, followers: 1200, languages: ["en" as const], vibe: "hi", favouritePosts: [], socials: {}, bio: "" };

  it("refuses to register without the charter and records acceptance with it", () => {
    expect(() => reducer(createSeed(), { type: "registerCreator", input: { ...input, charterAccepted: false }, at: AT })).toThrow(/charter/);
    const s = run(createSeed(), { type: "registerCreator", input: { ...input, charterAccepted: true } });
    expect(s.creators.at(-1)?.charter).toMatchObject({ acceptedAt: AT });
  });

  it("tells eligible creators when a mission goes live", () => {
    let s = run(createSeed(), brand("super_admin"));
    const before = s.notifications.length;
    s = run(s, { type: "setMissionStatus", missionId: "ms_ramadan", status: "live" });
    const sent = s.notifications.slice(0, s.notifications.length - before);
    expect(sent.length).toBeGreaterThan(5);
    expect(sent.every((n) => n.channel === "push" && n.link === "/creator/missions/ms_ramadan")).toBe(true);
    // Going live twice does not announce twice.
    const again = run(s, { type: "setMissionStatus", missionId: "ms_ramadan", status: "live" });
    expect(again.notifications.length).toBe(s.notifications.length);
  });

  it("stores the device alert preference on the creator", () => {
    const s = run(createSeed(), as("cr_laylaoils"), { type: "setAlerts", creatorId: "cr_laylaoils", drops: true });
    expect(s.creators.find((c) => c.id === "cr_laylaoils")!.alerts?.drops).toBe(true);
  });
});
