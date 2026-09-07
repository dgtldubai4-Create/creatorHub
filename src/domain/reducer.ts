import type {
  AppState, Campaign, CampaignStatus, Creator, Lang, Localised, Market, Niche, Notification, Participation, Platform, Role, Seat,
  Shipment, Stage, VerificationState, FollowerTier,
} from "./types";
import { appendStage, assertTransition } from "./stages";
import { assertCan } from "./permissions";
import { autoCheck, COURIERS, fnv1a, newId, nextShipmentStatus, SHIPMENT_STAGE, trackingNumber } from "./simulate";

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
  | { type: "joinQuest"; questId: string; creatorId: string }
  | { type: "submitQuest"; questId: string; creatorId: string; filename: string }
  | { type: "reviewQuest"; questId: string; creatorId: string }
  | { type: "completeQuest"; questId: string; creatorId: string }
  | { type: "redeem"; creatorId: string; rewardId: string }
  | { type: "fulfilRedemption"; redemptionId: string }
  | { type: "invite"; campaignId: string; creatorIds: string[] }
  | { type: "saveCampaign"; campaign: Campaign }
  | { type: "setCampaignStatus"; campaignId: string; status: CampaignStatus }
  | { type: "verifyCreator"; creatorId: string; field: "identity" | "instagram" | "tiktok"; state: VerificationState }
  | { type: "updateProfile"; creatorId: string; patch: Partial<Pick<Creator, "socials" | "address" | "bio" | "city" | "name">> }
  | { type: "markRead"; audience: string }
  | { type: "clearError" }
) & { at?: string };

