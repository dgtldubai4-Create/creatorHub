import { PrismaClient, type Campaign, type Course, type Creator, type Reward } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "dabur2026";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

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
    tagline: "Your grandmother's secret, your generation's story.",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-08-15"),
    submissionDeadline: new Date("2026-09-20"),
    status: "LIVE",
    openToCreators: true,
    kpis: { reach: "2M", engagementRate: "4.5%", ugcPieces: "40" },
    basePoints: 120,
    compensation: "AED 2,500–6,000 per creator (tier-based) + full Amla ritual kit",
    deliverables: [
      { type: "REEL", qty: 2, notes: "Night-routine narrative, 30–45s, Arabic or bilingual VO" },
      { type: "STORY", qty: 3, notes: "Unboxing + swipe-up to product page" },
      { type: "UGC", qty: 1, notes: "15s cut for paid amplification, 3 hook variants" },
    ],
    dos: [
      "Open with your real hair story — heritage angle wins here",
      "Show the oil texture and massage ritual close-up",
      "Use #DaburAmla #StrongRoots and tag @dabur.arabia",
      "Disclose the partnership with #ad in the first line",
    ],
    donts: [
      "No heat-styling shots in the same frame as the product",
      "Don't promise medical outcomes (regrowth, dandruff cure)",
      "Don't show competitor bottles on the shelf",
    ],
  },
  {
    name: "Vatika Summer Hydration",
    brand: "VATIKA",
    region: "KSA",
    objective: "Position Vatika shampoo as the summer heat-damage fix; hero content from hijabi hair creators.",
    tagline: "50°C outside. Hydrated all the same.",
    startDate: new Date("2026-06-20"),
    endDate: new Date("2026-09-01"),
    submissionDeadline: new Date("2026-09-25"),
    status: "LIVE",
    openToCreators: true,
    kpis: { reach: "3.5M", videoViews: "1.2M", storeVisits: "15K" },
    basePoints: 100,
    compensation: "SAR 2,000–5,000 per creator + Vatika full range",
    deliverables: [
      { type: "REEL", qty: 2, notes: "Summer survival guide format, before/after welcome" },
      { type: "STORY", qty: 4, notes: "Poll + question stickers encouraged" },
    ],
    dos: [
      "Speak to covered-hair care explicitly — it's the hero insight",
      "Feature the coconut variant in at least one deliverable",
      "Arabic-first captions; English subtitles welcome",
    ],
    donts: [
      "No beach/pool settings (brand safety for KSA)",
      "Don't crop the bottle label out of frame",
    ],
  },
  {
    name: "Hajmola Fun Bites Challenge",
    brand: "HAJMOLA",
    region: "EGYPT",
    objective: "TikTok challenge around the Hajmola tangy-face reaction; comedy and food creators, AR-first.",
    tagline: "One tablet. One face. Ten million views.",
    startDate: new Date("2026-07-10"),
    endDate: new Date("2026-08-30"),
    submissionDeadline: new Date("2026-09-10"),
    status: "PLANNING",
    openToCreators: true,
    kpis: { challengeVideos: "200", hashtagViews: "10M" },
    basePoints: 90,
    compensation: "EGP 15,000–40,000 for anchor creators; barter packs for challenge entries",
    deliverables: [
      { type: "REEL", qty: 3, notes: "Challenge format with custom sound — react, tag 3 friends" },
    ],
    dos: [
      "Use the official #HajmolaChallenge sound",
      "First bite reaction must be unscripted — authenticity is the format",
      "Duet/stitch chains encouraged",
    ],
    donts: [
      "Don't cut before the reaction lands",
      "No health claims — it's a fun candy-adjacent format",
    ],
  },
  {
    name: "Herb'l Bright Smile Week",
    brand: "DABUR_HERBL",
    region: "UAE",
    objective: "Oral-care awareness week with dentists + family creators demoing Herb'l toothpaste variants.",
    tagline: "Seven days. One brighter smile.",
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-07-31"),
    submissionDeadline: new Date("2026-09-15"),
    status: "LIVE",
    openToCreators: true,
    kpis: { reach: "800K", swipeUps: "20K" },
    basePoints: 80,
    compensation: "Barter-first: Herb'l family bundle + AED 500 voucher; paid slots for dental professionals",
    deliverables: [
      { type: "POST", qty: 1, notes: "Family routine carousel or single-frame" },
      { type: "STORY", qty: 2, notes: "Morning + night routine, link sticker to variant page" },
    ],
    dos: [
      "Show the 2026 packaging (sent in your kit) — old packshots will be rejected",
      "Kids in frame need guardian consent in your submission note",
      "Mention the neem or clove variant by name",
    ],
    donts: [
      "No before/after teeth whitening claims",
      "Don't compare against named competitor pastes",
    ],
  },
  {
    name: "Real Juice Back-to-School",
    brand: "REAL",
    region: "KSA",
    objective: "Lunchbox-hero positioning for Real juice ahead of the school year; mom & family creators.",
    tagline: "The lunchbox upgrade every kid votes for.",
    startDate: new Date("2026-08-15"),
    endDate: new Date("2026-10-01"),
    submissionDeadline: new Date("2026-10-10"),
    status: "PLANNING",
    openToCreators: false,
    kpis: { reach: "1.5M", couponRedemptions: "8K" },
    basePoints: 100,
    compensation: "SAR 1,500–4,000 + Real month-supply pack",
    deliverables: [
      { type: "REEL", qty: 1, notes: "Lunchbox packing ASMR or morning-rush format" },
      { type: "STORY", qty: 3, notes: "Coupon code sticker in final frame" },
    ],
    dos: ["Feature the no-added-sugar range", "Show the juice box in a real lunchbox"],
    donts: ["No school uniforms with visible school logos"],
  },
] as const;

