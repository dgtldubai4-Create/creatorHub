import { PrismaClient, type Campaign, type Course, type Creator, type Reward } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "dabur2026";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// Categories: HAIR | ORAL | SKIN | GROOMING | KIDS_FAMILY
const creators = [
  { name: "Layla Al Mansoori", email: "layla@creators.example", handles: { INSTAGRAM: "@layla.beauty", TIKTOK: "@laylabeauty" }, primaryPlatform: "INSTAGRAM", followerTier: "MACRO", region: "UAE", category: "HAIR", collabType: "BOTH", status: "ACTIVE", tags: ["arabic", "english", "haircare", "tutorials"], avgScore: 8.7 },
  { name: "Omar Farouk", email: "omar@creators.example", handles: { TIKTOK: "@omarcooks", YOUTUBE: "@omarfaroukvlogs" }, primaryPlatform: "TIKTOK", followerTier: "MEGA", region: "EGYPT", category: "GROOMING", collabType: "PAID", status: "ACTIVE", tags: ["comedy", "family", "arabic"], avgScore: 9.1 },
  { name: "Noora Al Thani", email: "noora@creators.example", handles: { INSTAGRAM: "@noora.glow" }, primaryPlatform: "INSTAGRAM", followerTier: "MICRO", region: "QATAR", category: "SKIN", collabType: "BARTER", status: "ACTIVE", tags: ["skincare", "clean-beauty"], avgScore: 7.9 },
  { name: "Khalid Al Rashid", email: "khalid@creators.example", handles: { YOUTUBE: "@khalidfit", INSTAGRAM: "@khalid.fit" }, primaryPlatform: "YOUTUBE", followerTier: "MACRO", region: "KSA", category: "GROOMING", collabType: "PAID", status: "ACTIVE", tags: ["fitness", "barber-culture", "arabic"], avgScore: 8.2 },
  { name: "Fatima Zahran", email: "fatima@creators.example", handles: { INSTAGRAM: "@fatima.hair", TIKTOK: "@fatimahair" }, primaryPlatform: "INSTAGRAM", followerTier: "MICRO", region: "KSA", category: "HAIR", collabType: "BOTH", status: "ACTIVE", tags: ["hijabi-hair", "oils", "arabic"], avgScore: 8.9 },
  { name: "Yousef Behbehani", email: "yousef@creators.example", handles: { SNAPCHAT: "@yousefkw", INSTAGRAM: "@yousef.kw" }, primaryPlatform: "SNAPCHAT", followerTier: "MICRO", region: "KUWAIT", category: "ORAL", collabType: "BARTER", status: "ACTIVE", tags: ["daily-vlogs", "family"], avgScore: 7.4 },
  { name: "Mariam El Sayed", email: "mariam@creators.example", handles: { TIKTOK: "@mariamskin", INSTAGRAM: "@mariam.elsayed" }, primaryPlatform: "TIKTOK", followerTier: "MACRO", region: "EGYPT", category: "SKIN", collabType: "BOTH", status: "ACTIVE", tags: ["dermat-approved", "arabic", "budget-beauty"], avgScore: 8.5 },
  { name: "Salim Al Habsi", email: "salim@creators.example", handles: { INSTAGRAM: "@salim.oman" }, primaryPlatform: "INSTAGRAM", followerTier: "NANO", region: "OMAN", category: "GROOMING", collabType: "BARTER", status: "PROSPECT", tags: ["outdoors", "beard-care"], avgScore: null },
  { name: "Dana Haddad", email: "dana@creators.example", handles: { INSTAGRAM: "@dana.smiles", TIKTOK: "@danasmiles" }, primaryPlatform: "INSTAGRAM", followerTier: "MICRO", region: "UAE", category: "KIDS_FAMILY", collabType: "BOTH", status: "ACTIVE", tags: ["mom-life", "kids-routines", "english"], avgScore: 8.0 },
  { name: "Hassan Al Balushi", email: "hassan@creators.example", handles: { TIKTOK: "@hassan.grooms" }, primaryPlatform: "TIKTOK", followerTier: "MICRO", region: "BAHRAIN", category: "GROOMING", collabType: "PAID", status: "PAUSED", tags: ["barbershop", "reviews"], avgScore: 6.8 },
  { name: "Reem Al Suwaidi", email: "reem@creators.example", handles: { INSTAGRAM: "@reem.style", YOUTUBE: "@reemstyle" }, primaryPlatform: "INSTAGRAM", followerTier: "MEGA", region: "UAE", category: "SKIN", collabType: "PAID", status: "ACTIVE", tags: ["luxury", "arabic", "english", "gets-high-reach"], avgScore: 9.3 },
  { name: "Ahmed Mostafa", email: "ahmed@creators.example", handles: { YOUTUBE: "@ahmedreviews", TIKTOK: "@ahmed.reviews" }, primaryPlatform: "YOUTUBE", followerTier: "NANO", region: "EGYPT", category: "ORAL", collabType: "BARTER", status: "PROSPECT", tags: ["honest-reviews", "student"], avgScore: null },
] as const;

