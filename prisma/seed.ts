import { PrismaClient, type Campaign, type Creator } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "dabur2026";

const creators = [
  { name: "Layla Al Mansoori", email: "layla@creators.example", handles: { INSTAGRAM: "@layla.beauty", TIKTOK: "@laylabeauty" }, primaryPlatform: "INSTAGRAM", followerTier: "MACRO", region: "UAE", category: "HAIR", collabType: "BOTH", status: "ACTIVE", tags: ["arabic", "english", "haircare", "tutorials"], avgScore: 8.7 },
  { name: "Omar Farouk", email: "omar@creators.example", handles: { TIKTOK: "@omarcooks", YOUTUBE: "@omarfaroukvlogs" }, primaryPlatform: "TIKTOK", followerTier: "MEGA", region: "EGYPT", category: "HEALTH_OTC", collabType: "PAID", status: "ACTIVE", tags: ["comedy", "family", "arabic"], avgScore: 9.1 },
  { name: "Noora Al Thani", email: "noora@creators.example", handles: { INSTAGRAM: "@noora.glow" }, primaryPlatform: "INSTAGRAM", followerTier: "MICRO", region: "QATAR", category: "SKIN", collabType: "BARTER", status: "ACTIVE", tags: ["skincare", "clean-beauty"], avgScore: 7.9 },
  { name: "Khalid Al Rashid", email: "khalid@creators.example", handles: { YOUTUBE: "@khalidfit", INSTAGRAM: "@khalid.fit" }, primaryPlatform: "YOUTUBE", followerTier: "MACRO", region: "KSA", category: "HEALTH_OTC", collabType: "PAID", status: "ACTIVE", tags: ["fitness", "wellness", "arabic"], avgScore: 8.2 },
  { name: "Fatima Zahran", email: "fatima@creators.example", handles: { INSTAGRAM: "@fatima.hair", TIKTOK: "@fatimahair" }, primaryPlatform: "INSTAGRAM", followerTier: "MICRO", region: "KSA", category: "HAIR", collabType: "BOTH", status: "ACTIVE", tags: ["hijabi-hair", "oils", "arabic"], avgScore: 8.9 },
  { name: "Yousef Behbehani", email: "yousef@creators.example", handles: { SNAPCHAT: "@yousefkw", INSTAGRAM: "@yousef.kw" }, primaryPlatform: "SNAPCHAT", followerTier: "MICRO", region: "KUWAIT", category: "ORAL", collabType: "BARTER", status: "ACTIVE", tags: ["daily-vlogs", "family"], avgScore: 7.4 },
  { name: "Mariam El Sayed", email: "mariam@creators.example", handles: { TIKTOK: "@mariamskin", INSTAGRAM: "@mariam.elsayed" }, primaryPlatform: "TIKTOK", followerTier: "MACRO", region: "EGYPT", category: "SKIN", collabType: "BOTH", status: "ACTIVE", tags: ["dermat-approved", "arabic", "budget-beauty"], avgScore: 8.5 },
  { name: "Salim Al Habsi", email: "salim@creators.example", handles: { INSTAGRAM: "@salim.oman" }, primaryPlatform: "INSTAGRAM", followerTier: "NANO", region: "OMAN", category: "HEALTH_OTC", collabType: "BARTER", status: "PROSPECT", tags: ["outdoors", "wellness"], avgScore: null },
  { name: "Dana Haddad", email: "dana@creators.example", handles: { INSTAGRAM: "@dana.smiles", TIKTOK: "@danasmiles" }, primaryPlatform: "INSTAGRAM", followerTier: "MICRO", region: "UAE", category: "ORAL", collabType: "BOTH", status: "ACTIVE", tags: ["dental", "mom-life", "english"], avgScore: 8.0 },
  { name: "Hassan Al Balushi", email: "hassan@creators.example", handles: { TIKTOK: "@hassan.eats" }, primaryPlatform: "TIKTOK", followerTier: "MICRO", region: "BAHRAIN", category: "HEALTH_OTC", collabType: "PAID", status: "PAUSED", tags: ["food", "juice-reviews"], avgScore: 6.8 },
  { name: "Reem Al Suwaidi", email: "reem@creators.example", handles: { INSTAGRAM: "@reem.style", YOUTUBE: "@reemstyle" }, primaryPlatform: "INSTAGRAM", followerTier: "MEGA", region: "UAE", category: "SKIN", collabType: "PAID", status: "ACTIVE", tags: ["luxury", "arabic", "english", "gets-high-reach"], avgScore: 9.3 },
  { name: "Ahmed Mostafa", email: "ahmed@creators.example", handles: { YOUTUBE: "@ahmedreviews", TIKTOK: "@ahmed.reviews" }, primaryPlatform: "YOUTUBE", followerTier: "NANO", region: "EGYPT", category: "ORAL", collabType: "BARTER", status: "PROSPECT", tags: ["honest-reviews", "student"], avgScore: null },
] as const;