// ── Rewards catalog ──────────────────────────────────────────────────────────

const rewards = [
  { title: "Amla Ritual Gift Box", description: "Full Dabur Amla range in the collector's Ramadan box — yours or run it as a giveaway.", category: "PRODUCT", emoji: "🎁", pointsCost: 300, minTier: "SPROUT", stock: 40 },
  { title: "Vatika Season Drop", description: "Every new Vatika launch shipped to you a month before it hits shelves.", category: "PRODUCT", emoji: "🥥", pointsCost: 450, minTier: "TULSI", stock: 25 },
  { title: "AED 250 Content Fund", description: "Voucher toward props, studio time or editing for your next Dabur deliverable.", category: "VOUCHER", emoji: "💳", pointsCost: 600, minTier: "TULSI", stock: 30 },
  { title: "Paid Amplification Boost", description: "We put paid media behind your best-performing approved asset for 2 weeks.", category: "BOOST", emoji: "🚀", pointsCost: 900, minTier: "TULSI", stock: 15 },
  { title: "1:1 With the Brand Team", description: "A 45-minute call with the brand manager of your category — pitch your big idea.", category: "EXPERIENCE", emoji: "🎯", pointsCost: 1200, minTier: "AMLA", stock: 10 },
  { title: "Studio Day in Dubai", description: "A produced shoot day — studio, lighting, retouching — for your media kit.", category: "EXPERIENCE", emoji: "📸", pointsCost: 2000, minTier: "AMLA", stock: 6 },
  { title: "Creator Summit Seat", description: "Flights + stay for the annual DaburStars summit in Dubai.", category: "EXPERIENCE", emoji: "✈️", pointsCost: 3500, minTier: "KESAR", stock: 8 },
  { title: "Ambassador Track Review", description: "Formal review for a 12-month paid ambassador contract with a Dabur brand.", category: "BOOST", emoji: "👑", pointsCost: 5000, minTier: "KESAR", stock: 3 },
] as const;

// ── Academy courses ──────────────────────────────────────────────────────────