// The real Dabur ME portfolio: Vatika Naturals, Dabur Amla, Amla Kids,
// Vatika Menz, Herbolene, Dabur Miswak, Dermoviva.
const campaigns = [
  {
    name: "Amla Strong Roots Ramadan",
    brand: "DABUR_AMLA",
    region: "UAE",
    objective: "Drive trial of Dabur Amla Hair Oil among 18-34 women during Ramadan with authentic nightly-routine content.",
    tagline: "Since 1940. Your turn to tell it.",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-08-15"),
    submissionDeadline: new Date("2026-09-20"),
    status: "LIVE",
    openToCreators: true,
    publicEntry: false,
    kpis: { reach: "2M", engagementRate: "4.5%", ugcPieces: "40" },
    basePoints: 120,
    compensation: "AED 2,500–6,000 per creator (class-based) + full Amla ritual kit",
    deliverables: [
      { type: "REEL", qty: 2, notes: "Night-routine narrative, 30–45s, Arabic or bilingual VO" },
      { type: "STORY", qty: 3, notes: "Unboxing + link sticker to product page" },
      { type: "UGC", qty: 1, notes: "15s cut for paid amplification, 3 hook variants" },
    ],
    dos: [
      "Open with your real hair story — the heritage angle wins",
      "Show the oil texture and massage ritual close-up",
      "Use #DaburAmla #StrongRoots and tag @dabur.arabia",
      "Disclose the partnership with #ad in line one",
    ],
    donts: [
      "No heat-styling in the same frame as the product",
      "No medical promises (regrowth, dandruff cure)",
      "No competitor bottles on the shelf",
    ],
  },
  {
    name: "Vatika Summer Hydration",
    brand: "VATIKA_NATURALS",
    region: "KSA",
    objective: "Position Vatika Naturals shampoo as the summer heat-damage fix; hero content from hijabi hair creators.",
    tagline: "50°C outside. Hydrated all the same.",
    startDate: new Date("2026-06-20"),
    endDate: new Date("2026-09-01"),
    submissionDeadline: new Date("2026-09-25"),
    status: "LIVE",
    openToCreators: true,
    publicEntry: false,
    kpis: { reach: "3.5M", videoViews: "1.2M", storeVisits: "15K" },
    basePoints: 100,
    compensation: "SAR 2,000–5,000 per creator + Vatika Naturals full range",
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
    // ★ Flagship public mega-quest — anyone can enter, entry creates the account.
    name: "The Menz Makeover Challenge",
    brand: "VATIKA_MENZ",
    region: "UAE",
    objective: "A public before/after grooming transformation challenge for Vatika Menz styling — barbers, gym creators and absolute beginners all welcome. Entries are judged weekly; winners are fast-tracked into the program.",
    tagline: "Ya shabab — we didn't forget you.",
    startDate: new Date("2026-08-20"),
    endDate: new Date("2026-10-15"),
    submissionDeadline: new Date("2026-10-10"),
    status: "LIVE",
    openToCreators: true,
    publicEntry: true,
    kpis: { entries: "500", hashtagViews: "8M" },
    basePoints: 150,
    compensation: "Top 10 weekly: Vatika Menz year-supply + AED 1,000. Grand winner: paid ambassador trial.",
    deliverables: [
      { type: "REEL", qty: 1, notes: "Before/after transformation with #MenzMakeover — one cut, no filters on the 'after'" },
    ],
    dos: [
      "Real transformation, real you — beginners beat pros here",
      "Show the product doing the work (paste, cream or gel in hand)",
      "Tag #MenzMakeover and @dabur.arabia",
    ],
    donts: [
      "No filters or AI edits on the after-shot",
      "Keep it PG — this runs across the Gulf",
    ],
  },
  {
    name: "Miswak Smile Week",
    brand: "DABUR_MISWAK",
    region: "UAE",
    objective: "Oral-care awareness week: family creators and dentists demoing Dabur Miswak paste — heritage ingredient, modern routine.",
    tagline: "The original toothbrush, upgraded.",
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-07-31"),
    submissionDeadline: new Date("2026-09-15"),
    status: "LIVE",
    openToCreators: true,
    publicEntry: false,
    kpis: { reach: "800K", linkTaps: "20K" },
    basePoints: 80,
    compensation: "Barter-first: Miswak family bundle + AED 500 voucher; paid slots for dental professionals",
    deliverables: [
      { type: "POST", qty: 1, notes: "Family routine carousel or single-frame" },
      { type: "STORY", qty: 2, notes: "Morning + night routine, link sticker to product page" },
    ],
    dos: [
      "Show the 2026 packaging (in your kit) — old packshots are auto-rejected",
      "Kids in frame need guardian consent noted in your submission",
      "Mention the miswak-extract story — it's the differentiator",
    ],
    donts: [
      "No whitening claims",
      "No comparisons against named competitor pastes",
    ],
  },
  {
    name: "Herbolene Winter Skin",
    brand: "HERBOLENE",
    region: "EGYPT",
    objective: "Herbolene aloe jelly as the winter multi-fix: hands, lips, elbows, kids' cheeks. Budget-beauty angle for Egypt.",
    tagline: "One jar. Every dry thing.",
    startDate: new Date("2026-11-01"),
    endDate: new Date("2026-12-20"),
    submissionDeadline: new Date("2026-12-15"),
    status: "PLANNING",
    openToCreators: true,
    publicEntry: false,
    kpis: { reach: "1.2M", ugcPieces: "30" },
    basePoints: 90,
    compensation: "EGP 8,000–20,000 + Herbolene winter box",
    deliverables: [
      { type: "REEL", qty: 1, notes: "The '5 uses, 1 jar' format" },
      { type: "STORY", qty: 3, notes: "Real morning use, no studio" },
    ],
    dos: ["Show real texture on real skin", "Price-point mention welcome — it's a strength"],
    donts: ["No medical eczema/psoriasis claims"],
  },
  {
    name: "Dermoviva Gentle Start",
    brand: "DERMOVIVA",
    region: "KSA",
    objective: "Mom & baby creators introducing the Dermoviva baby range — trust-first, pediatrician cameos welcome.",
    tagline: "Soft water, softer skin.",
    startDate: new Date("2026-09-10"),
    endDate: new Date("2026-11-01"),
    submissionDeadline: new Date("2026-10-25"),
    status: "PLANNING",
    openToCreators: false,
    publicEntry: false,
    kpis: { reach: "1.5M", saves: "25K" },
    basePoints: 110,
    compensation: "SAR 3,000–7,000 + full Dermoviva baby set",
    deliverables: [
      { type: "REEL", qty: 1, notes: "Bathtime routine, natural light" },
      { type: "STORY", qty: 3, notes: "Q&A sticker: 'ask me about the switch'" },
    ],
    dos: ["Guardian consent for any child in frame", "Patch-test disclaimer in caption"],
    donts: ["No medical claims", "No newborns under 3 months in frame"],
  },
] as const;