export interface RegisterInput {
  name: string;
  handle: string;
  market: Market;
  city: string;
  niche: Niche;
  tier: FollowerTier;
  followers: number;
  socials: Partial<Record<Platform, string>>;
  bio: string;
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
        address: { line1: "", city: i.city, market: i.market, phone: "", confirmed: false },
        joinedAt: at,
        streakWeeks: 0,
      };
      let s: AppState = { ...state, creators: [...state.creators, creator], session: { ...state.session, seat: "creator", creatorId: id } };
      s = notify(s, `creator:${id}`, "email", { en: "Welcome to the Squad", ar: "أهلاً بك في السكواد" }, { en: "We are reviewing your profile. Verification usually takes two working days.", ar: "نراجع ملفك الآن. يستغرق التحقق عادةً يومي عمل." }, at, "/creator/profile");
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
      s = notify(s, "brand", "inapp", { en: `${cr.name} posted ${c.title.en}`, ar: `${cr.name} نشر ${c.title.ar}` }, { en: `Verify the ${action.platform} link to release ${c.points} points.`, ar: `تحقق من رابط ${action.platform} لتحرير ${c.points} نقطة.` }, at, `/admin/campaigns/${c.id}`);
      return withNow(s);
    }

    case "verifyPost": {
      requireBrand(state, "review");
      const p = participation(state, action.participationId);
      if (!p.publish) throw new Error("No post link yet.");
      const next: Participation = { ...move(p, "post_verified", at, { by: brandUserName(state) }), publish: { ...p.publish, verified: true, verifiedAt: at } };
      let s = replaceParticipation(state, next);
      s = notify(s, `creator:${p.creatorId}`, "push", { en: "Post verified", ar: "تم التحقق من المنشور" }, { en: "Finance releases your points next.", ar: "الخطوة التالية: تحرير النقاط من الفريق المالي." }, at, `/creator/campaigns/${p.id}/publish`);
      return withNow(s);
    }

    case "releasePoints": {
      requireBrand(state, "loyalty");
      const p = participation(state, action.participationId);
      if (p.stage !== "post_verified") throw new Error("Points release only after the post is verified.");
      if (state.ledger.some((l) => l.ref.kind === "participation" && l.ref.id === p.id)) throw new Error("Points already released for this participation.");
      const c = campaignOf(state, p);
      const entry = { id: newId("led", p.id), creatorId: p.creatorId, delta: c.points, reason: { en: `${c.title.en} completed`, ar: `اكتمال ${c.title.ar}` }, ref: { kind: "participation" as const, id: p.id }, at };
      let s = replaceParticipation(state, move(p, "points_released", at, { by: brandUserName(state) }));
      s = { ...s, ledger: [...s.ledger, entry] };
      s = notify(s, `creator:${p.creatorId}`, "push", { en: `+${c.points} points`, ar: `+${c.points} نقطة` }, { en: `${c.title.en} is done. Spend them in Rewards.`, ar: `اكتمل ${c.title.ar}. استخدمها في المكافآت.` }, at, "/creator/rewards");
      return withNow(s);
    }

    case "complete": {
      const p = participation(state, action.participationId);
      const next = move(p, "completed", at);
      let s = replaceParticipation(state, next);
      const c = campaignOf(state, p);
      const all = s.participations.filter((x) => x.campaignId === c.id);
      if (all.every((x) => x.stage === "completed" || x.stage === "declined")) s = bumpCampaign(s, c.id, "completed");
      s = { ...s, creators: s.creators.map((x) => (x.id === p.creatorId ? { ...x, streakWeeks: x.streakWeeks + 1 } : x)) };
      return withNow(s);
    }

    case "joinQuest":
    case "submitQuest":
    case "reviewQuest":
    case "completeQuest": {
      const q = state.quests.find((x) => x.id === action.questId);
      if (!q) throw new Error("Unknown quest.");
      const current = q.states[action.creatorId] ?? "open";
      const order = ["open", "joined", "submitted", "reviewed", "completed"] as const;
      const target = ({ joinQuest: "joined", submitQuest: "submitted", reviewQuest: "reviewed", completeQuest: "completed" } as const)[action.type];
      if (order.indexOf(target) !== order.indexOf(current) + 1) throw new Error(`Quest is ${current}; cannot move to ${target}.`);
      if (action.type === "joinQuest" || action.type === "submitQuest") requireCreatorSeat(state, action.creatorId);
      else requireBrand(state, action.type === "reviewQuest" ? "review" : "loyalty");
      const quest = {
        ...q,
        states: { ...q.states, [action.creatorId]: target },
        submissions: action.type === "submitQuest" ? { ...q.submissions, [action.creatorId]: { filename: action.filename, at } } : q.submissions,
      };
      let s: AppState = { ...state, quests: state.quests.map((x) => (x.id === q.id ? quest : x)) };
      if (action.type === "completeQuest") {
        if (s.ledger.some((l) => l.ref.kind === "quest" && l.ref.id === `${q.id}:${action.creatorId}`)) throw new Error("Quest points already released.");
        s = { ...s, ledger: [...s.ledger, { id: newId("led", `${q.id}:${action.creatorId}`), creatorId: action.creatorId, delta: q.points, reason: { en: `Side quest: ${q.title.en}`, ar: `مهمة جانبية: ${q.title.ar}` }, ref: { kind: "quest", id: `${q.id}:${action.creatorId}` }, at }] };
        s = notify(s, `creator:${action.creatorId}`, "push", { en: `+${q.points} points`, ar: `+${q.points} نقطة` }, { en: `${q.title.en} reviewed and rewarded.`, ar: `تمت مراجعة ${q.title.ar} ومكافأتك.` }, at, "/creator/rewards");
      }
      if (action.type === "submitQuest") {
        const cr = creatorOf(state, action.creatorId);
        s = notify(s, "brand", "inapp", { en: `${cr.name} submitted a side quest`, ar: `${cr.name} سلّم مهمة جانبية` }, { en: q.title.en, ar: q.title.ar }, at, `/creator/side-quests/${q.id}`);
      }
      return withNow(s);
    }

    case "redeem": {
      requireCreatorSeat(state, action.creatorId);
      const r = state.rewards.find((x) => x.id === action.rewardId);
      if (!r) throw new Error("Unknown reward.");
      if (r.stock <= 0) throw new Error("This reward is out of stock.");
      const balance = state.ledger.filter((l) => l.creatorId === action.creatorId).reduce((s, l) => s + l.delta, 0);
      if (balance < r.cost) throw new Error(`You need ${r.cost - balance} more points for this.`);
      const redemption = { id: newId("rdm"), creatorId: action.creatorId, rewardId: r.id, cost: r.cost, status: "requested" as const, at };
      let s: AppState = {
        ...state,
        rewards: state.rewards.map((x) => (x.id === r.id ? { ...x, stock: x.stock - 1 } : x)),
        redemptions: [...state.redemptions, redemption],
        ledger: [...state.ledger, { id: newId("led", redemption.id), creatorId: action.creatorId, delta: -r.cost, reason: { en: `Redeemed ${r.title.en}`, ar: `استبدال ${r.title.ar}` }, ref: { kind: "redemption", id: redemption.id }, at }],
      };
      const cr = creatorOf(state, action.creatorId);
      s = notify(s, "brand", "inapp", { en: `${cr.name} redeemed ${r.title.en}`, ar: `${cr.name} استبدل ${r.title.ar}` }, { en: `${r.cost} points. Needs fulfilment.`, ar: `${r.cost} نقطة. بانتظار التنفيذ.` }, at, "/admin/loyalty");
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
        s = notify(s, `creator:${p.creatorId}`, "email", { en: `You are invited: ${c.title.en}`, ar: `دعوة: ${c.title.ar}` }, { en: `${c.points} points, kit included. Respond in the portal.`, ar: `${c.points} نقطة مع كيت المنتجات. رُدّ من البوابة.` }, at, "/creator/invitations");
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