const courses = [
  {
    slug: "daburstars-playbook",
    title: "The DaburStars Playbook",
    summary: "How the program works: tiers, points, briefs, approvals — and how creators actually climb.",
    emoji: "🌟",
    level: "FOUNDATION",
    minutes: 12,
    points: 60,
    order: 1,
    lessons: [
      { title: "How points and tiers work", body: "Every approved piece of content, accepted launch and completed course earns points. Points never expire and never go down — redeeming rewards spends from your balance but your tier is based on lifetime points. Sprout starts at 0, Tulsi at 500, Amla at 1,500 and Kesar at 4,000. Tier upgrades apply instantly and unlock priority review, paid-first briefs and eventually the ambassador track." },
      { title: "Reading a brief like a pro", body: "Every launch brief has four load-bearing sections: deliverables (exactly what to make and how many), the do's (non-negotiable brand asks — these are what reviewers check first), the don'ts (instant-rejection territory: claims, competitors, unsafe settings) and compensation. Read the don'ts twice. The single biggest cause of rejected content is a don't that was skimmed." },
      { title: "The approval loop", body: "Submit → review (48h for Tulsi+) → approved, or rejected with a written reason. A rejection is not a strike — fix the reason and resubmit. Approved content earns the campaign's base points; when it goes live on your channel and we verify it, a live bonus lands on top. Marketers can see your revision speed, and fast fixers get shortlisted for paid briefs." },
    ],
    quiz: [
      { question: "Your tier is based on…", options: ["Your current points balance after redemptions", "Lifetime points earned", "Follower count", "Number of campaigns joined"], answer: 1 },
      { question: "The fastest way to get content rejected is…", options: ["Posting in Arabic", "Skipping a 'don't' in the brief", "Submitting early", "Using your own hooks"], answer: 1 },
      { question: "What happens after a rejection?", options: ["You lose points", "You're removed from the campaign", "You fix the stated reason and resubmit", "Nothing — rejections are final"], answer: 2 },
    ],
  },
  {
    slug: "hooks-that-stop-the-scroll",
    title: "Hooks That Stop the Scroll",
    summary: "The first 1.5 seconds decide everything. Hook formulas that work for FMCG content in MENA.",
    emoji: "🪝",
    level: "INTERMEDIATE",
    minutes: 18,
    points: 80,
    order: 2,
    lessons: [
      { title: "The 3 hook families", body: "Curiosity ('the mistake everyone makes with hair oil'), stakes ('I tested this for 30 days in Dubai heat') and pattern-break (an unexpected visual in frame one — the tangy Hajmola face is a pattern-break hook). Your first frame should work with the sound OFF: 85% of Reels views start muted. Put the promise in text on frame one, then deliver it fast." },
      { title: "Localizing hooks for MENA", body: "Heritage angles outperform generic beauty claims across the region — 'my grandmother's ritual' beats 'my haircare routine'. Ramadan and back-to-school are emotional peaks; anchor hooks to the season the brief targets. Arabic-first with English subtitles widens reach in UAE; KSA audiences reward Arabic-only authenticity." },
      { title: "Hooks reviewers love", body: "Reviewers approve fastest when the brand shows up inside the hook, not after it. 'Why is this 50-year-old oil sold out in Dubai?' names the product's story without a hard sell. Avoid bait-and-switch hooks — retention collapses at the reveal and the asset underperforms, which shows in your creator analytics." },
    ],
    quiz: [
      { question: "Most Reels views start…", options: ["With sound on", "Muted", "On desktop", "From hashtags"], answer: 1 },
      { question: "Which hook family is the Hajmola tangy-face?", options: ["Curiosity", "Stakes", "Pattern-break", "Testimonial"], answer: 2 },
      { question: "The strongest MENA angle per regional data is…", options: ["Price comparisons", "Heritage and ritual", "Celebrity lookalikes", "Unboxing"], answer: 1 },
    ],
  },
  {
    slug: "shooting-product-like-a-pro",
    title: "Shooting Product Like a Pro",
    summary: "Phone-only lighting, packshots and texture shots that pass brand review the first time.",
    emoji: "📱",
    level: "INTERMEDIATE",
    minutes: 15,
    points: 80,
    order: 3,
    lessons: [
      { title: "Light is 80% of the shot", body: "Window light at 45° beats any ringlight for product texture. Shoot oils and liquids backlit so the light passes through the bottle — that glow is what makes Amla oil look like amber instead of brown. Golden hour works for lifestyle frames but never for packshots: label legibility comes first, so packshots want soft, even, front-facing light." },
      { title: "The packshot checklist", body: "Current-year packaging (check your kit — old packaging is auto-reject), label facing camera and fully in frame, no competitor products visible, no heat tools next to haircare. Wipe the bottle: fingerprints read as neglect at 1080p. Shoot packshots at the START of your session while the product is pristine." },
      { title: "Texture tells the story", body: "FMCG review teams look for one 'texture proof' moment: oil on palms, paste on the brush, juice pour with condensation. Shoot it macro, slow, in one take. This one shot does more for approval odds than any transition — it proves real use, which is the whole point of creator content." },
    ],
    quiz: [
      { question: "Best light for a packshot?", options: ["Golden hour backlight", "Soft even front light", "Neon accent light", "Direct noon sun"], answer: 1 },
      { question: "An automatic rejection is…", options: ["Arabic captions", "Old-year packaging", "Macro texture shots", "Window light"], answer: 1 },
      { question: "The 'texture proof' moment is…", options: ["A transition trend", "A close-up of real product use", "A logo animation", "A discount code frame"], answer: 1 },
    ],
  },
  {
    slug: "from-barter-to-paid",
    title: "From Barter to Paid",
    summary: "Build the media kit, the numbers story and the pitch that moves you into paid briefs.",
    emoji: "💼",
    level: "ADVANCED",
    minutes: 20,
    points: 100,
    order: 4,
    lessons: [
      { title: "What marketers actually compare", body: "Not followers — saves-per-reach, comment quality, and your approval history in this hub. A 20K micro-creator with 6% saves beats a 300K account with drive-by likes for FMCG trial objectives. Your DaburStars profile is your live media kit: approval rate, live assets and tier are visible to every marketer casting a launch." },
      { title: "Pricing yourself in MENA", body: "Regional benchmarks per Reel: nano SAR 300–800, micro SAR 800–3,000, macro SAR 3,000–12,000 — but bundles win: a 2-Reel + 3-Story package prices ~30% below the line-item sum and gets you repeat slots. Never price below your barter value; it anchors you as a sampling channel, not a partner." },
      { title: "The upgrade pitch", body: "The move from barter to paid happens in your proposal note: reference your live assets in this hub by result ('my Herb'l story drove 1,200 link taps'), state a bundle price, and ask for one paid slot in the next launch. Marketers approve barter-to-paid upgrades directly in the queue — make the decision easy with numbers they can verify here." },
    ],
    quiz: [
      { question: "For FMCG trial, marketers weight most…", options: ["Follower count", "Saves-per-reach and approval history", "Posting frequency", "Verified badge"], answer: 1 },
      { question: "Bundles should price…", options: ["Above line-item sum", "~30% below line-item sum", "Exactly at line-item sum", "Free for exposure"], answer: 1 },
      { question: "Your strongest upgrade-pitch evidence is…", options: ["Screenshots from other brands", "Verifiable results on your live assets in this hub", "A follower milestone", "A discount offer"], answer: 1 },
    ],
  },
  {
    slug: "ramadan-content-calendar",
    title: "The Ramadan Content Calendar",
    summary: "Planning the region's biggest content season: timing, tone and the suhoor-to-iftar rhythm.",
    emoji: "🌙",
    level: "ADVANCED",
    minutes: 16,
    points: 100,
    order: 5,
    lessons: [
      { title: "The season's three phases", body: "Pre-Ramadan (2 weeks out): preparation and intention content — routines, pantry, self-care setups. This is when trial-driving content peaks. Mid-Ramadan: slower, warmer, family-centered — nighttime rituals fit here, which is why the Amla night-routine brief lands mid-season. Eid: celebration, gifting, transformation reveals. Match your deliverable schedule to the phase the brief targets." },
      { title: "Timing the day", body: "Engagement clusters after iftar (20:30–23:30 local) and around suhoor (02:00–03:30). Schedule Reels for post-iftar; Stories perform through the late window. Daytime posting during fasting hours sees 40–60% lower engagement — never burn a hero asset there. Fridays post-Jumu'ah is the week's strongest slot." },
      { title: "Tone rules", body: "Generosity, family, gratitude — not consumption. Frame products as enablers of ritual ('the oil massage before tarawih') rather than indulgence. Avoid eating/drinking visuals during fasting-hour posts. Modest styling reads as respect, and brands' regional teams review Ramadan content with extra care — expect stricter do's and don'ts in seasonal briefs." },
    ],
    quiz: [
      { question: "Trial-driving content peaks…", options: ["Eid week", "Pre-Ramadan", "Mid-Ramadan", "After Ramadan"], answer: 1 },
      { question: "The strongest daily engagement window is…", options: ["Post-iftar evening", "Noon", "Fasting-hour afternoon", "Sunrise"], answer: 0 },
      { question: "Ramadan product framing should center…", options: ["Indulgence", "Ritual and generosity", "Scarcity discounts", "Competitions"], answer: 1 },
    ],
  },
] as const;