// ── Shop catalog (tier keys: SCOUT | VOYAGER | ENVOY | AMBASSADOR) ──────────
const rewards = [
  { title: "Amla Ritual Kit", description: "The full Dabur Amla range in the collector's box — yours, or run it as a giveaway.", category: "PRODUCT", emoji: "🎁", pointsCost: 300, minTier: "SCOUT", stock: 40 },
  { title: "Vatika Season Drop", description: "Every new Vatika Naturals launch shipped to you a month before shelves.", category: "PRODUCT", emoji: "🥥", pointsCost: 450, minTier: "VOYAGER", stock: 25 },
  { title: "Menz Grooming Crate", description: "The complete Vatika Menz styling lineup + a barber-visit voucher.", category: "PRODUCT", emoji: "💈", pointsCost: 500, minTier: "SCOUT", stock: 30 },
  { title: "AED 250 Content Fund", description: "Voucher toward props, studio time or editing for your next deliverable.", category: "VOUCHER", emoji: "💳", pointsCost: 600, minTier: "VOYAGER", stock: 30 },
  { title: "Paid Amplification Boost", description: "We put paid media behind your best approved asset for 2 weeks.", category: "BOOST", emoji: "🚀", pointsCost: 900, minTier: "VOYAGER", stock: 15 },
  { title: "1:1 With the Brand Team", description: "45 minutes with the brand manager of your category — pitch your big idea.", category: "EXPERIENCE", emoji: "🎯", pointsCost: 1200, minTier: "ENVOY", stock: 10 },
  { title: "Studio Day in Dubai", description: "A produced shoot day — studio, lighting, retouching — for your media kit.", category: "EXPERIENCE", emoji: "📸", pointsCost: 2000, minTier: "ENVOY", stock: 6 },
  { title: "Creator Summit Seat", description: "Flights + stay for the annual DaburStars summit in Dubai.", category: "EXPERIENCE", emoji: "✈️", pointsCost: 3500, minTier: "AMBASSADOR", stock: 8 },
  { title: "Ambassador Track Review", description: "Formal review for a 12-month paid ambassador contract with a Dabur brand.", category: "BOOST", emoji: "🏆", pointsCost: 5000, minTier: "AMBASSADOR", stock: 3 },
] as const;

