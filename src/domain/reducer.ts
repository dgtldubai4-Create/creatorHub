import type {
  AppState, Campaign, CampaignStatus, Creator, Lang, Language, Localised, Market, Mission, MissionStatus, Niche, Notification, Participation, Platform, Role, Seat,
  Shipment, Stage, VerificationState, FollowerTier,
} from "./types";
import { appendStage, assertTransition } from "./stages";
import { assertCan } from "./permissions";
import { autoCheck, connectAccount, COURIERS, fnv1a, missionCheck, monthKey, newId, nextShipmentStatus, otpFor, prevMonthKey, SHIPMENT_STAGE, trackingNumber } from "./simulate";
import { currentSeason, isDoubleSparks, leaderboard, meetsLevel, trackProgress } from "./selectors";

// ---------- Action union ----------

export type Action = (
  | { type: "hydrate"; state: AppState }
  | { type: "reset"; state: AppState }
  | { type: "setLanguage"; lang: Lang }
  | { type: "signIn"; seat: Seat; creatorId?: string; role?: Role }
  | { type: "signOut" }
  | { type: "switchSeat"; seat: Seat }
  | { type: "setRole"; role: Role }
  | { type: "registerCreator"; input: RegisterInput }
  | { type: "respondInvite"; participationId: string; accept: boolean; reason?: string }
  | { type: "confirmProfile"; participationId: string }
  | { type: "advanceShipment"; participationId: string }
  | { type: "startShoot"; participationId: string }
  | { type: "upload"; participationId: string; filename: string; sizeBytes: number; durationSec: number }
  | { type: "review"; participationId: string; submissionId: string; decision: "changes" | "approved"; note: string; notes: { t: number; text: string }[] }
  | { type: "publish"; participationId: string; platform: Platform; url: string }
  | { type: "verifyPost"; participationId: string }
  | { type: "releasePoints"; participationId: string }
  | { type: "complete"; participationId: string }
  | { type: "joinMission"; missionId: string; creatorId: string; squadId?: string }
  | { type: "submitMission"; missionId: string; creatorId: string; url: string; caption: string }
  | { type: "reviewMission"; missionId: string; creatorId: string; decision: "approved" | "changes"; note: string }
  | { type: "saveMission"; mission: Mission }
  | { type: "setMissionStatus"; missionId: string; status: MissionStatus }
  | { type: "completeModule"; creatorId: string; trackId: string; moduleId: string }
  | { type: "bookMentor"; creatorId: string; sessionId: string }
  | { type: "enterWildcard"; creatorId: string }
  | { type: "voteAmbassador"; voterId: string; candidateId: string }
  | { type: "advanceSeason"; seasonId: string }
  | { type: "selectAmbassadors"; seasonId: string; cohort: string[] }
  | { type: "refer"; creatorId: string; handle: string }
  | { type: "decideReferral"; referralId: string; approve: boolean }
  | { type: "verifyMobile"; creatorId: string; code: string }
  | { type: "connectSocial"; creatorId: string; platform: Platform; handle: string }
  | { type: "setLicence"; creatorId: string; number: string }
  | { type: "redeem"; creatorId: string; rewardId: string }
  | { type: "fulfilRedemption"; redemptionId: string }
  | { type: "invite"; campaignId: string; creatorIds: string[] }
  | { type: "saveCampaign"; campaign: Campaign }
  | { type: "setCampaignStatus"; campaignId: string; status: CampaignStatus }
  | { type: "verifyCreator"; creatorId: string; field: "identity" | "instagram" | "tiktok"; state: VerificationState }
  | { type: "updateProfile"; creatorId: string; patch: Partial<Pick<Creator, "socials" | "address" | "bio" | "city" | "name" | "languages" | "vibe" | "favouritePosts">> }
  | { type: "markRead"; audience: string }
  | { type: "clearError" }
) & { at?: string };

export interface RegisterInput {
  name: string;
  handle: string;
  email: string;
  mobile: string;
  market: Market;
  city: string;
  niche: Niche;
  tier: FollowerTier;
  followers: number;
  languages: Language[];
  vibe: string;
  favouritePosts: string[];
  socials: Partial<Record<Platform, string>>;
  bio: string;
  referralCode?: string;
}

export type ActionType = Action["type"];

// ---------- helpers ----------

const CAMPAIGN_ORDER: CampaignStatus[] = ["draft", "inviting", "active", "review", "publishing", "completed"];

function bumpCampaign(state: AppState, campaignId: string, status: CampaignStatus): AppState {
  return {
    ...state,
    campaigns: state.campaigns.map((c) =>
      c.id === campaignId && CAMPAIGN_ORDER.indexOf(status) > CAMPAIGN_ORDER.indexOf(c.status) ? { ...c, status } : c,
    ),
  };
}

function notify(
  state: AppState,
  audience: string,
  channel: Notification["channel"],
  title: Localised,
  body: Localised,
  at: string,
  link?: string,
): AppState {
  const n: Notification = { id: newId("ntf"), audience, channel, title, body, link, at, read: false, simulated: true };
  return { ...state, notifications: [n, ...state.notifications] };
}

function participation(state: AppState, id: string): Participation {
  const p = state.participations.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown participation ${id}`);
  return p;
}

function campaignOf(state: AppState, p: Participation): Campaign {
  const c = state.campaigns.find((x) => x.id === p.campaignId);
  if (!c) throw new Error(`Unknown campaign ${p.campaignId}`);
  return c;
}

function creatorOf(state: AppState, id: string): Creator {
  const c = state.creators.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown creator ${id}`);
  return c;
}