async function main() {
  console.log("🌱 Seeding Dabur Creator Hub (DaburStars program)…");

  await prisma.notification.deleteMany();
  await prisma.earning.deleteMany();
  await prisma.courseProgress.deleteMany();
  await prisma.course.deleteMany();
  await prisma.redemption.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.pointsEvent.deleteMany();
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
      data: {
        ...c,
        kpis: JSON.stringify(c.kpis),
        deliverables: JSON.stringify(c.deliverables),
        dos: JSON.stringify(c.dos),
        donts: JSON.stringify(c.donts),
      },
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
  const marketerUae = await prisma.user.create({
    data: { email: "marketer.uae@dabur.example", passwordHash, role: "MARKETER", region: "UAE", name: "Sara Haddad" },
  });
  await prisma.user.create({
    data: { email: "marketer.ksa@dabur.example", passwordHash, role: "MARKETER", region: "KSA", name: "Faisal Al Amri" },
  });
  const laylaUser = await prisma.user.create({
    data: {
      email: "layla@creators.example",
      passwordHash,
      role: "CREATOR",
      name: "Layla Al Mansoori",
      creatorId: byEmail("layla@creators.example").id,
    },
  });
  // A second creator login to demo a low-tier account.
  await prisma.user.create({
    data: {
      email: "noora@creators.example",
      passwordHash,
      role: "CREATOR",
      name: "Noora Al Thani",
      creatorId: byEmail("noora@creators.example").id,
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

  await jr("layla@creators.example", amla.id, "JOIN", "APPROVED");
  await jr("layla@creators.example", herbl.id, "JOIN", "APPROVED");
  await jr("fatima@creators.example", vatika.id, "BARTER", "APPROVED",
    "Deliverables: 2 Reels + 3 Stories over 4 weeks, Arabic voiceover\nRequested product/perk: Vatika full haircare range + 500 SAR voucher");
  await jr("reem@creators.example", amla.id, "JOIN", "APPROVED");
  await jr("dana@creators.example", herbl.id, "JOIN", "APPROVED");

  await jr("noora@creators.example", amla.id, "BARTER", "PENDING",
    "Deliverables: 1 Reel + 2 Stories with before/after hair transformation\nRequested product/perk: Amla oil gift box for giveaway to followers");
  await jr("khalid@creators.example", vatika.id, "JOIN", "PENDING");
  await jr("omar@creators.example", hajmola.id, "JOIN", "PENDING");
  await jr("mariam@creators.example", hajmola.id, "BARTER", "PENDING",
    "Deliverables: 3 TikTok challenge videos with custom sound\nRequested product/perk: Hajmola variety pack + featured repost on brand page");
  await jr("salim@creators.example", amla.id, "BARTER", "PENDING",
    "Deliverables: 1 Reel on desert-proof hair care\nRequested product/perk: Product hamper");
  await jr("ahmed@creators.example", herbl.id, "JOIN", "PENDING");

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

  // ── Rewards catalog ───────────────────────────────────────────────────────
  const createdRewards: Reward[] = [];
  for (const r of rewards) {
    createdRewards.push(await prisma.reward.create({ data: r }));
  }

  // ── Courses ───────────────────────────────────────────────────────────────
  const createdCourses: Course[] = [];
  for (const c of courses) {
    createdCourses.push(
      await prisma.course.create({
        data: { ...c, lessons: JSON.stringify(c.lessons), quiz: JSON.stringify(c.quiz) },
      }),
    );
  }
  const courseBySlug = (slug: string) => {
    const found = createdCourses.find((c) => c.slug === slug);
    if (!found) throw new Error(`Seed course not found: ${slug}`);
    return found;
  };

  // ── Points ledgers (Creator.points = sum of events, enforced below) ──────
  type LedgerEntry = { type: string; points: number; note: string; ago: number };
  const ledgers: Record<string, LedgerEntry[]> = {
    "reem@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 320 },
      { type: "JOIN_APPROVED", points: 40, note: "Accepted into Amla Strong Roots Ramadan", ago: 80 },
      { type: "ASSET_APPROVED", points: 120, note: "Reel approved — Amla Strong Roots Ramadan", ago: 60 },
      { type: "ASSET_LIVE", points: 50, note: "Reel live on Instagram", ago: 55 },
      { type: "COURSE_COMPLETED", points: 100, note: "From Barter to Paid", ago: 200 },
      { type: "BONUS", points: 2500, note: "2025 season carry-over: 11 live assets across Vatika + Amla", ago: 250 },
      { type: "ASSET_APPROVED", points: 120, note: "Eid gifting Reel approved — Amla", ago: 220 },
      { type: "ASSET_LIVE", points: 50, note: "Eid gifting Reel live", ago: 215 },
      { type: "COURSE_COMPLETED", points: 100, note: "The Ramadan Content Calendar", ago: 190 },
      { type: "ASSET_APPROVED", points: 120, note: "Vatika hero Reel approved", ago: 150 },
      { type: "ASSET_LIVE", points: 50, note: "Vatika hero Reel live", ago: 145 },
      { type: "BONUS", points: 1200, note: "Q2 top-performer bonus — highest saves-per-reach in UAE", ago: 100 },
    ],
    "layla@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 210 },
      { type: "COURSE_COMPLETED", points: 60, note: "The DaburStars Playbook", ago: 195 },
      { type: "COURSE_COMPLETED", points: 80, note: "Hooks That Stop the Scroll", ago: 170 },
      { type: "JOIN_APPROVED", points: 40, note: "Accepted into Herb'l Bright Smile Week", ago: 58 },
      { type: "JOIN_APPROVED", points: 40, note: "Accepted into Amla Strong Roots Ramadan", ago: 75 },
      { type: "ASSET_APPROVED", points: 120, note: "Story approved — Amla Strong Roots Ramadan", ago: 40 },
      { type: "BONUS", points: 800, note: "2025 season carry-over: 4 live assets for Vatika", ago: 205 },
      { type: "ASSET_APPROVED", points: 100, note: "Vatika winter Reel approved (2025 season)", ago: 180 },
      { type: "ASSET_LIVE", points: 50, note: "Vatika winter Reel live", ago: 176 },
      { type: "BONUS", points: 300, note: "Ramadan early-bird: first submission of the season", ago: 62 },
      { type: "REDEMPTION", points: -300, note: "Redeemed: Amla Ritual Gift Box", ago: 30 },
    ],
    "omar@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 280 },
      { type: "BONUS", points: 1800, note: "2025 season carry-over: Hajmola launch anchor creator", ago: 240 },
      { type: "COURSE_COMPLETED", points: 80, note: "Hooks That Stop the Scroll", ago: 230 },
      { type: "ASSET_APPROVED", points: 90, note: "Challenge teaser approved — Hajmola (2025)", ago: 140 },
      { type: "ASSET_LIVE", points: 50, note: "Challenge teaser live on TikTok", ago: 136 },
    ],
    "mariam@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 190 },
      { type: "BONUS", points: 900, note: "2025 season carry-over: 5 live skincare assets", ago: 160 },
      { type: "COURSE_COMPLETED", points: 60, note: "The DaburStars Playbook", ago: 150 },
      { type: "COURSE_COMPLETED", points: 80, note: "Shooting Product Like a Pro", ago: 120 },
      { type: "ASSET_APPROVED", points: 100, note: "Herb'l derm-review Reel approved (2025)", ago: 90 },
      { type: "ASSET_LIVE", points: 50, note: "Herb'l derm-review Reel live", ago: 85 },
    ],
    "fatima@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 160 },
      { type: "COURSE_COMPLETED", points: 60, note: "The DaburStars Playbook", ago: 140 },
      { type: "JOIN_APPROVED", points: 40, note: "Barter accepted — Vatika Summer Hydration", ago: 45 },
      { type: "BONUS", points: 500, note: "2025 season carry-over: hijabi-hair series", ago: 130 },
      { type: "ASSET_APPROVED", points: 100, note: "Vatika oils tutorial approved (2025)", ago: 110 },
      { type: "ASSET_LIVE", points: 50, note: "Vatika oils tutorial live", ago: 105 },
      { type: "COURSE_COMPLETED", points: 80, note: "Shooting Product Like a Pro", ago: 70 },
    ],
    "khalid@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 120 },
      { type: "BONUS", points: 400, note: "2025 season carry-over: wellness series", ago: 100 },
      { type: "COURSE_COMPLETED", points: 60, note: "The DaburStars Playbook", ago: 90 },
      { type: "COURSE_COMPLETED", points: 80, note: "Hooks That Stop the Scroll", ago: 60 },
    ],
    "dana@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 130 },
      { type: "JOIN_APPROVED", points: 40, note: "Accepted into Herb'l Bright Smile Week", ago: 50 },
      { type: "ASSET_APPROVED", points: 80, note: "Story approved — Herb'l Bright Smile Week", ago: 20 },
      { type: "ASSET_LIVE", points: 50, note: "Story live on Instagram", ago: 15 },
      { type: "COURSE_COMPLETED", points: 60, note: "The DaburStars Playbook", ago: 110 },
      { type: "BONUS", points: 360, note: "Family-content spotlight bonus", ago: 25 },
    ],
    "noora@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 40 },
      { type: "COURSE_COMPLETED", points: 60, note: "The DaburStars Playbook", ago: 22 },
    ],
    "yousef@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 90 },
      { type: "COURSE_COMPLETED", points: 60, note: "The DaburStars Playbook", ago: 70 },
    ],
    "hassan@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 200 },
    ],
    "salim@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 15 },
    ],
    "ahmed@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 10 },
    ],
  };

  for (const [email, entries] of Object.entries(ledgers)) {
    const creator = byEmail(email);
    let balance = 0;
    let lifetime = 0;
    for (const e of entries) {
      balance += e.points;
      if (e.points > 0) lifetime += e.points;
      await prisma.pointsEvent.create({
        data: {
          creatorId: creator.id,
          type: e.type,
          points: e.points,
          note: e.note,
          createdAt: daysAgo(e.ago),
        },
      });
    }
    await prisma.creator.update({
      where: { id: creator.id },
      data: { points: balance, lifetimePoints: lifetime },
    });
  }

  // ── Course progress ───────────────────────────────────────────────────────
  const progress = async (
    email: string,
    slug: string,
    lessonsDone: number[],
    quizScore: number | null,
    completedAgo: number | null,
  ) =>
    prisma.courseProgress.create({
      data: {
        creatorId: byEmail(email).id,
        courseId: courseBySlug(slug).id,
        completedLessons: JSON.stringify(lessonsDone),
        quizScore,
        completedAt: completedAgo === null ? null : daysAgo(completedAgo),
      },
    });

  await progress("layla@creators.example", "daburstars-playbook", [0, 1, 2], 100, 195);
  await progress("layla@creators.example", "hooks-that-stop-the-scroll", [0, 1, 2], 67, 170);
  await progress("layla@creators.example", "shooting-product-like-a-pro", [0, 1], null, null);
  await progress("noora@creators.example", "daburstars-playbook", [0, 1, 2], 100, 22);
  await progress("fatima@creators.example", "daburstars-playbook", [0, 1, 2], 100, 140);
  await progress("fatima@creators.example", "shooting-product-like-a-pro", [0, 1, 2], 100, 70);
  await progress("mariam@creators.example", "daburstars-playbook", [0, 1, 2], 67, 150);
  await progress("mariam@creators.example", "shooting-product-like-a-pro", [0, 1, 2], 100, 120);
  await progress("reem@creators.example", "from-barter-to-paid", [0, 1, 2], 100, 200);
  await progress("reem@creators.example", "ramadan-content-calendar", [0, 1, 2], 100, 190);
  await progress("omar@creators.example", "hooks-that-stop-the-scroll", [0, 1, 2], 100, 230);
  await progress("khalid@creators.example", "daburstars-playbook", [0, 1, 2], 100, 90);
  await progress("khalid@creators.example", "hooks-that-stop-the-scroll", [0, 1, 2], 67, 60);
  await progress("dana@creators.example", "daburstars-playbook", [0, 1, 2], 100, 110);
  await progress("yousef@creators.example", "daburstars-playbook", [0, 1, 2], 67, 70);

  // ── Redemptions ───────────────────────────────────────────────────────────
  const giftBox = createdRewards.find((r) => r.title === "Amla Ritual Gift Box");
  if (giftBox) {
    await prisma.redemption.create({
      data: {
        creatorId: byEmail("layla@creators.example").id,
        rewardId: giftBox.id,
        status: "FULFILLED",
        createdAt: daysAgo(30),
      },
    });
    await prisma.reward.update({ where: { id: giftBox.id }, data: { stock: giftBox.stock - 1 } });
  }

  // ── Earnings ──────────────────────────────────────────────────────────────
  const earning = (
    email: string,
    campaignId: string | null,
    description: string,
    type: "PAID" | "BARTER",
    amount: number,
    currency: string,
    status: "PENDING" | "APPROVED" | "PAID",
    ago: number,
    paidAgo?: number,
  ) =>
    prisma.earning.create({
      data: {
        creatorId: byEmail(email).id,
        campaignId,
        description,
        type,
        amount,
        currency,
        status,
        createdAt: daysAgo(ago),
        paidAt: paidAgo === undefined ? null : daysAgo(paidAgo),
      },
    });

  await earning("layla@creators.example", amla.id, "Amla Strong Roots — approved Story (1 of 3 deliverables)", "PAID", 1800, "AED", "APPROVED", 38);
  await earning("layla@creators.example", null, "Vatika winter collab — 2025 season final payment", "PAID", 4200, "AED", "PAID", 170, 160);
  await earning("layla@creators.example", herbl.id, "Herb'l Bright Smile Week — barter bundle + voucher", "BARTER", 750, "AED", "APPROVED", 55);
  await earning("layla@creators.example", amla.id, "Amla Strong Roots — Reel deliverable (in review)", "PAID", 2400, "AED", "PENDING", 5);
  await earning("reem@creators.example", amla.id, "Amla Strong Roots — hero Reel", "PAID", 6000, "AED", "PAID", 50, 42);
  await earning("reem@creators.example", amla.id, "Amla Strong Roots — UGC amplification cut", "PAID", 3500, "AED", "PENDING", 8);
  await earning("fatima@creators.example", vatika.id, "Vatika Summer Hydration — barter package", "BARTER", 900, "SAR", "APPROVED", 42);
  await earning("dana@creators.example", herbl.id, "Herb'l Bright Smile Week — family bundle + voucher", "BARTER", 700, "AED", "PAID", 18, 12);
  await earning("omar@creators.example", null, "Hajmola 2025 challenge anchor — final instalment", "PAID", 25000, "EGP", "PAID", 130, 120);

  // ── Notifications ─────────────────────────────────────────────────────────
  const notify = (userId: string, title: string, body: string, href: string | null, ago: number, read = false) =>
    prisma.notification.create({
      data: { userId, title, body, href, createdAt: daysAgo(ago), readAt: read ? daysAgo(Math.max(0, ago - 1)) : null },
    });

  await notify(laylaUser.id, "Story approved 🎉", "Your Amla unboxing Story was approved — 120 points landed in your balance.", "/me", 40, true);
  await notify(laylaUser.id, "Action needed on your Herb'l post", "Rejected with a reason: old packaging in the packshot. Fix and resubmit to keep your streak.", "/me", 12);
  await notify(laylaUser.id, "You're 30 points from keeping pace", "Finish 'Shooting Product Like a Pro' to bank 80 points before the Ramadan window closes.", "/academy", 3);
  await notify(laylaUser.id, "Reward on its way 📦", "Your Amla Ritual Gift Box redemption was fulfilled. Check your delivery address in your profile.", "/rewards", 28, true);
  await notify(marketerUae.id, "6 items waiting in your queue", "Join requests and submitted assets for UAE campaigns are awaiting review.", "/queue", 1);
  await notify(marketerUae.id, "Reem's UGC cut is in", "A 15s amplification cut with 3 hook variants was submitted to Amla Strong Roots.", "/queue", 2);

  const counts = {
    creators: await prisma.creator.count(),
    campaigns: await prisma.campaign.count(),
    joinRequests: await prisma.joinRequest.count(),
    assets: await prisma.asset.count(),
    users: await prisma.user.count(),
    rewards: await prisma.reward.count(),
    courses: await prisma.course.count(),
    pointsEvents: await prisma.pointsEvent.count(),
    earnings: await prisma.earning.count(),
    notifications: await prisma.notification.count(),
  };
  console.log("✅ Seeded:", counts);
  console.log(`
  Demo logins (password for all: ${DEMO_PASSWORD})
  ─ ADMIN       admin@dabur.example
  ─ BRAND_LEAD  brandlead@dabur.example
  ─ MARKETER    marketer.uae@dabur.example  (UAE-scoped)
  ─ CREATOR     layla@creators.example      (Amla tier, rich history)
  ─ CREATOR     noora@creators.example      (Sprout tier, fresh account)
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