const campaigns = [
  {
    name: "Amla Strong Roots Ramadan",
    brand: "DABUR_AMLA",
    region: "UAE",
    objective: "Drive trial of Dabur Amla Hair Oil among 18-34 women during Ramadan with authentic nightly-routine content.",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-08-15"),
    status: "LIVE",
    openToCreators: true,
    kpis: { reach: "2M", engagementRate: "4.5%", ugcPieces: "40" },
  },
  {
    name: "Vatika Summer Hydration",
    brand: "VATIKA",
    region: "KSA",
    objective: "Position Vatika shampoo as the summer heat-damage fix; hero content from hijabi hair creators.",
    startDate: new Date("2026-06-20"),
    endDate: new Date("2026-09-01"),
    status: "LIVE",
    openToCreators: true,
    kpis: { reach: "3.5M", videoViews: "1.2M", storeVisits: "15K" },
  },
  {
    name: "Hajmola Fun Bites Challenge",
    brand: "HAJMOLA",
    region: "EGYPT",
    objective: "TikTok challenge around the Hajmola tangy-face reaction; comedy and food creators, AR-first.",
    startDate: new Date("2026-07-10"),
    endDate: new Date("2026-08-30"),
    status: "PLANNING",
    openToCreators: true,
    kpis: { challengeVideos: "200", hashtagViews: "10M" },
  },
  {
    name: "Herb'l Bright Smile Week",
    brand: "DABUR_HERBL",
    region: "UAE",
    objective: "Oral-care awareness week with dentists + family creators demoing Herb'l toothpaste variants.",
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-07-31"),
    status: "LIVE",
    openToCreators: true,
    kpis: { reach: "800K", swipeUps: "20K" },
  },
  {
    name: "Real Juice Back-to-School",
    brand: "REAL",
    region: "KSA",
    objective: "Lunchbox-hero positioning for Real juice ahead of the school year; mom & family creators.",
    startDate: new Date("2026-08-15"),
    endDate: new Date("2026-10-01"),
    status: "PLANNING",
    openToCreators: false,
    kpis: { reach: "1.5M", couponRedemptions: "8K" },
  },
] as const;