function missionOf(state: AppState, id: string): Mission {
  const m = state.missions.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown mission ${id}`);
  return m;
}

function replaceMission(state: AppState, m: Mission): AppState {
  return { ...state, missions: state.missions.map((x) => (x.id === m.id ? m : x)) };
}

function replaceSeason(state: AppState, sn: AppState["seasons"][number]): AppState {
  return { ...state, seasons: state.seasons.map((x) => (x.id === sn.id ? sn : x)) };
}

export const STREAK_BONUS = 50;

/**
 * Streak bonus: the first Sparks-earning action in a month, when the previous month
 * also had one, adds a bonus entry and bumps the creator's streak counter.
 */
function awardStreak(state: AppState, creatorId: string, at: string): AppState {
  const month = monthKey(at);
  const mine = state.ledger.filter((l) => l.creatorId === creatorId && l.delta > 0);
  const thisMonth = mine.filter((l) => monthKey(l.at) === month);
  const alreadyBonus = thisMonth.some((l) => l.ref.kind === "streak");
  const lastMonth = mine.some((l) => monthKey(l.at) === prevMonthKey(month));
  if (alreadyBonus || thisMonth.length !== 1 || !lastMonth) return state;
  return {
    ...state,
    ledger: [...state.ledger, { id: newId("led", `streak:${creatorId}:${month}`), creatorId, delta: STREAK_BONUS, reason: { en: "Streak bonus", ar: "مكافأة الاستمرارية" }, ref: { kind: "streak", id: month }, at }],
    creators: state.creators.map((c) => (c.id === creatorId ? { ...c, streakMonths: c.streakMonths + 1 } : c)),
  };
}

function replaceParticipation(state: AppState, p: Participation): AppState {
  return { ...state, participations: state.participations.map((x) => (x.id === p.id ? p : x)) };
}

/** Move a participation forward one edge, appending to the immutable log. */
function move(p: Participation, to: Stage, at: string, extra?: { note?: string; by?: string }): Participation {
  assertTransition(p.stage, to);
  return { ...p, stage: to, stageLog: appendStage(p.stageLog, to, at, extra) };
}

function requireCreatorSeat(state: AppState, creatorId: string): void {
  if (state.session.seat !== "creator" || state.session.creatorId !== creatorId) {
    throw new Error("This action belongs to the signed-in creator.");
  }
}

function requireBrand(state: AppState, permission: Parameters<typeof assertCan>[1]): void {
  if (state.session.seat !== "brand") throw new Error("Switch to the brand-team seat for this action.");
  assertCan(state.session.role, permission);
}

function brandUserName(state: AppState): string {
  return state.brandUsers.find((u) => u.id === state.session.brandUserId)?.name ?? "Brand team";
}

// ---------- reducer ----------

export function reducer(state: AppState, action: Action): AppState {
  const at = action.at ?? new Date().toISOString();
  const withNow = (s: AppState): AppState => (s.now < at ? { ...s, now: at } : s);

  switch (action.type) {
    case "hydrate":
    case "reset":
      return action.state;

    case "clearError":
      return { ...state, lastError: undefined };

    case "setLanguage":
      return { ...state, lang: action.lang };

    case "signIn": {
      const role = action.role ?? state.session.role;
      const brandUserId = state.brandUsers.find((u) => u.role === role)?.id ?? state.session.brandUserId;
      return {
        ...state,
        session: { seat: action.seat, creatorId: action.seat === "creator" ? (action.creatorId ?? state.creators[0]?.id ?? null) : state.session.creatorId, role, brandUserId },
      };
    }

    case "signOut":
      return { ...state, session: { ...state.session, seat: null } };

    case "switchSeat":
      return { ...state, session: { ...state.session, seat: action.seat, creatorId: state.session.creatorId ?? state.creators[0]?.id ?? null } };

    case "setRole": {
      const brandUserId = state.brandUsers.find((u) => u.role === action.role)?.id ?? state.session.brandUserId;
      return { ...state, session: { ...state.session, role: action.role, brandUserId } };
    }

    case "registerCreator": {
      const i = action.input;
      const id = newId("cr", i.handle);
      const creator: Creator = {
        id,
        name: i.name,
        handle: i.handle.replace(/^@/, ""),
        market: i.market,
        city: i.city,
        niche: i.niche,
        tier: i.tier,
        followers: i.followers,
        photo: null,
        hue: fnv1a(i.handle) % 360,
        bio: { en: i.bio, ar: i.bio },
        verification: { identity: "pending", instagram: i.socials.instagram ? "pending" : "action", tiktok: i.socials.tiktok ? "pending" : "action" },
        socials: i.socials,
        connected: {
          ...(i.socials.instagram ? { instagram: connectAccount("instagram", i.socials.instagram, at) } : {}),
          ...(i.socials.tiktok ? { tiktok: connectAccount("tiktok", i.socials.tiktok, at) } : {}),
        },
        languages: i.languages.length ? i.languages : ["en"],
        vibe: { en: i.vibe, ar: i.vibe },
        favouritePosts: i.favouritePosts,
        email: i.email,
        mobile: i.mobile,
        mobileVerified: true,
        licence: { state: "pending" },
        address: { line1: "", city: i.city, market: i.market, phone: i.mobile, confirmed: false },
        joinedAt: at,
        streakMonths: 0,
        referredBy: i.referralCode,
      };
      let s: AppState = { ...state, creators: [...state.creators, creator], session: { ...state.session, seat: "creator", creatorId: id } };
      s = { ...s, ledger: [...s.ledger, { id: newId("led", `welcome:${id}`), creatorId: id, delta: 100, reason: { en: "Welcome bonus", ar: "مكافأة ترحيبية" }, ref: { kind: "bonus", id: "welcome" }, at }] };
      s = notify(s, `creator:${id}`, "email", { en: "Welcome to the Squad", ar: "أهلاً بك في السكواد" }, { en: "We review every profile within 5 working days. Your welcome kit and starter missions unlock on approval.", ar: "نراجع كل ملف خلال 5 أيام عمل. كيت الترحيب ومهام البداية تُفتح بعد الموافقة." }, at, "/creator/profile");
      s = notify(s, "brand", "inapp", { en: `${i.name} applied to join`, ar: `${i.name} قدّم طلب انضمام` }, { en: `@${creator.handle} from ${i.city}. Identity verification pending.`, ar: `@${creator.handle} من ${i.city}. التحقق من الهوية قيد الانتظار.` }, at, `/admin/creators/${id}`);
      return withNow(s);
    }

    case "respondInvite": {
      const p = participation(state, action.participationId);
      requireCreatorSeat(state, p.creatorId);
      const c = campaignOf(state, p);
      const cr = creatorOf(state, p.creatorId);
      const next = action.accept ? move(p, "accepted", at) : move(p, "declined", at, { note: action.reason });
      let s = replaceParticipation(state, next);
      if (action.accept) {
        s = bumpCampaign(s, c.id, "active");
        s = notify(s, "brand", "inapp", { en: `${cr.name} accepted ${c.title.en}`, ar: `${cr.name} قبِل ${c.title.ar}` }, { en: "Address confirmation is next on their side.", ar: "الخطوة التالية عندهم: تأكيد العنوان." }, at, `/admin/campaigns/${c.id}`);
        s = notify(s, `creator:${cr.id}`, "push", { en: "You are in", ar: "تم قبولك" }, { en: `Confirm your address so we can ship the ${c.title.en} kit.`, ar: `أكّد عنوانك ليصلك كيت ${c.title.ar}.` }, at, `/creator/campaigns/${p.id}/kit`);
      } else {
        s = notify(s, "brand", "inapp", { en: `${cr.name} declined ${c.title.en}`, ar: `${cr.name} اعتذر عن ${c.title.ar}` }, { en: action.reason ?? "No reason given.", ar: action.reason ?? "لم يُذكر سبب." }, at, `/admin/campaigns/${c.id}`);
      }
      return withNow(s);
    }

    case "confirmProfile": {
      const p = participation(state, action.participationId);
      requireCreatorSeat(state, p.creatorId);
      const cr = creatorOf(state, p.creatorId);
      if (!cr.address.line1 || !cr.address.phone) throw new Error("Add a delivery address and phone number first.");
      const courier = COURIERS[fnv1a(p.id) % COURIERS.length];
      const shipment: Shipment = { courier, trackingNumber: trackingNumber(courier, p.id), status: "address_confirmed", updatedAt: at, simulated: true };
      const next = { ...move(p, "profile_confirmed", at), shipment };
      let s = replaceParticipation(state, next);
      s = { ...s, creators: s.creators.map((x) => (x.id === cr.id ? { ...x, address: { ...x.address, confirmed: true } } : x)) };
      s = notify(s, "brand", "inapp", { en: `Kit ready to pack for ${cr.name}`, ar: `الكيت جاهز للتغليف لـ ${cr.name}` }, { en: `Address confirmed. ${courier} booking generated.`, ar: `تم تأكيد العنوان. تم إنشاء حجز ${courier}.` }, at, "/admin/logistics");
      return withNow(s);
    }

    case "advanceShipment": {
      requireBrand(state, "logistics");
      const p = participation(state, action.participationId);
      if (!p.shipment) throw new Error("No shipment on this participation yet.");
      const status = nextShipmentStatus(p.shipment.status);
      if (!status) throw new Error("Shipment already delivered.");
      const stage = SHIPMENT_STAGE[status];
      const next: Participation = { ...move(p, stage, at, { by: brandUserName(state) }), shipment: { ...p.shipment, status, updatedAt: at } };
      let s = replaceParticipation(state, next);
      const c = campaignOf(state, p);
      const bodies: Record<string, Localised> = {
        preparing: { en: "Your kit is being packed.", ar: "يجري تغليف الكيت الخاص بك." },
        dispatched: { en: `${p.shipment.courier} picked up your kit. Tracking ${p.shipment.trackingNumber}.`, ar: `${p.shipment.courier} استلم الكيت. رقم التتبع ${p.shipment.trackingNumber}.` },
        out_for_delivery: { en: "Out for delivery today. Keep your phone close.", ar: "في الطريق إليك اليوم. أبقِ هاتفك قريباً." },
        delivered: { en: "Delivered. Unbox, breathe, and start shooting when you are ready.", ar: "تم التسليم. افتح الصندوق وابدأ التصوير عندما تكون جاهزاً." },
      };
      s = notify(s, `creator:${p.creatorId}`, "push", { en: c.title.en, ar: c.title.ar }, bodies[status], at, `/creator/campaigns/${p.id}/kit`);
      return withNow(s);
    }

    case "startShoot": {
      const p = participation(state, action.participationId);
      requireCreatorSeat(state, p.creatorId);
      return withNow(replaceParticipation(state, move(p, "shoot", at)));
    }

    case "upload": {
      const p = participation(state, action.participationId);
      requireCreatorSeat(state, p.creatorId);
      const c = campaignOf(state, p);
      const version = p.submissions.length + 1;
      const check = autoCheck(action.filename, action.sizeBytes, version, c.brief.acceptance, action.durationSec, c.brief.durationSec);
      const submission = { id: newId("sub", `${p.id}:${version}`), participationId: p.id, filename: action.filename, sizeBytes: action.sizeBytes, durationSec: action.durationSec, version, uploadedAt: at, check };
      // first_cut -> auto_check -> manual_review, or revised_cut -> manual_review on the loop.
      // The automated check runs on every version; it is stored on the submission.
      let next: Participation;
      if (p.stage === "changes_requested") {
        next = move(p, "revised_cut", at, { note: `v${version} scored ${check.score}` });
      } else {
        next = move(p, "first_cut", at);
        next = move(next, "auto_check", at, { note: `v${version} scored ${check.score}` });
      }
      next = move(next, "manual_review", at);
      next = { ...next, submissions: [...p.submissions, submission] };
      let s = replaceParticipation(state, next);
      s = bumpCampaign(s, c.id, "review");
      const cr = creatorOf(state, p.creatorId);
      s = notify(s, "brand", "inapp", { en: `New cut from ${cr.name}`, ar: `مقطع جديد من ${cr.name}` }, { en: `${c.title.en} v${version}. Auto check ${check.score}/100.`, ar: `${c.title.ar} الإصدار ${version}. الفحص الآلي ${check.score}/100.` }, at, `/admin/review/${p.id}/${submission.id}`);
      return withNow(s);
    }

    case "review": {
      requireBrand(state, "review");
      const p = participation(state, action.participationId);
      const sub = p.submissions.find((x) => x.id === action.submissionId);
      if (!sub) throw new Error("Unknown submission.");
      const review = { id: newId("rev", sub.id), participationId: p.id, submissionId: sub.id, decision: action.decision, note: action.note, notes: action.notes, reviewerId: state.session.brandUserId, reviewerName: brandUserName(state), at };
      const to: Stage = action.decision === "approved" ? "approved_to_publish" : "changes_requested";
      const next: Participation = { ...move(p, to, at, { by: review.reviewerName, note: action.note }), reviews: [...p.reviews, review] };
      let s = replaceParticipation(state, next);
      const c = campaignOf(state, p);
      if (action.decision === "approved") s = bumpCampaign(s, c.id, "publishing");
      s = notify(
        s,
        `creator:${p.creatorId}`,
        "push",
        action.decision === "approved" ? { en: "Approved. Go post it.", ar: "تمت الموافقة. انشره الآن." } : { en: "A few changes requested", ar: "بعض التعديلات مطلوبة" },
        { en: action.note || `${review.reviewerName} left ${action.notes.length} notes on v${sub.version}.`, ar: action.note || `${review.reviewerName} ترك ${action.notes.length} ملاحظات على الإصدار ${sub.version}.` },
        at,
        `/creator/campaigns/${p.id}/feedback`,
      );
      return withNow(s);
    }

    case "publish": {
      const p = participation(state, action.participationId);
      requireCreatorSeat(state, p.creatorId);
      if (!/^https?:\/\//.test(action.url)) throw new Error("Paste the full post link, starting with https://");
      const next: Participation = { ...move(p, "link_submitted", at), publish: { platform: action.platform, url: action.url, postedAt: at, verified: false } };
      let s = replaceParticipation(state, next);
      const cr = creatorOf(state, p.creatorId);
      const c = campaignOf(state, p);
      s = notify(s, "brand", "inapp", { en: `${cr.name} posted ${c.title.en}`, ar: `${cr.name} نشر ${c.title.ar}` }, { en: `Verify the ${action.platform} link to release ${c.points} Sparks.`, ar: `تحقق من رابط ${action.platform} لتحرير ${c.points} سباركس.` }, at, `/admin/campaigns/${c.id}`);
      return withNow(s);
    }

    case "verifyPost": {
      requireBrand(state, "review");
      const p = participation(state, action.participationId);
      if (!p.publish) throw new Error("No post link yet.");
      const next: Participation = { ...move(p, "post_verified", at, { by: brandUserName(state) }), publish: { ...p.publish, verified: true, verifiedAt: at } };
      let s = replaceParticipation(state, next);
      s = notify(s, `creator:${p.creatorId}`, "push", { en: "Post verified", ar: "تم التحقق من المنشور" }, { en: "Finance releases your Sparks next.", ar: "الخطوة التالية: تحرير السباركس من الفريق المالي." }, at, `/creator/campaigns/${p.id}/publish`);
      return withNow(s);
    }

    case "releasePoints": {
      requireBrand(state, "loyalty");
      const p = participation(state, action.participationId);
      if (p.stage !== "post_verified") throw new Error("Sparks release only after the post is verified.");
      if (state.ledger.some((l) => l.ref.kind === "participation" && l.ref.id === p.id)) throw new Error("Sparks already released for this participation.");
      const c = campaignOf(state, p);
      const entry = { id: newId("led", p.id), creatorId: p.creatorId, delta: c.points, reason: { en: `${c.title.en} completed`, ar: `اكتمال ${c.title.ar}` }, ref: { kind: "participation" as const, id: p.id }, at };
      let s = replaceParticipation(state, move(p, "points_released", at, { by: brandUserName(state) }));
      s = { ...s, ledger: [...s.ledger, entry] };
      s = awardStreak(s, p.creatorId, at);
      s = notify(s, `creator:${p.creatorId}`, "push", { en: `+${c.points} Sparks`, ar: `+${c.points} سباركس` }, { en: `${c.title.en} is done. Spend them in Rewards.`, ar: `اكتمل ${c.title.ar}. استخدمها في المكافآت.` }, at, "/creator/rewards");
      return withNow(s);
    }

    case "complete": {
      const p = participation(state, action.participationId);
      const next = move(p, "completed", at);
      let s = replaceParticipation(state, next);
      const c = campaignOf(state, p);
      const all = s.participations.filter((x) => x.campaignId === c.id);
      if (all.every((x) => x.stage === "completed" || x.stage === "declined")) s = bumpCampaign(s, c.id, "completed");
      return withNow(s);
    }

    case "joinMission": {
      requireCreatorSeat(state, action.creatorId);
      const m = missionOf(state, action.missionId);
      if (m.status !== "live") throw new Error("This mission is not live.");
      if (m.entries[action.creatorId]) throw new Error("You already joined this mission.");
      if (!meetsLevel(state, action.creatorId, m.levelRequired)) throw new Error(`This mission opens at ${m.levelRequired} level.`);
      if (m.trackId && !trackProgress(state, action.creatorId, m.trackId).complete) throw new Error("Finish the Academy track first.");
      let squads = m.squads;
      if (m.type === "team") {
        if (!squads?.length) throw new Error("This team mission has no squads yet.");
        const target = squads.find((q) => q.id === action.squadId) ?? [...squads].sort((a, b) => a.memberIds.length - b.memberIds.length)[0];
        squads = squads.map((q) => (q.id === target.id ? { ...q, memberIds: [...q.memberIds, action.creatorId] } : q));
      }
      const squadId = m.type === "team" ? squads!.find((q) => q.memberIds.includes(action.creatorId))!.id : undefined;
      const entries = { ...m.entries, [action.creatorId]: { state: "joined" as const, joinedAt: at, squadId, submissions: [] } };
      return withNow(replaceMission(state, { ...m, squads, entries }));
    }

    case "submitMission": {
      requireCreatorSeat(state, action.creatorId);
      const m = missionOf(state, action.missionId);
      const e = m.entries[action.creatorId];
      if (!e) throw new Error("Join the mission first.");
      if (e.state !== "joined" && e.state !== "changes") throw new Error("This mission is already submitted.");
      if (!/^https?:\/\//.test(action.url) && m.type !== "referral") throw new Error("Paste the full post link, starting with https://");
      const check = missionCheck(action.caption, m.requiredHashtags, at, m.window);
      const sub = { id: newId("ms", `${m.id}:${action.creatorId}:${e.submissions.length + 1}`), url: action.url, caption: action.caption, at, check };
      const entries = { ...m.entries, [action.creatorId]: { ...e, state: "submitted" as const, submissions: [...e.submissions, sub] } };
      let s = replaceMission(state, { ...m, entries });
      const cr = creatorOf(state, action.creatorId);
      s = notify(s, "brand", "inapp", { en: `${cr.name} submitted ${m.title.en}`, ar: `${cr.name} سلّم ${m.title.ar}` }, check.passed ? { en: "Auto check passed. Needs a light review.", ar: "اجتاز الفحص الآلي. يحتاج مراجعة خفيفة." } : { en: "Auto check flagged something. Review before approving.", ar: "الفحص الآلي رصد ملاحظة. راجع قبل الاعتماد." }, at, `/admin/missions/${m.id}`);
      return withNow(s);
    }

    case "reviewMission": {
      requireBrand(state, "review");
      const m = missionOf(state, action.missionId);
      const e = m.entries[action.creatorId];
      if (!e || e.state !== "submitted") throw new Error("Nothing to review for this creator.");
      const last = e.submissions[e.submissions.length - 1];
      const reviewed = { ...last, decision: action.decision, note: action.note, reviewedAt: at, reviewerName: brandUserName(state) };
      const submissions = [...e.submissions.slice(0, -1), reviewed];
      if (action.decision === "changes") {
        let s = replaceMission(state, { ...m, entries: { ...m.entries, [action.creatorId]: { ...e, state: "changes", submissions } } });
        s = notify(s, `creator:${action.creatorId}`, "push", { en: `Changes on ${m.title.en}`, ar: `تعديلات على ${m.title.ar}` }, { en: action.note || "A reviewer asked for a small fix.", ar: action.note || "طلب المراجع تعديلاً بسيطاً." }, at, `/creator/missions/${m.id}`);
        return withNow(s);
      }
      const awarded = isDoubleSparks(state, m) ? m.sparks * 2 : m.sparks;
      let s = replaceMission(state, { ...m, entries: { ...m.entries, [action.creatorId]: { ...e, state: "completed", submissions, awarded } } });
      s = { ...s, ledger: [...s.ledger, { id: newId("led", `${m.id}:${action.creatorId}`), creatorId: action.creatorId, delta: awarded, reason: { en: `Mission: ${m.title.en}`, ar: `مهمة: ${m.title.ar}` }, ref: { kind: "mission", id: `${m.id}:${action.creatorId}` }, at }] };
      s = awardStreak(s, action.creatorId, at);
      s = notify(s, `creator:${action.creatorId}`, "push", { en: `+${awarded} Sparks`, ar: `+${awarded} سباركس` }, { en: `${m.title.en} approved.`, ar: `تم اعتماد ${m.title.ar}.` }, at, "/creator/rewards");
      return withNow(s);
    }

    case "saveMission": {
      requireBrand(state, "campaigns");
      const exists = state.missions.some((m) => m.id === action.mission.id);
      return withNow({ ...state, missions: exists ? state.missions.map((m) => (m.id === action.mission.id ? action.mission : m)) : [...state.missions, action.mission] });
    }

    case "setMissionStatus": {
      requireBrand(state, "campaigns");
      const m = missionOf(state, action.missionId);
      return withNow(replaceMission(state, { ...m, status: action.status }));
    }

    case "completeModule": {
      requireCreatorSeat(state, action.creatorId);
      const track = state.academy.tracks.find((t) => t.id === action.trackId);
      if (!track) throw new Error("Unknown track.");
      if (!track.modules.some((x) => x.id === action.moduleId)) throw new Error("Unknown module.");
      if (!meetsLevel(state, action.creatorId, track.levelRequired)) throw new Error(`This track opens at ${track.levelRequired} level.`);
      const mine = { ...(state.academy.progress[action.creatorId] ?? {}) };
      if (mine[action.moduleId]) return state;
      mine[action.moduleId] = at;
      let s: AppState = { ...state, academy: { ...state.academy, progress: { ...state.academy.progress, [action.creatorId]: mine } } };
      const done = track.modules.every((x) => mine[x.id]);
      const certs = s.academy.certificates[action.creatorId] ?? [];
      if (done && !certs.includes(track.id)) {
        s = { ...s, academy: { ...s.academy, certificates: { ...s.academy.certificates, [action.creatorId]: [...certs, track.id] } } };
        s = { ...s, ledger: [...s.ledger, { id: newId("led", `academy:${track.id}:${action.creatorId}`), creatorId: action.creatorId, delta: track.sparks, reason: { en: `Academy: ${track.title.en}`, ar: `الأكاديمية: ${track.title.ar}` }, ref: { kind: "academy", id: `${track.id}:${action.creatorId}` }, at }] };
        s = awardStreak(s, action.creatorId, at);
        s = notify(s, `creator:${action.creatorId}`, "email", { en: "Certificate earned", ar: "حصلت على شهادة" }, { en: `${track.title.en} complete. +${track.sparks} Sparks and a certificate for your media kit.`, ar: `اكتمل ${track.title.ar}. +${track.sparks} سباركس وشهادة لملفك التعريفي.` }, at, "/creator/academy");
      }
      return withNow(s);
    }

    case "bookMentor": {
      requireCreatorSeat(state, action.creatorId);
      const ses = state.mentorSessions.find((x) => x.id === action.sessionId);
      if (!ses) throw new Error("Unknown session.");
      if (ses.bookedBy.includes(action.creatorId)) throw new Error("Already booked.");
      if (ses.bookedBy.length >= ses.seats) throw new Error("No seats left.");
      if (!meetsLevel(state, action.creatorId, ses.levelRequired)) throw new Error(`Mentoring opens at ${ses.levelRequired} level.`);
      return withNow({ ...state, mentorSessions: state.mentorSessions.map((x) => (x.id === ses.id ? { ...x, bookedBy: [...x.bookedBy, action.creatorId] } : x)) });
    }

    case "enterWildcard": {
      requireCreatorSeat(state, action.creatorId);
      const season = currentSeason(state);
      if (season.ambassadors.phase !== "wildcard_open") throw new Error("Wildcard entries are closed right now.");
      if (season.ambassadors.wildcards.includes(action.creatorId) || season.ambassadors.shortlist.includes(action.creatorId)) throw new Error("You are already in the running.");
      return withNow(replaceSeason(state, { ...season, ambassadors: { ...season.ambassadors, wildcards: [...season.ambassadors.wildcards, action.creatorId] } }));
    }

    case "voteAmbassador": {
      requireCreatorSeat(state, action.voterId);
      const season = currentSeason(state);
      if (season.ambassadors.phase !== "voting") throw new Error("Voting is not open.");
      if (season.ambassadors.votes[action.voterId]) throw new Error("One vote per season.");
      if (action.voterId === action.candidateId) throw new Error("You cannot vote for yourself.");
      const candidates = [...season.ambassadors.shortlist, ...season.ambassadors.wildcards];
      if (!candidates.includes(action.candidateId)) throw new Error("Not a candidate this season.");
      return withNow(replaceSeason(state, { ...season, ambassadors: { ...season.ambassadors, votes: { ...season.ambassadors.votes, [action.voterId]: action.candidateId } } }));
    }

    case "advanceSeason": {
      requireBrand(state, "campaigns");
      const season = state.seasons.find((x) => x.id === action.seasonId);
      if (!season) throw new Error("Unknown season.");
      const order = ["upcoming", "wildcard_open", "voting", "selected"] as const;
      const i = order.indexOf(season.ambassadors.phase);
      if (i >= order.length - 2) throw new Error("Use the selection panel to pick the cohort.");
      const next = order[i + 1];
      let amb = { ...season.ambassadors, phase: next };
      if (next === "voting") {
        // Invite the top Pro creators by season Sparks and quality.
        const top = leaderboard(state, season).filter((x) => x.level === "pro" || x.level === "ambassador").slice(0, 6).map((x) => x.creator.id);
        amb = { ...amb, shortlist: Array.from(new Set([...amb.shortlist, ...top])) };
      }
      let s = replaceSeason(state, { ...season, ambassadors: amb });
      if (next === "wildcard_open") {
        for (const c of s.creators) s = notify(s, `creator:${c.id}`, "push", { en: `${season.name.en}: wildcard entries open`, ar: `${season.name.ar}: فتح باب الترشح` }, { en: "Newcomers can enter the Ambassador round this week.", ar: "يمكن للجدد دخول جولة السفراء هذا الأسبوع." }, at, "/creator/season");
      }
      if (next === "voting") {
        for (const id of amb.shortlist) s = notify(s, `creator:${id}`, "email", { en: "You are shortlisted for Ambassador", ar: "تم ترشيحك للسفراء" }, { en: "Complete the challenge brief. Audience votes and the jury decide.", ar: "أكمل موجز التحدي. يقرر الجمهور ولجنة التحكيم." }, at, "/creator/season");
      }
      return withNow(s);
    }

    case "selectAmbassadors": {
      requireBrand(state, "campaigns");
      const season = state.seasons.find((x) => x.id === action.seasonId);
      if (!season) throw new Error("Unknown season.");
      if (season.ambassadors.phase !== "voting") throw new Error("Open voting before selecting a cohort.");
      if (action.cohort.length < 1 || action.cohort.length > 8) throw new Error("Pick between 1 and 8 Ambassadors.");
      let s = replaceSeason(state, { ...season, ambassadors: { ...season.ambassadors, phase: "selected", cohort: action.cohort } });
      for (const id of action.cohort) s = notify(s, `creator:${id}`, "email", { en: "You are a Dabur Squad Ambassador", ar: "أنت سفير دابر سكواد" }, { en: `A 3-month paid partnership for ${season.name.en} starts now.`, ar: `تبدأ الآن شراكة مدفوعة لثلاثة أشهر لموسم ${season.name.ar}.` }, at, "/creator/season");
      return withNow(s);
    }

    case "refer": {
      requireCreatorSeat(state, action.creatorId);
      const handle = action.handle.replace(/^@/, "").trim();
      if (handle.length < 2) throw new Error("Enter the creator's handle.");
      if (state.referrals.some((r) => r.handle.toLowerCase() === handle.toLowerCase())) throw new Error("That creator was already referred.");
      let s: AppState = { ...state, referrals: [...state.referrals, { id: newId("ref", handle), referrerId: action.creatorId, handle, status: "pending", at }] };
      const cr = creatorOf(state, action.creatorId);
      s = notify(s, "brand", "inapp", { en: `${cr.name} referred @${handle}`, ar: `${cr.name} رشّح @${handle}` }, { en: "Approve to award referral Sparks.", ar: "اعتمد لمنح سباركس الإحالة." }, at, "/admin/missions");
      return withNow(s);
    }

    case "decideReferral": {
      requireBrand(state, "invite");
      const r = state.referrals.find((x) => x.id === action.referralId);
      if (!r || r.status !== "pending") throw new Error("Nothing to decide.");
      let s: AppState = { ...state, referrals: state.referrals.map((x) => (x.id === r.id ? { ...x, status: action.approve ? "approved" : "rejected" } : x)) };
      if (action.approve) {
        const m = state.missions.find((x) => x.type === "referral" && x.status === "live");
        const delta = m?.sparks ?? 150;
        s = { ...s, ledger: [...s.ledger, { id: newId("led", r.id), creatorId: r.referrerId, delta, reason: { en: `Referral: @${r.handle}`, ar: `إحالة: @${r.handle}` }, ref: { kind: "referral", id: r.id }, at }] };
        s = awardStreak(s, r.referrerId, at);
        s = notify(s, `creator:${r.referrerId}`, "push", { en: `+${delta} Sparks`, ar: `+${delta} سباركس` }, { en: `@${r.handle} was approved.`, ar: `تم اعتماد @${r.handle}.` }, at, "/creator/rewards");
      }
      return withNow(s);
    }

    case "verifyMobile": {
      const cr = creatorOf(state, action.creatorId);
      if (action.code.trim() !== otpFor(cr.mobile)) throw new Error("That code does not match.");
      return withNow({ ...state, creators: state.creators.map((x) => (x.id === cr.id ? { ...x, mobileVerified: true } : x)) });
    }

    case "connectSocial": {
      requireCreatorSeat(state, action.creatorId);
      const acc = connectAccount(action.platform, action.handle, at);
      return withNow({
        ...state,
        creators: state.creators.map((x) => (x.id === action.creatorId ? { ...x, socials: { ...x.socials, [action.platform]: acc.handle }, connected: { ...x.connected, [action.platform]: acc }, verification: { ...x.verification, [action.platform]: "pending" } } : x)),
      });
    }

    case "setLicence": {
      requireCreatorSeat(state, action.creatorId);
      return withNow({ ...state, creators: state.creators.map((x) => (x.id === action.creatorId ? { ...x, licence: { state: "pending", number: action.number.trim() } } : x)) });
    }

    case "redeem": {
      requireCreatorSeat(state, action.creatorId);
      const r = state.rewards.find((x) => x.id === action.rewardId);
      if (!r) throw new Error("Unknown reward.");
      if (r.stock <= 0) throw new Error("This reward is out of stock.");
      const balance = state.ledger.filter((l) => l.creatorId === action.creatorId).reduce((s, l) => s + l.delta, 0);
      if (balance < r.cost) throw new Error(`You need ${r.cost - balance} more Sparks for this.`);
      const redemption = { id: newId("rdm"), creatorId: action.creatorId, rewardId: r.id, cost: r.cost, status: "requested" as const, at };
      let s: AppState = {
        ...state,
        rewards: state.rewards.map((x) => (x.id === r.id ? { ...x, stock: x.stock - 1 } : x)),
        redemptions: [...state.redemptions, redemption],
        ledger: [...state.ledger, { id: newId("led", redemption.id), creatorId: action.creatorId, delta: -r.cost, reason: { en: `Redeemed ${r.title.en}`, ar: `استبدال ${r.title.ar}` }, ref: { kind: "redemption", id: redemption.id }, at }],
      };
      const cr = creatorOf(state, action.creatorId);
      s = notify(s, "brand", "inapp", { en: `${cr.name} redeemed ${r.title.en}`, ar: `${cr.name} استبدل ${r.title.ar}` }, { en: `${r.cost} Sparks. Needs fulfilment.`, ar: `${r.cost} سباركس. بانتظار التنفيذ.` }, at, "/admin/loyalty");
      return withNow(s);
    }

    case "fulfilRedemption": {
      requireBrand(state, "loyalty");
      const rd = state.redemptions.find((x) => x.id === action.redemptionId);
      if (!rd) throw new Error("Unknown redemption.");
      if (rd.status === "fulfilled") throw new Error("Already fulfilled.");
      const r = state.rewards.find((x) => x.id === rd.rewardId);
      let s: AppState = { ...state, redemptions: state.redemptions.map((x) => (x.id === rd.id ? { ...x, status: "fulfilled" as const, fulfilledAt: at } : x)) };
      s = notify(s, `creator:${rd.creatorId}`, "email", { en: "Reward on its way", ar: "مكافأتك في الطريق" }, { en: `${r?.title.en ?? "Your reward"} has been fulfilled.`, ar: `تم تنفيذ ${r?.title.ar ?? "مكافأتك"}.` }, at, "/creator/rewards");
      return withNow(s);
    }

    case "invite": {
      requireBrand(state, "invite");
      const c = state.campaigns.find((x) => x.id === action.campaignId);
      if (!c) throw new Error("Unknown campaign.");
      const existing = new Set(state.participations.filter((p) => p.campaignId === c.id).map((p) => p.creatorId));
      const fresh = action.creatorIds.filter((id) => !existing.has(id));
      if (fresh.length === 0) throw new Error("Everyone selected is already on this campaign.");
      const created: Participation[] = fresh.map((creatorId) => ({
        id: newId("pt", `${c.id}:${creatorId}`),
        creatorId,
        campaignId: c.id,
        stage: "invited",
        stageLog: [{ stage: "invited", at, by: brandUserName(state) }],
        submissions: [],
        reviews: [],
        shipment: null,
        publish: null,
        invitedAt: at,
      }));
      let s: AppState = { ...state, participations: [...state.participations, ...created] };
      s = bumpCampaign(s, c.id, "inviting");
      for (const p of created) {
        s = notify(s, `creator:${p.creatorId}`, "email", { en: `You are invited: ${c.title.en}`, ar: `دعوة: ${c.title.ar}` }, { en: `${c.points} Sparks, kit included. Respond in the portal.`, ar: `${c.points} سباركس مع كيت المنتجات. رُدّ من البوابة.` }, at, "/creator/invitations");
      }
      return withNow(s);
    }

    case "saveCampaign": {
      requireBrand(state, "campaigns");
      const exists = state.campaigns.some((x) => x.id === action.campaign.id);
      return withNow({ ...state, campaigns: exists ? state.campaigns.map((x) => (x.id === action.campaign.id ? action.campaign : x)) : [...state.campaigns, action.campaign] });
    }

    case "setCampaignStatus": {
      requireBrand(state, "campaigns");
      return withNow(bumpCampaign(state, action.campaignId, action.status));
    }

    case "verifyCreator": {
      requireBrand(state, "invite");
      const cr = creatorOf(state, action.creatorId);
      let s: AppState = { ...state, creators: state.creators.map((x) => (x.id === cr.id ? { ...x, verification: { ...x.verification, [action.field]: action.state } } : x)) };
      const label = { identity: { en: "Identity", ar: "الهوية" }, instagram: { en: "Instagram", ar: "إنستغرام" }, tiktok: { en: "TikTok", ar: "تيك توك" } }[action.field];
      const body = action.state === "verified"
        ? { en: `${label.en} verified.`, ar: `تم التحقق من ${label.ar}.` }
        : action.state === "action"
          ? { en: `${label.en} needs your attention. Update it in your profile.`, ar: `${label.ar} يحتاج إلى انتباهك. حدّثه في ملفك.` }
          : { en: `${label.en} is being checked.`, ar: `${label.ar} قيد الفحص.` };
      s = notify(s, `creator:${cr.id}`, "push", { en: "Verification update", ar: "تحديث التحقق" }, body, at, "/creator/profile");
      return withNow(s);
    }

    case "updateProfile": {
      requireCreatorSeat(state, action.creatorId);
      return withNow({ ...state, creators: state.creators.map((x) => (x.id === action.creatorId ? { ...x, ...action.patch, address: { ...x.address, ...(action.patch.address ?? {}) }, socials: { ...x.socials, ...(action.patch.socials ?? {}) } } : x)) });
    }

    case "markRead":
      return { ...state, notifications: state.notifications.map((n) => (n.audience === action.audience ? { ...n, read: true } : n)) };
  }
}

/** Never throws: errors land in `state.lastError` for the UI to surface. */
export function safeReducer(state: AppState, action: Action): AppState {
  try {
    return reducer(state, action);
  } catch (e) {
    return { ...state, lastError: { message: e instanceof Error ? e.message : String(e), at: action.at ?? new Date().toISOString(), action: action.type } };
  }
}