// ── Academy courses ──────────────────────────────────────────────────────────
const courses = [
  {
    slug: "daburstars-playbook",
    title: "The DaburStars Playbook",
    summary: "How the program works: miles, stamps, classes, briefs, approvals — and how creators actually climb.",
    emoji: "🌟",
    level: "FOUNDATION",
    minutes: 12,
    points: 60,
    order: 1,
    lessons: [
      { title: "Miles, stamps and classes", body: "Every approved post earns a stamp and banks miles. Miles never expire; spending in the shop never lowers your class — classes (Scout, Voyager, Envoy, Ambassador) are based on lifetime miles only. Scout starts at 0, Voyager at 500, Envoy at 1,500 and Ambassador at 4,000. Class upgrades apply instantly and unlock faster review, paid-first briefs and eventually the ambassador track." },
      { title: "Reading a brief like a pro", body: "Every campaign brief has four load-bearing sections: deliverables (exactly what to make and how many), the do's (what reviewers check first), the don'ts (instant-rejection territory: claims, competitors, unsafe settings) and compensation. Read the don'ts twice — a skimmed don't is the single biggest cause of returned content." },
      { title: "The approval loop", body: "Submit → review (48h for Voyager and up) → stamped, or returned with a written craft note. A return is not a strike: fix the note and resubmit — the resubmission even carries a turnaround bonus. Approved content earns the campaign's mile value; when it goes live on your channel and we verify it, a live bonus lands on top." },
    ],
    quiz: [
      { question: "Your class is based on…", options: ["Your spendable balance after shop purchases", "Lifetime miles earned", "Follower count", "Number of campaigns joined"], answer: 1 },
      { question: "The fastest way to get content returned is…", options: ["Posting in Arabic", "Skimming a 'don't' in the brief", "Submitting early", "Using your own hooks"], answer: 1 },
      { question: "What happens after a return?", options: ["You lose miles", "You're removed from the campaign", "You fix the craft note and resubmit — with a bonus", "Nothing — returns are final"], answer: 2 },
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
      { title: "The 3 hook families", body: "Curiosity ('the mistake everyone makes with hair oil'), stakes ('I tested this for 30 days in Dubai heat') and pattern-break (an unexpected visual in frame one — a before/after Menz makeover reveal is a pattern-break hook). Your first frame should work with the sound OFF: most Reels views start muted. Put the promise in text on frame one, then deliver it fast." },
      { title: "Localizing hooks for MENA", body: "Heritage angles outperform generic beauty claims across the region — 'my grandmother's ritual' beats 'my haircare routine'. Ramadan and back-to-school are emotional peaks; anchor hooks to the season the brief targets. Arabic-first with English subtitles widens reach in UAE; KSA audiences reward Arabic-only authenticity." },
      { title: "Hooks reviewers love", body: "Reviewers stamp fastest when the brand shows up inside the hook, not after it. 'Why has this oil been sold since 1940?' names the product's story without a hard sell. Avoid bait-and-switch hooks — retention collapses at the reveal and the asset underperforms, which shows in your creator analytics." },
    ],
    quiz: [
      { question: "Most Reels views start…", options: ["With sound on", "Muted", "On desktop", "From hashtags"], answer: 1 },
      { question: "A before/after makeover reveal is which hook family?", options: ["Curiosity", "Stakes", "Pattern-break", "Testimonial"], answer: 2 },
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
      { title: "Light is 80% of the shot", body: "Window light at 45° beats any ringlight for product texture. Shoot oils and liquids backlit so light passes through the bottle — that glow makes Amla oil look like amber instead of brown. Golden hour works for lifestyle frames but never for packshots: label legibility comes first, so packshots want soft, even, front-facing light." },
      { title: "The packshot checklist", body: "Current-year packaging (check your kit — old packaging is auto-return), label facing camera and fully in frame, no competitor products visible, no heat tools next to haircare. Wipe the jar or bottle: fingerprints read as neglect at 1080p. Shoot packshots at the START of your session while the product is pristine." },
      { title: "Texture tells the story", body: "Review teams look for one 'texture proof' moment: oil on palms, jelly on a fingertip, paste on the brush, cream worked through hair. Shoot it macro, slow, in one take. This one shot does more for approval odds than any transition — it proves real use, which is the whole point of creator content." },
    ],
    quiz: [
      { question: "Best light for a packshot?", options: ["Golden hour backlight", "Soft even front light", "Neon accent light", "Direct noon sun"], answer: 1 },
      { question: "An automatic return is…", options: ["Arabic captions", "Old-year packaging", "Macro texture shots", "Window light"], answer: 1 },
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
      { title: "What marketers actually compare", body: "Not followers — saves-per-reach, comment quality, and your approval history in this hub. A 20K micro-creator with 6% saves beats a 300K account with drive-by likes for FMCG trial objectives. Your Creator Card is your live media kit: class, approval rate and live assets are visible to every marketer casting a campaign." },
      { title: "Pricing yourself in MENA", body: "Regional benchmarks per Reel: nano SAR 300–800, micro SAR 800–3,000, macro SAR 3,000–12,000 — but bundles win: a 2-Reel + 3-Story package prices ~30% below the line-item sum and gets you repeat slots. Never price below your barter value; it anchors you as a sampling channel, not a partner." },
      { title: "The upgrade pitch", body: "The move from barter to paid happens in your proposal note: reference your live assets in this hub by result ('my Miswak story drove 1,200 link taps'), state a bundle price, and ask for one paid slot in the next campaign. Marketers approve barter-to-paid upgrades directly in the Control Room — make the decision easy with numbers they can verify here." },
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
      { title: "Timing the day", body: "Engagement clusters after iftar (20:30–23:30 local) and around suhoor (02:00–03:30). Schedule Reels for post-iftar; Stories perform through the late window. Daytime posting during fasting hours sees far lower engagement — never burn a hero asset there. Fridays post-Jumu'ah is the week's strongest slot." },
      { title: "Tone rules", body: "Generosity, family, gratitude — not consumption. Frame products as enablers of ritual ('the oil massage before tarawih') rather than indulgence. Avoid eating/drinking visuals during fasting-hour posts. Modest styling reads as respect, and regional teams review Ramadan content with extra care — expect stricter do's and don'ts in seasonal briefs." },
    ],
    quiz: [
      { question: "Trial-driving content peaks…", options: ["Eid week", "Pre-Ramadan", "Mid-Ramadan", "After Ramadan"], answer: 1 },
      { question: "The strongest daily engagement window is…", options: ["Post-iftar evening", "Noon", "Fasting-hour afternoon", "Sunrise"], answer: 0 },
      { question: "Ramadan product framing should center…", options: ["Indulgence", "Ritual and generosity", "Scarcity discounts", "Competitions"], answer: 1 },
    ],
  },
] as const;