async function main() {
  console.log("🌱 Seeding Dabur Creator Hub…");

  await prisma.asset.deleteMany();
  await prisma.joinRequest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.creator.deleteMany();
  await prisma.campaign.deleteMany();

  const passwordHash = await hash(DEMO_PASSWORD, 10);

  // ── Creators ──────────────────────────────────────────────────────────────
  const createdCreators: Creator[] = [];
  for (const c of creators) {
    const creator = await prisma.creator.create({
      data: {
        name: c.name,
        email: c.email,
        handles: JSON.stringify(c.handles),
        primaryPlatform: c.primaryPlatform,
        followerTier: c.followerTier,
        region: c.region,
        category: c.category,
        collabType: c.collabType,
        status: c.status,
        tags: JSON.stringify(c.tags),
        avgScore: c.avgScore,
      },
    });
    createdCreators.push(creator);
  }
  const byEmail = (email: string) => {
    const found = createdCreators.find((c) => c.email === email);
    if (!found) throw new Error(`Seed creator not found: ${email}`);
    return found;
  };

  // ── Campaigns ─────────────────────────────────────────────────────────────
  const createdCampaigns: Campaign[] = [];
  for (const c of campaigns) {
    const campaign = await prisma.campaign.create({
      data: { ...c, kpis: JSON.stringify(c.kpis) },
    });
    createdCampaigns.push(campaign);
  }
  const [amla, vatika, hajmola, herbl] = createdCampaigns;

  // ── Demo users (one per role) ─────────────────────────────────────────────
  await prisma.user.create({
    data: { email: "admin@dabur.example", passwordHash, role: "ADMIN", name: "Anita Verma" },
  });
  await prisma.user.create({
    data: { email: "brandlead@dabur.example", passwordHash, role: "BRAND_LEAD", name: "Rajiv Menon" },
  });
  await prisma.user.create({
    data: { email: "marketer.uae@dabur.example", passwordHash, role: "MARKETER", region: "UAE", name: "Sara Haddad" },
  });
  await prisma.user.create({
    data: { email: "marketer.ksa@dabur.example", passwordHash, role: "MARKETER", region: "KSA", name: "Faisal Al Amri" },
  });
  // Creator login mapped to Layla's profile.
  await prisma.user.create({
    data: {
      email: "layla@creators.example",
      passwordHash,
      role: "CREATOR",
      name: "Layla Al Mansoori",
      creatorId: byEmail("layla@creators.example").id,
    },
  });

  // ── Join requests ─────────────────────────────────────────────────────────
  const jr = (
    creatorEmail: string,
    campaignId: string,
    type: "JOIN" | "BARTER",
    status: "PENDING" | "APPROVED" | "REJECTED",
    proposedTerms?: string,
    decisionReason?: string,
  ) =>
    prisma.joinRequest.create({
      data: {
        creatorId: byEmail(creatorEmail).id,
        campaignId,
        type,
        status,
        proposedTerms: proposedTerms ?? null,
        decisionReason: decisionReason ?? null,
      },
    });

  // Approved — these creators can submit assets.
  await jr("layla@creators.example", amla.id, "JOIN", "APPROVED");
  await jr("layla@creators.example", herbl.id, "JOIN", "APPROVED");
  await jr("fatima@creators.example", vatika.id, "BARTER", "APPROVED",
    "Deliverables: 2 Reels + 3 Stories over 4 weeks, Arabic voiceover\nRequested product/perk: Vatika full haircare range + 500 SAR voucher");
  await jr("reem@creators.example", amla.id, "JOIN", "APPROVED");
  await jr("dana@creators.example", herbl.id, "JOIN", "APPROVED");

  // Pending — populate the approval queue.
  await jr("noora@creators.example", amla.id, "BARTER", "PENDING",
    "Deliverables: 1 Reel + 2 Stories with before/after hair transformation\nRequested product/perk: Amla oil gift box for giveaway to followers");
  await jr("khalid@creators.example", vatika.id, "JOIN", "PENDING");
  await jr("omar@creators.example", hajmola.id, "JOIN", "PENDING");
  await jr("mariam@creators.example", hajmola.id, "BARTER", "PENDING",
    "Deliverables: 3 TikTok challenge videos with custom sound\nRequested product/perk: Hajmola variety pack + featured repost on brand page");
  await jr("salim@creators.example", amla.id, "BARTER", "PENDING",
    "Deliverables: 1 Reel on desert-proof hair care\nRequested product/perk: Product hamper");
  await jr("ahmed@creators.example", herbl.id, "JOIN", "PENDING");

  // Rejected — with a reason, visible in the creator's tracker.
  await jr("hassan@creators.example", vatika.id, "JOIN", "REJECTED", undefined,
    "Creator profile is paused pending content-quality review from the last collaboration.");
  await jr("yousef@creators.example", amla.id, "JOIN", "REJECTED", undefined,
    "Campaign targets hair-category creators; Yousef's audience skews oral care. Suggested for Herb'l Bright Smile Week instead.");

  // ── Assets ────────────────────────────────────────────────────────────────
  const asset = (
    creatorEmail: string,
    campaignId: string,
    type: "REEL" | "STORY" | "UGC" | "POST",
    url: string,
    caption: string,
    status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "LIVE",
    feedback?: string,
  ) =>
    prisma.asset.create({
      data: {
        creatorId: byEmail(creatorEmail).id,
        campaignId,
        type,
        url,
        caption,
        status,
        feedback: feedback ?? null,
      },
    });

  await asset("layla@creators.example", amla.id, "REEL",
    "https://instagram.com/reel/amla-night-routine-layla",
    "My grandmother's secret, bottled 🌙 Night-time amla ritual for stronger roots — Ramadan edition. #DaburAmla #ad",
    "SUBMITTED");
  await asset("layla@creators.example", amla.id, "STORY",
    "https://instagram.com/stories/layla-amla-unboxing",
    "Unboxing the Amla Strong Roots kit — swipe up for my routine!",
    "APPROVED", "Beautiful lighting and clear product shots. Cleared to publish.");
  await asset("layla@creators.example", herbl.id, "POST",
    "https://instagram.com/p/herbl-smile-layla",
    "Switched my whole family to Herb'l — here's why the neem variant won us over. #HerblSmile",
    "REJECTED", "Please reshoot: the packshot shows the old packaging. Use the 2026 design sent in the brief, and add the #ad disclosure at the start of the caption.");
  await asset("reem@creators.example", amla.id, "REEL",
    "https://instagram.com/reel/reem-amla-glam",
    "Luxury isn't a price tag — it's a ritual ✨ My amla oil wrap before every event.",
    "UNDER_REVIEW");
  await asset("reem@creators.example", amla.id, "UGC",
    "https://drive.google.com/dabur/reem-amla-ugc-cut",
    "15s UGC cut for paid amplification — three hook variants included.",
    "SUBMITTED");
  await asset("fatima@creators.example", vatika.id, "REEL",
    "https://tiktok.com/@fatimahair/video/vatika-summer",
    "50°C outside and my hair is still hydrated 🥥 Vatika summer survival guide, part 1.",
    "SUBMITTED");
  await asset("dana@creators.example", herbl.id, "STORY",
    "https://instagram.com/stories/dana-herbl-kids",
    "Getting my kids to ACTUALLY brush for 2 minutes — Herb'l strawberry to the rescue.",
    "LIVE");

  const counts = {
    creators: await prisma.creator.count(),
    campaigns: await prisma.campaign.count(),
    joinRequests: await prisma.joinRequest.count(),
    assets: await prisma.asset.count(),
    users: await prisma.user.count(),
  };
  console.log("✅ Seeded:", counts);
  console.log(`
  Demo logins (password for all: ${DEMO_PASSWORD})
  ─ ADMIN       admin@dabur.example
  ─ BRAND_LEAD  brandlead@dabur.example
  ─ MARKETER    marketer.uae@dabur.example  (UAE-scoped)
  ─ CREATOR     layla@creators.example
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