async function main() {
  console.log("🌱 Seeding DaburStars (Miles & Stamps)…");

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

  const createdCreators: Creator[] = [];
  for (const c of creators) {
    createdCreators.push(
      await prisma.creator.create({
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
      }),
    );
  }
  const byEmail = (email: string) => {
    const found = createdCreators.find((c) => c.email === email);
    if (!found) throw new Error(`Seed creator not found: ${email}`);
    return found;
  };

  const createdCampaigns: Campaign[] = [];
  for (const c of campaigns) {
    createdCampaigns.push(
      await prisma.campaign.create({
        data: {
          ...c,
          kpis: JSON.stringify(c.kpis),
          deliverables: JSON.stringify(c.deliverables),
          dos: JSON.stringify(c.dos),
          donts: JSON.stringify(c.donts),
        },
      }),
    );
  }
  const [amla, vatika, menz, miswak] = createdCampaigns;

  // ── Demo users ────────────────────────────────────────────────────────────
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
  await jr("layla@creators.example", miswak.id, "JOIN", "APPROVED");
  await jr("fatima@creators.example", vatika.id, "BARTER", "APPROVED",
    "Deliverables: 2 Reels + 3 Stories over 4 weeks, Arabic voiceover\nRequested product/perk: Vatika Naturals full range + 500 SAR voucher");
  await jr("reem@creators.example", amla.id, "JOIN", "APPROVED");
  await jr("dana@creators.example", miswak.id, "JOIN", "APPROVED");
  await jr("omar@creators.example", menz.id, "JOIN", "APPROVED");
  await jr("khalid@creators.example", menz.id, "JOIN", "APPROVED");

  await jr("noora@creators.example", amla.id, "BARTER", "PENDING",
    "Deliverables: 1 Reel + 2 Stories with before/after hair transformation\nRequested product/perk: Amla gift box for a follower giveaway");
  await jr("mariam@creators.example", vatika.id, "JOIN", "PENDING");
  await jr("salim@creators.example", menz.id, "BARTER", "PENDING",
    "Deliverables: 1 Reel — desert-proof beard care\nRequested product/perk: Menz grooming crate");
  await jr("ahmed@creators.example", miswak.id, "JOIN", "PENDING");

  await jr("hassan@creators.example", menz.id, "JOIN", "REJECTED", undefined,
    "Creator profile is paused pending content-quality review from the last collaboration. Reapply once the review closes.");
  await jr("yousef@creators.example", amla.id, "JOIN", "REJECTED", undefined,
    "Campaign casts hair-category creators; your audience skews oral care. You'd be a great fit for Miswak Smile Week — apply there.");

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
    "My grandmother's secret, bottled 🌙 Night-time amla ritual for stronger roots. #DaburAmla #ad",
    "SUBMITTED");
  await asset("layla@creators.example", amla.id, "STORY",
    "https://instagram.com/stories/layla-amla-unboxing",
    "Unboxing the Amla Strong Roots kit — link sticker for my routine!",
    "APPROVED", "Beautiful lighting and clear product shots. Stamped — post it and the live bonus follows.");
  await asset("layla@creators.example", miswak.id, "POST",
    "https://instagram.com/p/miswak-smile-layla",
    "Switched my whole family to Miswak — the heritage ingredient won us over. #MiswakSmile",
    "REJECTED", "Craft note: the packshot shows the 2025 tube. Reshoot with the 2026 design from your kit and add #ad in line one — +40 bonus miles on the resubmit for the turnaround.");
  await asset("reem@creators.example", amla.id, "REEL",
    "https://instagram.com/reel/reem-amla-glam",
    "Luxury isn't a price tag — it's a ritual ✨ My amla oil wrap before every event.",
    "UNDER_REVIEW");
  await asset("fatima@creators.example", vatika.id, "REEL",
    "https://tiktok.com/@fatimahair/video/vatika-summer",
    "50°C outside and my hair is still hydrated 🥥 Vatika summer survival guide, part 1.",
    "SUBMITTED");
  await asset("dana@creators.example", miswak.id, "STORY",
    "https://instagram.com/stories/dana-miswak-kids",
    "Getting my kids to ACTUALLY brush for 2 minutes — the miswak story hooked them.",
    "LIVE");
  await asset("omar@creators.example", menz.id, "REEL",
    "https://tiktok.com/@omarcooks/video/menz-makeover",
    "From 'who is he' to 'WHO IS HE' 😤 #MenzMakeover no filters, just Vatika Menz.",
    "APPROVED", "This is exactly the format. Stamped — weekly top 10 shortlist.");
  await asset("khalid@creators.example", menz.id, "REEL",
    "https://youtube.com/shorts/khalid-menz-gym",
    "Post-gym hair fix in 90 seconds. The paste holds through a KSA summer. #MenzMakeover",
    "SUBMITTED");

  // ── Shop catalog ──────────────────────────────────────────────────────────
  const createdRewards: Reward[] = [];
  for (const r of rewards) createdRewards.push(await prisma.reward.create({ data: r }));

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

  // ── Miles ledgers (balance = sum of all events; lifetime = positives) ────
  type LedgerEntry = { type: string; points: number; note: string; ago: number };
  const ledgers: Record<string, LedgerEntry[]> = {
    "reem@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 320 },
      { type: "JOIN_APPROVED", points: 40, note: "Cast in Amla Strong Roots Ramadan", ago: 80 },
      { type: "ASSET_APPROVED", points: 120, note: "Reel stamped — Amla Strong Roots", ago: 60 },
      { type: "ASSET_LIVE", points: 50, note: "Reel live on Instagram", ago: 55 },
      { type: "COURSE_COMPLETED", points: 100, note: "From Barter to Paid", ago: 200 },
      { type: "BONUS", points: 2500, note: "2025 season carry-over: 11 live assets across Vatika + Amla", ago: 250 },
      { type: "ASSET_APPROVED", points: 120, note: "Eid gifting Reel stamped — Amla", ago: 220 },
      { type: "ASSET_LIVE", points: 50, note: "Eid gifting Reel live", ago: 215 },
      { type: "COURSE_COMPLETED", points: 100, note: "The Ramadan Content Calendar", ago: 190 },
      { type: "ASSET_APPROVED", points: 120, note: "Vatika hero Reel stamped", ago: 150 },
      { type: "ASSET_LIVE", points: 50, note: "Vatika hero Reel live", ago: 145 },
      { type: "BONUS", points: 1200, note: "Q2 top-performer bonus — highest saves-per-reach in UAE", ago: 100 },
    ],
    "layla@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 210 },
      { type: "SIDE_QUEST", points: 150, note: "Hook or Flop — perfect run", ago: 209 },
      { type: "COURSE_COMPLETED", points: 60, note: "The DaburStars Playbook", ago: 195 },
      { type: "COURSE_COMPLETED", points: 80, note: "Hooks That Stop the Scroll", ago: 170 },
      { type: "JOIN_APPROVED", points: 40, note: "Cast in Miswak Smile Week", ago: 58 },
      { type: "JOIN_APPROVED", points: 40, note: "Cast in Amla Strong Roots Ramadan", ago: 75 },
      { type: "ASSET_APPROVED", points: 120, note: "Story stamped — Amla Strong Roots", ago: 40 },
      { type: "BONUS", points: 800, note: "2025 season carry-over: 4 live assets for Vatika", ago: 205 },
      { type: "ASSET_APPROVED", points: 100, note: "Vatika winter Reel stamped (2025 season)", ago: 180 },
      { type: "ASSET_LIVE", points: 50, note: "Vatika winter Reel live", ago: 176 },
      { type: "BONUS", points: 150, note: "Ramadan early-bird: first submission of the season", ago: 62 },
      { type: "REDEMPTION", points: -300, note: "Shop: Amla Ritual Kit", ago: 30 },
    ],
    "omar@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 280 },
      { type: "BONUS", points: 1800, note: "2025 season carry-over: grooming launch anchor creator", ago: 240 },
      { type: "COURSE_COMPLETED", points: 80, note: "Hooks That Stop the Scroll", ago: 230 },
      { type: "JOIN_APPROVED", points: 40, note: "Cast in The Menz Makeover Challenge", ago: 12 },
      { type: "ASSET_APPROVED", points: 150, note: "Makeover Reel stamped — Menz Challenge", ago: 5 },
    ],
    "mariam@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 190 },
      { type: "BONUS", points: 900, note: "2025 season carry-over: 5 live skincare assets", ago: 160 },
      { type: "COURSE_COMPLETED", points: 60, note: "The DaburStars Playbook", ago: 150 },
      { type: "COURSE_COMPLETED", points: 80, note: "Shooting Product Like a Pro", ago: 120 },
      { type: "ASSET_APPROVED", points: 90, note: "Herbolene teaser stamped (2025)", ago: 90 },
      { type: "ASSET_LIVE", points: 50, note: "Herbolene teaser live", ago: 85 },
    ],
    "fatima@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 160 },
      { type: "SIDE_QUEST", points: 100, note: "Rate the Reel — cleared", ago: 159 },
      { type: "COURSE_COMPLETED", points: 60, note: "The DaburStars Playbook", ago: 140 },
      { type: "JOIN_APPROVED", points: 40, note: "Barter accepted — Vatika Summer Hydration", ago: 45 },
      { type: "BONUS", points: 400, note: "2025 season carry-over: hijabi-hair series", ago: 130 },
      { type: "ASSET_APPROVED", points: 100, note: "Vatika oils tutorial stamped (2025)", ago: 110 },
      { type: "ASSET_LIVE", points: 50, note: "Vatika oils tutorial live", ago: 105 },
      { type: "COURSE_COMPLETED", points: 80, note: "Shooting Product Like a Pro", ago: 70 },
    ],
    "khalid@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 120 },
      { type: "BONUS", points: 400, note: "2025 season carry-over: grooming series", ago: 100 },
      { type: "COURSE_COMPLETED", points: 60, note: "The DaburStars Playbook", ago: 90 },
      { type: "COURSE_COMPLETED", points: 80, note: "Hooks That Stop the Scroll", ago: 60 },
      { type: "JOIN_APPROVED", points: 40, note: "Cast in The Menz Makeover Challenge", ago: 10 },
    ],
    "dana@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 130 },
      { type: "JOIN_APPROVED", points: 40, note: "Cast in Miswak Smile Week", ago: 50 },
      { type: "ASSET_APPROVED", points: 80, note: "Story stamped — Miswak Smile Week", ago: 20 },
      { type: "ASSET_LIVE", points: 50, note: "Story live on Instagram", ago: 15 },
      { type: "COURSE_COMPLETED", points: 60, note: "The DaburStars Playbook", ago: 110 },
      { type: "BONUS", points: 360, note: "Family-content spotlight bonus", ago: 25 },
    ],
    "noora@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 40 },
      { type: "SIDE_QUEST", points: 150, note: "Hook or Flop — perfect run", ago: 40 },
      { type: "COURSE_COMPLETED", points: 60, note: "The DaburStars Playbook", ago: 22 },
    ],
    "yousef@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 90 },
      { type: "COURSE_COMPLETED", points: 60, note: "The DaburStars Playbook", ago: 70 },
    ],
    "hassan@creators.example": [{ type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 200 }],
    "salim@creators.example": [
      { type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 15 },
      { type: "SIDE_QUEST", points: 75, note: "Which Dabur brand are you? — cleared", ago: 15 },
    ],
    "ahmed@creators.example": [{ type: "SIGNUP", points: 50, note: "Welcome to DaburStars", ago: 10 }],
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
  const progress = (
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
  const amlaKit = createdRewards.find((r) => r.title === "Amla Ritual Kit");
  if (amlaKit) {
    await prisma.redemption.create({
      data: {
        creatorId: byEmail("layla@creators.example").id,
        rewardId: amlaKit.id,
        status: "FULFILLED",
        createdAt: daysAgo(30),
      },
    });
    await prisma.reward.update({ where: { id: amlaKit.id }, data: { stock: amlaKit.stock - 1 } });
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

  await earning("layla@creators.example", amla.id, "Amla Strong Roots — stamped Story (1 of 3 deliverables)", "PAID", 1800, "AED", "APPROVED", 38);
  await earning("layla@creators.example", null, "Vatika winter collab — 2025 season final payment", "PAID", 4200, "AED", "PAID", 170, 160);
  await earning("layla@creators.example", miswak.id, "Miswak Smile Week — barter bundle + voucher", "BARTER", 750, "AED", "APPROVED", 55);
  await earning("layla@creators.example", amla.id, "Amla Strong Roots — Reel deliverable (in review)", "PAID", 2400, "AED", "PENDING", 5);
  await earning("reem@creators.example", amla.id, "Amla Strong Roots — hero Reel", "PAID", 6000, "AED", "PAID", 50, 42);
  await earning("reem@creators.example", amla.id, "Amla Strong Roots — UGC amplification cut", "PAID", 3500, "AED", "PENDING", 8);
  await earning("fatima@creators.example", vatika.id, "Vatika Summer Hydration — barter package", "BARTER", 900, "SAR", "APPROVED", 42);
  await earning("dana@creators.example", miswak.id, "Miswak Smile Week — family bundle + voucher", "BARTER", 700, "AED", "PAID", 18, 12);
  await earning("omar@creators.example", menz.id, "Menz Makeover Challenge — weekly top 10", "PAID", 1000, "AED", "APPROVED", 4);

  // ── Notifications ─────────────────────────────────────────────────────────
  const notify = (userId: string, title: string, body: string, href: string | null, ago: number, read = false) =>
    prisma.notification.create({
      data: { userId, title, body, href, createdAt: daysAgo(ago), readAt: read ? daysAgo(Math.max(0, ago - 1)) : null },
    });

  await notify(laylaUser.id, "Stamped! +120 miles 🎉", "Your Amla unboxing Story was approved — post it and the live bonus follows.", "/me", 40, true);
  await notify(laylaUser.id, "Craft note on your Miswak post", "The packshot shows the 2025 tube. Fix it and the resubmit carries +40 bonus miles.", "/me", 12);
  await notify(laylaUser.id, "80 miles sitting in the Academy", "Finish 'Shooting Product Like a Pro' before the Ramadan window closes.", "/academy", 3);
  await notify(laylaUser.id, "Your Amla Ritual Kit is on its way 📦", "Redemption fulfilled — check your delivery details.", "/rewards", 28, true);
  await notify(marketerUae.id, "6 items in your Control Room", "Casting requests and submitted content for UAE campaigns are waiting.", "/queue", 1);
  await notify(marketerUae.id, "Menz Challenge is heating up", "Two new makeover entries this week — one flagged for the weekly top 10.", "/queue", 2);

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
  ─ CREATOR     layla@creators.example      (Envoy, rich history)
  ─ CREATOR     noora@creators.example      (Scout, fresh account)
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
