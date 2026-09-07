import catalogue from "../data/catalogue.json";
import type {
  AcceptanceCriterion, AppState, Badge, Brand, BrandUser, Campaign, Creator, LedgerEntry, Localised, Notification, Participation,
  Product, QuestState, Review, Reward, Shipment, SideQuest, Stage, StageLogEntry, Submission,
} from "./types";
import { STAGES } from "./stages";
import { autoCheck, COURIERS, fnv1a, newId, resetIdCounter, trackingNumber, addDays, addMinutes } from "./simulate";

export const SEED_VERSION = "2026-09-07.3";
export const SEED_NOW = "2026-09-07T09:00:00.000Z";

const L = (en: string, ar: string): Localised => ({ en, ar });

// ---------- creators ----------

type CreatorSeed = [name: string, handle: string, market: "UAE" | "KSA", city: string, niche: Creator["niche"], tier: Creator["tier"], followers: number, bioEn: string, bioAr: string];

const CREATORS: CreatorSeed[] = [
  ["Layla Al Mansoori", "laylaoils", "UAE", "Dubai", "haircare", "macro", 412_000, "Oiling rituals, curl routines and the occasional hair disaster.", "طقوس الزيوت وروتين الكيرلي وبعض كوارث الشعر أحياناً."],
  ["Noor Haddad", "noorhaddad", "UAE", "Dubai", "beauty", "micro", 58_300, "Get-ready-with-me videos that start at 6am and end with coffee.", "فيديوهات جهزي معي تبدأ الساعة 6 صباحاً وتنتهي بالقهوة."],
  ["Reem Al Qasimi", "reemq", "UAE", "Sharjah", "family", "micro", 33_900, "Mum of three, chief negotiator at bath time.", "أم لثلاثة، وكبيرة المفاوضين وقت الاستحمام."],
  ["Hessa Al Nuaimi", "hessa.moves", "UAE", "Abu Dhabi", "fitness", "nano", 8_700, "Sunrise runs on the Corniche and post-run recovery tips.", "جري عند شروق الشمس على الكورنيش ونصائح للتعافي بعده."],
  ["Dana Khalil", "danakcooks", "UAE", "Dubai", "food", "micro", 71_200, "Fifteen-minute dinners for people who are always late.", "عشاء في 15 دقيقة لمن يتأخرون دائماً."],
  ["Yara Nassar", "yaranassar", "UAE", "Dubai", "lifestyle", "mega", 1_240_000, "Slow mornings, fast edits.", "صباحات هادئة ومونتاج سريع."],
  ["Omar Al Rashid", "omarlaughs", "UAE", "Dubai", "comedy", "macro", 356_000, "Sketches about Arab households, mostly accurate.", "سكتشات عن البيوت العربية، دقيقة في معظمها."],
  ["Tariq Hamdan", "tariqbrushes", "UAE", "Abu Dhabi", "oralcare", "nano", 6_100, "Dental student explaining what your dentist wishes you knew.", "طالب طب أسنان يشرح ما يتمنى طبيبك أن تعرفه."],
  ["Nadine Farah", "nadinefarah", "UAE", "Dubai", "wellness", "micro", 44_800, "Breathwork, sleep and the honest version of self-care.", "تمارين تنفس ونوم والنسخة الصادقة من العناية بالذات."],
  ["Aisha Rahman", "aisha.curls", "UAE", "Ajman", "haircare", "micro", 27_500, "Type 3C curls and every product that has ever touched them.", "شعر كيرلي 3C وكل منتج لمسه يوماً."],
  ["Sara Alsheikh", "saraalsheikh", "KSA", "Riyadh", "beauty", "macro", 289_000, "Makeup for the Riyadh heat. Long-wear only.", "مكياج يتحمّل حر الرياض. ثبات طويل فقط."],
  ["Mariam Bukhari", "mariam.b", "KSA", "Jeddah", "family", "micro", 52_400, "Twins, tantrums and tidy hair by 7:30.", "توأم ونوبات غضب وشعر مرتب بحلول 7:30."],
  ["Fatima Zayed", "fatimazayed", "KSA", "Riyadh", "wellness", "nano", 9_800, "Herbal teas, evening walks and honest reviews.", "شاي أعشاب ومشي مسائي ومراجعات صادقة."],
  ["Lina Barakat", "linabarakat", "KSA", "Jeddah", "lifestyle", "micro", 63_100, "Jeddah by the sea, one vlog at a time.", "جدة على البحر، فلوغ واحد في كل مرة."],
  ["Salma Fahad", "salmafahad", "KSA", "Dammam", "haircare", "macro", 198_000, "Long hair, longer routines.", "شعر طويل وروتين أطول."],
  ["Khalid Bin Saeed", "khalidfit", "KSA", "Riyadh", "fitness", "micro", 88_900, "Strength coach. Protein, patience, and honey in my tea.", "مدرب قوة. بروتين وصبر وعسل في الشاي."],
  ["Youssef Karam", "yousefeats", "KSA", "Jeddah", "food", "macro", 402_000, "Street food tours and the digestion advice nobody asked for.", "جولات أكل شعبي ونصائح هضم لم يطلبها أحد."],
  ["Maha Sultan", "mahasultan", "KSA", "Riyadh", "beauty", "nano", 7_400, "Skincare on a student budget.", "عناية بالبشرة بميزانية طالبة."],
  ["Ghada Aziz", "ghadaaziz", "KSA", "Dammam", "family", "micro", 39_600, "Four kids, one bathroom, zero patience for tangles.", "أربعة أطفال وحمام واحد وصبر صفر على التشابك."],
  ["Amal Darwish", "amaldarwish", "KSA", "Jeddah", "comedy", "micro", 76_300, "Voiceovers for the drama in my kitchen.", "تعليق صوتي على دراما مطبخي."],
];

function makeCreators(): Creator[] {
  return CREATORS.map(([name, handle, market, city, niche, tier, followers, bioEn, bioAr], i) => {
    const verified = i % 4 !== 3;
    return {
      id: `cr_${handle.replace(/\W/g, "")}`,
      name,
      handle,
      market,
      city,
      niche,
      tier,
      followers,
      photo: null,
      hue: fnv1a(handle) % 360,
      bio: L(bioEn, bioAr),
      verification: {
        identity: verified ? "verified" : i % 8 === 3 ? "pending" : "action",
        instagram: i % 5 === 4 ? "pending" : "verified",
        tiktok: i % 6 === 5 ? "action" : i % 3 === 0 ? "verified" : "pending",
      },
      socials: { instagram: handle, tiktok: i % 6 === 5 ? undefined : handle },
      address: { line1: i % 2 === 0 ? `Villa ${12 + i}, Al Wasl Road` : `Apt ${300 + i}, Tower ${(i % 4) + 1}`, city, market, phone: market === "UAE" ? `+971 5${(i % 5) + 2} ${(100 + i * 7) % 900} ${(1000 + i * 131) % 9000}` : `+966 5${(i % 5) + 3} ${(100 + i * 9) % 900} ${(1000 + i * 173) % 9000}`, confirmed: i < 14 },
      joinedAt: addDays(SEED_NOW, -(30 + i * 11)),
      streakWeeks: [6, 2, 4, 0, 3, 9, 5, 1, 2, 7, 4, 3, 0, 2, 8, 1, 5, 0, 3, 2][i],
    };
  });
}

// ---------- campaigns ----------

const CRITERIA = (weights: Partial<Record<AcceptanceCriterion["key"], number>> = {}): AcceptanceCriterion[] => [
  { key: "hook", weight: weights.hook ?? 30, label: L("Product in frame within the first 3 seconds", "المنتج يظهر في الإطار خلال أول 3 ثوانٍ") },
  { key: "productVisibility", weight: weights.productVisibility ?? 25, label: L("Pack readable for at least 4 seconds", "العبوة مقروءة لمدة 4 ثوانٍ على الأقل") },
  { key: "captions", weight: weights.captions ?? 20, label: L("Burned-in captions on every spoken line", "ترجمات مدمجة على كل جملة منطوقة") },
  { key: "loudness", weight: weights.loudness ?? 15, label: L("Dialogue between -16 and -12 LUFS", "الحوار بين -16 و-12 LUFS") },
  { key: "duration", weight: weights.duration ?? 10, label: L("Runtime inside the brief window", "المدة ضمن النطاق المحدد") },
];

type CampaignSeed = Omit<Campaign, "brief" | "createdAt"> & { brief: Omit<Campaign["brief"], "acceptance"> & { acceptance?: AcceptanceCriterion[] } };

const CAMPAIGNS: CampaignSeed[] = [
  {
    id: "cp_blackseed30", brandId: "vatika", status: "active", points: 900,
    title: L("30 Days Stronger", "30 يوماً أقوى"),
    hook: L("Three weeks with Vatika Black Seed oil. Show the routine, not the ad.", "ثلاثة أسابيع مع زيت فاتيكا بالحبة السوداء. أظهر الروتين لا الإعلان."),
    brief: {
      deliverable: L("One vertical video, 25 to 45 seconds, for Instagram Reels or TikTok.", "فيديو عمودي واحد من 25 إلى 45 ثانية لريلز إنستغرام أو تيك توك."),
      shotList: [L("Day 1: unbox and first oiling", "اليوم 1: فتح الصندوق وأول تزييت"), L("Day 14: your usual hair-wash day", "اليوم 14: يوم غسل الشعر المعتاد"), L("Day 21: before-and-after hair fall on the brush", "اليوم 21: قبل وبعد التساقط على الفرشاة")],
      dos: [L("Warm the oil between your palms on camera", "دفّئ الزيت بين راحتيك أمام الكاميرا"), L("Say the product name once, naturally", "اذكر اسم المنتج مرة واحدة بشكل طبيعي")],
      donts: [L("No medical claims about hair growth", "لا ادعاءات طبية عن نمو الشعر"), L("No competitor products in frame", "لا منتجات منافسة في الإطار")],
      durationSec: { min: 25, max: 45 },
    },
    kit: [{ productId: "vatika-black-seed-hair-oil", qty: 2 }, { productId: "vatika-black-seed-shampoo", qty: 1 }, { productId: "vatika-black-seed-conditioner", qty: 1 }],
    window: { start: "2026-08-20", end: "2026-10-05" }, targetNiches: ["haircare", "beauty", "lifestyle"], targetMarkets: ["UAE", "KSA"], targetTiers: ["micro", "macro", "mega"],
  },
  {
    id: "cp_oilsunday", brandId: "dabur-amla", status: "active", points: 600,
    title: L("Oil Sunday", "أحد الزيت"),
    hook: L("The weekly amla ritual your mother taught you. Make it yours.", "طقس الأملا الأسبوعي الذي علمتك إياه أمك. اجعله طقسك."),
    brief: {
      deliverable: L("One Reel, 20 to 40 seconds, warm home setting.", "ريل واحد من 20 إلى 40 ثانية في أجواء منزلية دافئة."),
      shotList: [L("Bottle on the dresser, morning light", "الزجاجة على التسريحة مع ضوء الصباح"), L("Scalp massage close-up", "لقطة قريبة لتدليك فروة الرأس"), L("A family member in frame, optional", "أحد أفراد العائلة في الإطار، اختياري")],
      dos: [L("Tell a real memory", "احكِ ذكرى حقيقية"), L("Keep the bottle label readable", "أبقِ ملصق الزجاجة مقروءاً")],
      donts: [L("No fast-cut montage edits", "لا مونتاج سريع القطع"), L("No filters that change hair colour", "لا فلاتر تغيّر لون الشعر")],
      durationSec: { min: 20, max: 40 },
    },
    kit: [{ productId: "dabur-amla-hair-oil", qty: 1 }, { productId: "dabur-amla-jasmine-hair-oil", qty: 1 }],
    window: { start: "2026-08-25", end: "2026-09-30" }, targetNiches: ["haircare", "family", "lifestyle"], targetMarkets: ["UAE", "KSA"], targetTiers: ["nano", "micro", "macro"],
  },
  {
    id: "cp_smiletest", brandId: "dabur-herbl", status: "review", points: 500,
    title: L("The Smile Test", "اختبار الابتسامة"),
    hook: L("Seven days on charcoal toothpaste. Show us the morning after.", "سبعة أيام مع معجون الفحم. أرِنا صباح اليوم التالي."),
    brief: {
      deliverable: L("One TikTok, 15 to 30 seconds, mirror shot.", "تيك توك واحد من 15 إلى 30 ثانية أمام المرآة."),
      shotList: [L("Tube squeeze onto brush", "عصر الأنبوب على الفرشاة"), L("Day 7 smile close-up", "لقطة قريبة للابتسامة في اليوم 7")],
      dos: [L("Natural light only", "ضوء طبيعي فقط"), L("Mention it is fluoride-free if you want", "اذكر أنه خالٍ من الفلورايد إن أردت")],
      donts: [L("No whitening comparisons with other brands", "لا مقارنات تبييض مع علامات أخرى")],
      durationSec: { min: 15, max: 30 },
    },
    kit: [{ productId: "dabur-herbl-charcoal-toothpaste", qty: 2 }],
    window: { start: "2026-08-10", end: "2026-09-20" }, targetNiches: ["oralcare", "beauty", "lifestyle"], targetMarkets: ["UAE"], targetTiers: ["nano", "micro"],
  },
  {
    id: "cp_schoolmornings", brandId: "real", status: "publishing", points: 450,
    title: L("Back-to-School Mornings", "صباحات العودة إلى المدرسة"),
    hook: L("The lunchbox, the rush, the juice. Keep it chaotic and real.", "علبة الغداء والعجلة والعصير. أبقِه فوضوياً وحقيقياً."),
    brief: {
      deliverable: L("One Reel, 20 to 35 seconds, kitchen setting.", "ريل واحد من 20 إلى 35 ثانية في المطبخ."),
      shotList: [L("Carton pour", "صب العصير من العلبة"), L("Kids at the door", "الأطفال عند الباب")],
      dos: [L("Show the carton in the fridge door", "أظهر العلبة في باب الثلاجة")],
      donts: [L("No health claims beyond the pack", "لا ادعاءات صحية تتجاوز ما هو على العبوة")],
      durationSec: { min: 20, max: 35 },
    },
    kit: [{ productId: "real-mango-juice", qty: 3 }, { productId: "real-orange-juice", qty: 3 }],
    window: { start: "2026-08-15", end: "2026-09-15" }, targetNiches: ["family", "food"], targetMarkets: ["UAE", "KSA"], targetTiers: ["micro", "macro"],
  },
  {
    id: "cp_postlunch", brandId: "hajmola", status: "completed", points: 350,
    title: L("The Post-Lunch Snap", "لقطة ما بعد الغداء"),
    hook: L("That tangy face when Hajmola hits. One take, no script.", "تلك التعبيرة الحامضة لحظة تناول هاجمولا. لقطة واحدة بلا نص."),
    brief: {
      deliverable: L("One TikTok, 10 to 20 seconds.", "تيك توك واحد من 10 إلى 20 ثانية."),
      shotList: [L("Jar open, tablet out", "فتح العلبة وإخراج القرص"), L("The reaction", "ردة الفعل")],
      dos: [L("Sound on, keep the crunch", "الصوت مفتوح مع صوت القرمشة")],
      donts: [L("No editing the reaction", "لا تعديل على ردة الفعل")],
      durationSec: { min: 10, max: 20 },
    },
    kit: [{ productId: "hajmola-regular", qty: 2 }, { productId: "hajmola-imli", qty: 2 }],
    window: { start: "2026-07-01", end: "2026-08-10" }, targetNiches: ["comedy", "food"], targetMarkets: ["UAE", "KSA"], targetTiers: ["micro", "macro", "mega"],
  },
  {
    id: "cp_hotoil", brandId: "vatika", status: "inviting", points: 750,
    title: L("The Hot Oil Ritual", "طقس حمام الزيت"),
    hook: L("Hammam Zaith, a warm towel, and twenty quiet minutes.", "حمام زيت ومنشفة دافئة وعشرون دقيقة من الهدوء."),
    brief: {
      deliverable: L("One Reel, 30 to 45 seconds, slow and calm.", "ريل واحد من 30 إلى 45 ثانية، هادئ وبطيء."),
      shotList: [L("Jar scoop", "غرف الكريم من العلبة"), L("Towel wrap", "لف المنشفة"), L("Rinse and reveal", "الشطف والنتيجة")],
      dos: [L("Soft voiceover", "تعليق صوتي هادئ")],
      donts: [L("No trending audio over the voiceover", "لا صوت رائج فوق التعليق")],
      durationSec: { min: 30, max: 45 },
    },
    kit: [{ productId: "vatika-hammam-zaith", qty: 1 }, { productId: "vatika-argan-shampoo", qty: 1 }],
    window: { start: "2026-09-10", end: "2026-10-20" }, targetNiches: ["haircare", "wellness", "beauty"], targetMarkets: ["UAE", "KSA"], targetTiers: ["micro", "macro"],
  },
  {
    id: "cp_grwm", brandId: "fem", status: "draft", points: 550,
    title: L("Get Ready With Fem", "جهّزي نفسك مع فيم"),
    hook: L("Your Thursday-night routine, start to finish.", "روتين ليلة الخميس من البداية إلى النهاية."),
    brief: {
      deliverable: L("One Reel, 30 to 45 seconds.", "ريل واحد من 30 إلى 45 ثانية."),
      shotList: [L("Product on the counter", "المنتج على الطاولة"), L("Application, hands only", "التطبيق، اليدان فقط")],
      dos: [L("Follow pack timing on camera", "اتبع توقيت العبوة أمام الكاميرا")],
      donts: [L("No skin-tone language", "لا حديث عن لون البشرة")],
      durationSec: { min: 30, max: 45 },
    },
    kit: [{ productId: "fem-hair-removal-cream-rose", qty: 1 }],
    window: { start: "2026-09-25", end: "2026-10-30" }, targetNiches: ["beauty", "lifestyle"], targetMarkets: ["KSA"], targetTiers: ["micro", "macro"],
  },
  {
    id: "cp_goldenmornings", brandId: "dabur-honey", status: "active", points: 400,
    title: L("Golden Mornings", "صباحات ذهبية"),
    hook: L("Honey in the tea, honey on the toast. Show your morning.", "عسل في الشاي وعسل على الخبز. أرِنا صباحك."),
    brief: {
      deliverable: L("One Reel or TikTok, 15 to 30 seconds.", "ريل أو تيك توك من 15 إلى 30 ثانية."),
      shotList: [L("The squeeze", "لحظة العصر"), L("First sip or bite", "أول رشفة أو قضمة")],
      dos: [L("Morning light", "ضوء الصباح")],
      donts: [L("No medicinal claims", "لا ادعاءات طبية")],
      durationSec: { min: 15, max: 30 },
    },
    kit: [{ productId: "dabur-honey", qty: 2 }],
    window: { start: "2026-08-28", end: "2026-10-01" }, targetNiches: ["food", "fitness", "wellness"], targetMarkets: ["UAE", "KSA"], targetTiers: ["nano", "micro", "macro"],
  },
  {
    id: "cp_meswak", brandId: "meswak", status: "review", points: 500,
    title: L("Tradition, Brushed", "تقليد على الفرشاة"),
    hook: L("Miswak the way your grandfather used it, and the tube on your sink today.", "المسواك كما استخدمه جدك، والأنبوب على مغسلتك اليوم."),
    brief: {
      deliverable: L("One TikTok, 20 to 35 seconds.", "تيك توك واحد من 20 إلى 35 ثانية."),
      shotList: [L("Miswak twig and tube side by side", "عود المسواك والأنبوب جنباً إلى جنب"), L("Brushing", "التنظيف")],
      dos: [L("Tell a family story", "احكِ قصة عائلية")],
      donts: [L("No religious framing", "لا إطار ديني")],
      durationSec: { min: 20, max: 35 },
    },
    kit: [{ productId: "meswak-toothpaste", qty: 2 }],
    window: { start: "2026-08-18", end: "2026-09-25" }, targetNiches: ["oralcare", "family", "comedy"], targetMarkets: ["KSA", "UAE"], targetTiers: ["nano", "micro"],
  },
  {
    id: "cp_winterready", brandId: "chyawanprash", status: "draft", points: 650,
    title: L("Winter Ready", "جاهز للشتاء"),
    hook: L("One spoon every morning from October. Document the habit.", "ملعقة كل صباح من أكتوبر. وثّق العادة."),
    brief: {
      deliverable: L("Two Reels across four weeks, 20 to 40 seconds each.", "ريلان خلال أربعة أسابيع، من 20 إلى 40 ثانية لكل منهما."),
      shotList: [L("Jar open", "فتح العلبة"), L("Spoon and warm milk", "الملعقة والحليب الدافئ")],
      dos: [L("Keep it daily and unglamorous", "أبقِه يومياً وبسيطاً")],
      donts: [L("No immunity claims beyond the pack", "لا ادعاءات مناعة تتجاوز العبوة")],
      durationSec: { min: 20, max: 40 },
    },
    kit: [{ productId: "dabur-chyawanprash", qty: 2 }],
    window: { start: "2026-10-05", end: "2026-11-15" }, targetNiches: ["wellness", "fitness", "family"], targetMarkets: ["UAE", "KSA"], targetTiers: ["micro", "macro"],
  },
  {
    id: "cp_softskin", brandId: "dermoviva", status: "inviting", points: 400,
    title: L("Soft Skin, No Fuss", "بشرة ناعمة بلا تعقيد"),
    hook: L("Post-shower, two minutes, done. Show the routine at speed.", "بعد الاستحمام، دقيقتان، وانتهى. أظهر الروتين بسرعة."),
    brief: {
      deliverable: L("One Reel, 15 to 25 seconds.", "ريل واحد من 15 إلى 25 ثانية."),
      shotList: [L("Pump and apply", "الضغط والتطبيق"), L("The bottle on the shelf", "الزجاجة على الرف")],
      dos: [L("Upbeat pace", "إيقاع سريع")],
      donts: [L("No skin-tone language", "لا حديث عن لون البشرة")],
      durationSec: { min: 15, max: 25 },
    },
    kit: [{ productId: "dermoviva-skin-naturals-lotion", qty: 2 }],
    window: { start: "2026-09-08", end: "2026-10-10" }, targetNiches: ["beauty", "wellness", "lifestyle"], targetMarkets: ["UAE"], targetTiers: ["nano", "micro"],
  },
];

function makeCampaigns(): Campaign[] {
  return CAMPAIGNS.map((c, i) => ({ ...c, brief: { ...c.brief, acceptance: c.brief.acceptance ?? CRITERIA() }, createdAt: addDays(SEED_NOW, -(40 - i * 3)) }));
}

// ---------- participations ----------

interface PSeed { campaign: string; creator: string; stage: Stage; loops?: number; daysAgo: number }

const PARTICIPATIONS: PSeed[] = [
  // Every stage represented at least once.
  { campaign: "cp_blackseed30", creator: "cr_laylaoils", stage: "manual_review", loops: 1, daysAgo: 16 },
  { campaign: "cp_blackseed30", creator: "cr_aishacurls", stage: "shoot", daysAgo: 14 },
  { campaign: "cp_blackseed30", creator: "cr_salmafahad", stage: "changes_requested", daysAgo: 15 },
  { campaign: "cp_blackseed30", creator: "cr_yaranassar", stage: "delivered", daysAgo: 12 },
  { campaign: "cp_blackseed30", creator: "cr_saraalsheikh", stage: "out_for_delivery", daysAgo: 9 },
  { campaign: "cp_oilsunday", creator: "cr_reemq", stage: "dispatched", daysAgo: 8 },
  { campaign: "cp_oilsunday", creator: "cr_mariamb", stage: "preparing", daysAgo: 6 },
  { campaign: "cp_oilsunday", creator: "cr_ghadaaziz", stage: "profile_confirmed", daysAgo: 5 },
  { campaign: "cp_oilsunday", creator: "cr_laylaoils", stage: "accepted", daysAgo: 3 },
  { campaign: "cp_oilsunday", creator: "cr_linabarakat", stage: "first_cut", daysAgo: 10 },
  { campaign: "cp_smiletest", creator: "cr_tariqbrushes", stage: "manual_review", daysAgo: 20 },
  { campaign: "cp_smiletest", creator: "cr_noorhaddad", stage: "revised_cut", loops: 1, daysAgo: 22 },
  { campaign: "cp_smiletest", creator: "cr_mahasultan", stage: "auto_check", daysAgo: 18 },
  { campaign: "cp_schoolmornings", creator: "cr_danakcooks", stage: "link_submitted", daysAgo: 21 },
  { campaign: "cp_schoolmornings", creator: "cr_mariamb", stage: "approved_to_publish", daysAgo: 20 },
  { campaign: "cp_schoolmornings", creator: "cr_ghadaaziz", stage: "post_verified", daysAgo: 22 },
  { campaign: "cp_schoolmornings", creator: "cr_yousefeats", stage: "points_released", daysAgo: 23 },
  { campaign: "cp_postlunch", creator: "cr_omarlaughs", stage: "completed", daysAgo: 60 },
  { campaign: "cp_postlunch", creator: "cr_amaldarwish", stage: "completed", loops: 1, daysAgo: 58 },
  { campaign: "cp_postlunch", creator: "cr_yousefeats", stage: "completed", daysAgo: 55 },
  { campaign: "cp_postlunch", creator: "cr_yaranassar", stage: "declined", daysAgo: 62 },
  { campaign: "cp_hotoil", creator: "cr_laylaoils", stage: "invited", daysAgo: 1 },
  { campaign: "cp_hotoil", creator: "cr_nadinefarah", stage: "invited", daysAgo: 1 },
  { campaign: "cp_hotoil", creator: "cr_salmafahad", stage: "invited", daysAgo: 1 },
  { campaign: "cp_goldenmornings", creator: "cr_khalidfit", stage: "shoot", daysAgo: 7 },
  { campaign: "cp_goldenmornings", creator: "cr_fatimazayed", stage: "delivered", daysAgo: 6 },
  { campaign: "cp_goldenmornings", creator: "cr_hessamoves", stage: "accepted", daysAgo: 2 },
  { campaign: "cp_meswak", creator: "cr_amaldarwish", stage: "manual_review", daysAgo: 12 },
  { campaign: "cp_meswak", creator: "cr_tariqbrushes", stage: "approved_to_publish", daysAgo: 13 },
  { campaign: "cp_softskin", creator: "cr_noorhaddad", stage: "invited", daysAgo: 0 },
  { campaign: "cp_softskin", creator: "cr_mahasultan", stage: "invited", daysAgo: 0 },
  { campaign: "cp_softskin", creator: "cr_nadinefarah", stage: "accepted", daysAgo: 1 },
];

/** Canonical path from `invited` to the target stage, with optional review loops. */
function pathTo(stage: Stage, loops: number): Stage[] {
  if (stage === "declined") return ["invited", "declined"];
  const idxReview = STAGES.indexOf("manual_review");
  const target = STAGES.indexOf(stage);
  const base = STAGES.slice(0, Math.min(target, idxReview) + 1) as Stage[];
  if (target <= idxReview) {
    // Optional loop that ends back at the target stage
    if (loops > 0 && stage === "manual_review") {
      for (let i = 0; i < loops; i++) base.push("changes_requested", "revised_cut", "manual_review");
    }
    return base;
  }
  if (stage === "changes_requested") return [...base, "changes_requested"];
  if (stage === "revised_cut") return [...base, "changes_requested", "revised_cut"];
  const out = [...base];
  for (let i = 0; i < loops; i++) out.push("changes_requested", "revised_cut", "manual_review");
  const tail = STAGES.slice(STAGES.indexOf("approved_to_publish"), target + 1) as Stage[];
  return [...out, ...tail];
}

const FILES = ["oil_ritual_v", "final_cut_v", "reel_draft_v", "tiktok_export_v", "morning_light_v"];
const NOTE_POOL: { t: number; text: string }[][] = [
  [{ t: 2, text: "Love the open. Keep this." }, { t: 9, text: "Label is out of focus here, hold the bottle still." }, { t: 21, text: "Captions overlap the pack in the bottom third." }],
  [{ t: 4, text: "Hook lands late, cut the first 2 seconds." }, { t: 15, text: "Great massage shot." }],
  [{ t: 1, text: "Perfect. Ship it." }],
];

function buildParticipation(seed: PSeed, campaigns: Campaign[], creators: Creator[], reviewerName: string, ledger: LedgerEntry[]): Participation {
  const campaign = campaigns.find((c) => c.id === seed.campaign)!;
  const creator = creators.find((c) => c.id === seed.creator)!;
  const id = `pt_${seed.campaign.slice(3)}_${seed.creator.slice(3)}`;
  const path = pathTo(seed.stage, seed.loops ?? 0);
  const start = addDays(SEED_NOW, -seed.daysAgo);
  const stepMinutes = Math.max(90, Math.floor((seed.daysAgo * 24 * 60) / Math.max(path.length, 1)));
  const stageLog: StageLogEntry[] = [];
  const submissions: Submission[] = [];
  const reviews: Review[] = [];
  let shipment: Shipment | null = null;
  let publish: Participation["publish"] = null;
  let version = 0;

  path.forEach((stage, i) => {
    const at = addMinutes(start, i * stepMinutes);
    const entry: StageLogEntry = { stage, at };
    switch (stage) {
      case "invited":
        entry.by = reviewerName;
        break;
      case "declined":
        entry.note = "Travelling during the shoot window.";
        break;
      case "profile_confirmed": {
        const courier = COURIERS[fnv1a(id) % COURIERS.length];
        shipment = { courier, trackingNumber: trackingNumber(courier, id), status: "address_confirmed", updatedAt: at, simulated: true };
        break;
      }
      case "preparing":
      case "dispatched":
      case "out_for_delivery":
      case "delivered":
        shipment = shipment ? { ...shipment, status: stage, updatedAt: at } : shipment;
        entry.by = "Logistics";
        break;
      case "first_cut":
      case "revised_cut": {
        version += 1;
        const filename = `${FILES[fnv1a(id + version) % FILES.length]}${version}.mp4`;
        const sizeBytes = 18_000_000 + (fnv1a(filename) % 60_000_000);
        const durationSec = campaign.brief.durationSec.min + (fnv1a(id) % Math.max(1, campaign.brief.durationSec.max - campaign.brief.durationSec.min));
        const check = autoCheck(filename, sizeBytes, version, campaign.brief.acceptance, durationSec, campaign.brief.durationSec);
        submissions.push({ id: `sub_${id.slice(3)}_v${version}`, participationId: id, filename, sizeBytes, durationSec, version, uploadedAt: at, check });
        break;
      }
      case "auto_check":
        entry.note = `v${version} scored ${submissions[submissions.length - 1]?.check.score ?? 0}`;
        break;
      case "changes_requested":
      case "approved_to_publish": {
        const sub = submissions[submissions.length - 1];
        const decision = stage === "approved_to_publish" ? "approved" : "changes";
        const notes = decision === "approved" ? NOTE_POOL[2] : NOTE_POOL[fnv1a(id + version) % 2];
        const note = decision === "approved" ? "Approved. Post within the window and paste the link back here." : "Close. Two fixes and it is there.";
        reviews.push({ id: `rev_${id.slice(3)}_v${version}`, participationId: id, submissionId: sub.id, decision, note, notes, reviewerId: "bu_reviewer", reviewerName, at });
        entry.by = reviewerName;
        entry.note = note;
        break;
      }
      case "link_submitted": {
        const platform = creator.socials.tiktok && fnv1a(id) % 2 === 0 ? "tiktok" : "instagram";
        publish = { platform, url: platform === "tiktok" ? `https://www.tiktok.com/@${creator.handle}/video/7${(fnv1a(id) % 1e9).toString().padStart(9, "0")}` : `https://www.instagram.com/reel/${id.slice(3, 14).replace(/_/g, "")}/`, postedAt: at, verified: false };
        break;
      }
      case "post_verified":
        publish = publish ? { ...publish, verified: true, verifiedAt: at } : publish;
        entry.by = reviewerName;
        break;
      case "points_released":
        ledger.push({ id: `led_${id.slice(3)}`, creatorId: creator.id, delta: campaign.points, reason: L(`${campaign.title.en} completed`, `اكتمال ${campaign.title.ar}`), ref: { kind: "participation", id }, at });
        entry.by = "Finance";
        break;
      default:
        break;
    }
    stageLog.push(entry);
  });

  return { id, creatorId: creator.id, campaignId: campaign.id, stage: seed.stage, stageLog, submissions, reviews, shipment, publish, invitedAt: start };
}

// ---------- quests, rewards, badges, users ----------

function makeQuests(): SideQuest[] {
  const q = (id: string, title: Localised, prompt: Localised, brandId: string | null, points: number, daysLeft: number, states: Record<string, QuestState>, submissions: SideQuest["submissions"] = {}): SideQuest => ({ id, title, prompt, brandId, points, deadline: addDays(SEED_NOW, daysLeft), states, submissions, emojiFree: true });
  return [
    q("sq_shelfie", L("The Shelfie", "رف المنتجات"), L("A 5-second clip of your bathroom shelf with at least one Dabur product on it.", "مقطع 5 ثوانٍ لرف حمامك مع منتج دابر واحد على الأقل."), null, 80, 12, { cr_laylaoils: "completed", cr_noorhaddad: "submitted", cr_reemq: "joined" }, { cr_laylaoils: { filename: "shelfie.mp4", at: addDays(SEED_NOW, -4) }, cr_noorhaddad: { filename: "shelf_take3.mov", at: addDays(SEED_NOW, -1) } }),
    q("sq_oneline", L("One-line Review", "مراجعة بسطر واحد"), L("Say one honest sentence about any product you have used this month.", "قل جملة صادقة واحدة عن أي منتج استخدمته هذا الشهر."), null, 60, 20, { cr_aishacurls: "reviewed", cr_salmafahad: "joined" }, { cr_aishacurls: { filename: "oneline.mp4", at: addDays(SEED_NOW, -2) } }),
    q("sq_amlaarchive", L("The Amla Archive", "أرشيف الأملا"), L("Find the oldest Dabur Amla bottle in your family home and film it.", "ابحث عن أقدم زجاجة دابر أملا في بيت العائلة وصوّرها."), "dabur-amla", 150, 25, { cr_mariamb: "joined" }),
    q("sq_dentist", L("Ask a Dentist", "اسأل طبيب أسنان"), L("A 20-second myth-bust about charcoal toothpaste.", "20 ثانية لتفنيد خرافة عن معجون الفحم."), "dabur-herbl", 120, 9, { cr_tariqbrushes: "completed" }, { cr_tariqbrushes: { filename: "charcoal_myth.mp4", at: addDays(SEED_NOW, -6) } }),
    q("sq_lunchbox", L("Lunchbox Speedrun", "علبة الغداء بسرعة"), L("Pack a school lunchbox in under 60 seconds, Real juice included.", "جهّز علبة غداء مدرسية في أقل من 60 ثانية مع عصير ريل."), "real", 100, 15, {}),
    q("sq_tanglefree", L("Tangle-Free Tuesday", "ثلاثاء بلا تشابك"), L("Show your detangling routine on a child or on yourself.", "أظهر روتين فك التشابك لطفل أو لنفسك."), "vatika", 90, 30, { cr_ghadaaziz: "joined", cr_reemq: "submitted" }, { cr_reemq: { filename: "tuesday.mp4", at: addDays(SEED_NOW, -3) } }),
  ];
}

function makeRewards(): Reward[] {
  const r = (id: string, title: Localised, description: Localised, cost: number, kind: Reward["kind"], brandId: string | null, stock: number): Reward => ({ id, title, description, cost, kind, brandId, stock });
  return [
    r("rw_vatika_box", L("Vatika Full Range Box", "صندوق فاتيكا الكامل"), L("Every Vatika oil, shampoo and conditioner in one box.", "كل زيوت وشامبو وبلسم فاتيكا في صندوق واحد."), 600, "product", "vatika", 14),
    r("rw_amla_trio", L("Amla Trio", "ثلاثي الأملا"), L("Classic, Jasmine and Gold.", "الكلاسيك والياسمين والغولد."), 350, "product", "dabur-amla", 22),
    r("rw_smile_kit", L("Smile Kit", "كيت الابتسامة"), L("Charcoal, clove and neem toothpaste.", "معجون الفحم والقرنفل والنيم."), 250, "product", "dabur-herbl", 30),
    r("rw_honey_year", L("A Year of Honey", "سنة من العسل"), L("Twelve bottles, one each month.", "اثنتا عشرة زجاجة، واحدة كل شهر."), 900, "product", "dabur-honey", 6),
    r("rw_real_case", L("Real Juice Case", "صندوق عصير ريل"), L("Twelve cartons, mixed flavours.", "اثنتا عشرة علبة بنكهات متنوعة."), 300, "product", "real", 18),
    r("rw_hajmola_jar", L("Hajmola Party Jar", "برطمان هاجمولا"), L("The big jar.", "البرطمان الكبير."), 120, "product", "hajmola", 40),
    r("rw_fem_set", L("Fem Self-Care Set", "طقم فيم للعناية"), L("Creme bleach and hair removal cream.", "كريم بليتش وكريم إزالة الشعر."), 280, "product", "fem", 12),
    r("rw_chyawan_pair", L("Chyawanprash Pair", "زوج تشاوانبراش"), L("Two jars for the winter.", "علبتان للشتاء."), 320, "product", "chyawanprash", 15),
    r("rw_dermoviva_set", L("Dermoviva Body Set", "طقم ديرموفيفا"), L("Lotion and wash.", "لوشن وغسول."), 220, "product", "dermoviva", 20),
    r("rw_studio_day", L("Studio Day in Dubai", "يوم استوديو في دبي"), L("A booked shoot day with a lighting kit and an editor on call.", "يوم تصوير محجوز مع إضاءة ومونتير جاهز."), 2400, "experience", null, 3),
    r("rw_riyadh_masterclass", L("Riyadh Creator Masterclass", "ماستر كلاس صنّاع المحتوى بالرياض"), L("Half-day session with the Dabur content team.", "جلسة نصف يوم مع فريق محتوى دابر."), 1800, "experience", null, 5),
    r("rw_brand_visit", L("Behind the Bottle", "خلف الزجاجة"), L("A tour of the Dabur plant in Ras Al Khaimah.", "جولة في مصنع دابر برأس الخيمة."), 1500, "experience", null, 4),
    r("rw_voucher_100", L("AED 100 Pharmacy Voucher", "قسيمة صيدلية بقيمة 100 درهم"), L("Redeemable at partner pharmacies.", "تُستبدل في الصيدليات الشريكة."), 500, "voucher", null, 50),
    r("rw_voucher_250", L("AED 250 Pharmacy Voucher", "قسيمة صيدلية بقيمة 250 درهم"), L("Redeemable at partner pharmacies.", "تُستبدل في الصيدليات الشريكة."), 1100, "voucher", null, 25),
    r("rw_voucher_sar", L("SAR 250 Pharmacy Voucher", "قسيمة صيدلية بقيمة 250 ريال"), L("Redeemable in KSA partner pharmacies.", "تُستبدل في الصيدليات الشريكة بالسعودية."), 1100, "voucher", null, 25),
    r("rw_boost_feature", L("Featured on Dabur Arabia", "ظهور على حساب دابر أرابيا"), L("Your approved reel reposted on the brand account.", "إعادة نشر الريل المعتمد على حساب العلامة."), 700, "boost", null, 10),
    r("rw_boost_early", L("Early Brief Access", "وصول مبكر للموجزات"), L("See the next three campaign briefs a week before everyone.", "اطّلع على الموجزات الثلاثة القادمة قبل الجميع بأسبوع."), 400, "boost", null, 30),
    r("rw_boost_editor", L("Editor for a Week", "مونتير لمدة أسبوع"), L("A professional editor on call for one campaign.", "مونتير محترف جاهز لحملة واحدة."), 1300, "boost", null, 6),
    r("rw_boost_shoutout", L("Squad Shout-out", "تحية من السكواد"), L("A personal thank-you video from the brand team.", "فيديو شكر شخصي من فريق العلامة."), 150, "boost", null, 100),
  ];
}

function makeBadges(): Badge[] {
  const b = (id: string, title: Localised, description: Localised, rule: Badge["rule"], icon: string): Badge => ({ id, title, description, rule, icon });
  return [
    b("bg_first", L("First Shoot", "أول تصوير"), L("Completed your first campaign.", "أكملت أول حملة."), "first_campaign", "Sparkle"),
    b("bg_three", L("Regular", "ضيف دائم"), L("Three campaigns completed.", "ثلاث حملات مكتملة."), "three_campaigns", "Repeat"),
    b("bg_quest", L("Side Quester", "مغامر المهام"), L("Completed a side quest.", "أكملت مهمة جانبية."), "first_quest", "Compass"),
    b("bg_streak", L("Four in a Row", "أربعة على التوالي"), L("Four consecutive active weeks.", "أربعة أسابيع نشطة متتالية."), "streak_4", "Fire"),
    b("bg_verified", L("Fully Verified", "موثّق بالكامل"), L("Identity and both platforms verified.", "الهوية والمنصتان موثقة."), "all_verified", "SealCheck"),
    b("bg_publish", L("Live", "على الهواء"), L("First verified post.", "أول منشور موثق."), "first_publish", "Broadcast"),
    b("bg_five", L("Five Live", "خمسة على الهواء"), L("Five verified posts.", "خمسة منشورات موثقة."), "five_published", "Confetti"),
    b("bg_clean", L("One Take", "لقطة واحدة"), L("Approved with zero revision rounds.", "اعتُمد بدون جولات تعديل."), "revision_free", "Target"),
    b("bg_early", L("Early Bird", "الطائر المبكر"), L("Accepted an invitation within a day.", "قبلت دعوة خلال يوم واحد."), "early_bird", "SunHorizon"),
  ];
}

const BRAND_USERS: BrandUser[] = [
  { id: "bu_admin", name: "Rania Haddad", role: "super_admin", market: "all" },
  { id: "bu_bm", name: "Faisal Al Amri", role: "brand_manager", market: "all" },
  { id: "bu_cm", name: "Dina Saleh", role: "campaign_manager", market: "UAE" },
  { id: "bu_reviewer", name: "Karim Nasser", role: "content_reviewer", market: "all" },
  { id: "bu_logistics", name: "Priya Menon", role: "logistics", market: "UAE" },
  { id: "bu_finance", name: "Hana Yousef", role: "finance", market: "all" },
];

function seedNotifications(): Notification[] {
  const n = (audience: string, channel: Notification["channel"], title: Localised, body: Localised, hoursAgo: number, link?: string, read = false): Notification => ({ id: newId("ntf", audience + title.en), audience, channel, title, body, link, at: addMinutes(SEED_NOW, -hoursAgo * 60), read, simulated: true });
  return [
    n("creator:cr_laylaoils", "email", L("You are invited: The Hot Oil Ritual", "دعوة: طقس حمام الزيت"), L("750 points, kit included. Respond in the portal.", "750 نقطة مع كيت المنتجات. رُدّ من البوابة."), 20, "/creator/invitations"),
    n("creator:cr_laylaoils", "push", L("Your cut is in review", "مقطعك قيد المراجعة"), L("Karim is watching v2 of 30 Days Stronger.", "كريم يشاهد الإصدار الثاني من 30 يوماً أقوى."), 30, "/creator/campaigns/pt_blackseed30_laylaoils/feedback"),
    n("creator:cr_laylaoils", "push", L("+80 points", "+80 نقطة"), L("The Shelfie reviewed and rewarded.", "تمت مراجعة رف المنتجات ومكافأتك."), 96, "/creator/rewards", true),
    n("brand", "inapp", L("New cut from Layla Al Mansoori", "مقطع جديد من ليلى المنصوري"), L("30 Days Stronger v2. Auto check ready.", "30 يوماً أقوى الإصدار الثاني. الفحص الآلي جاهز."), 30, "/admin/review"),
    n("brand", "inapp", L("Ghada Aziz posted Back-to-School Mornings", "غادة عزيز نشرت صباحات العودة إلى المدرسة"), L("Verified. Finance can release 450 points.", "تم التحقق. يمكن للفريق المالي تحرير 450 نقطة."), 40, "/admin/loyalty"),
    n("brand", "inapp", L("3 kits waiting to ship", "3 كيتات بانتظار الشحن"), L("Oil Sunday addresses confirmed.", "تم تأكيد عناوين أحد الزيت."), 50, "/admin/logistics"),
  ];
}

// ---------- assemble ----------

export function createSeed(): AppState {
  resetIdCounter();
  const brands = catalogue.brands as Brand[];
  const products = catalogue.products as Product[];
  const creators = makeCreators();
  const campaigns = makeCampaigns();
  const ledger: LedgerEntry[] = [];
  const participations = PARTICIPATIONS.map((p) => buildParticipation(p, campaigns, creators, "Karim Nasser", ledger));
  const quests = makeQuests();

  // Quest and bonus ledger entries so balances are interesting.
  for (const q of quests) {
    for (const [creatorId, st] of Object.entries(q.states)) {
      if (st === "completed") ledger.push({ id: `led_${q.id}_${creatorId}`, creatorId, delta: q.points, reason: L(`Side quest: ${q.title.en}`, `مهمة جانبية: ${q.title.ar}`), ref: { kind: "quest", id: `${q.id}:${creatorId}` }, at: addDays(SEED_NOW, -4) });
    }
  }
  const welcome = (creatorId: string, daysAgo: number, delta = 100): LedgerEntry => ({ id: `led_welcome_${creatorId}`, creatorId, delta, reason: L("Welcome bonus", "مكافأة ترحيبية"), ref: { kind: "bonus", id: "welcome" }, at: addDays(SEED_NOW, -daysAgo) });
  creators.forEach((c, i) => ledger.push(welcome(c.id, 30 + i * 11)));
  ledger.push({ id: "led_bonus_layla", creatorId: "cr_laylaoils", delta: 250, reason: L("Squad spotlight, August", "أضواء السكواد، أغسطس"), ref: { kind: "bonus", id: "spotlight-aug" }, at: addDays(SEED_NOW, -12) });
  ledger.push({ id: "led_bonus_omar", creatorId: "cr_omarlaughs", delta: 200, reason: L("Top reach, July", "أعلى وصول، يوليو"), ref: { kind: "bonus", id: "reach-jul" }, at: addDays(SEED_NOW, -35) });
  ledger.sort((a, b) => a.at.localeCompare(b.at));

  const rewards = makeRewards();
  const redemptions: AppState["redemptions"] = [
    { id: "rdm_omar_jar", creatorId: "cr_omarlaughs", rewardId: "rw_hajmola_jar", cost: 120, status: "fulfilled", at: addDays(SEED_NOW, -20), fulfilledAt: addDays(SEED_NOW, -18) },
    { id: "rdm_yousef_case", creatorId: "cr_yousefeats", rewardId: "rw_real_case", cost: 300, status: "requested", at: addDays(SEED_NOW, -2) },
  ];
  for (const r of redemptions) {
    const rw = rewards.find((x) => x.id === r.rewardId)!;
    rw.stock -= 1;
    ledger.push({ id: `led_${r.id}`, creatorId: r.creatorId, delta: -r.cost, reason: L(`Redeemed ${rw.title.en}`, `استبدال ${rw.title.ar}`), ref: { kind: "redemption", id: r.id }, at: r.at });
  }

  return {
    seedVersion: SEED_VERSION,
    lang: "en",
    session: { seat: null, creatorId: "cr_laylaoils", role: "super_admin", brandUserId: "bu_admin" },
    brands,
    products,
    creators,
    campaigns,
    participations,
    quests,
    ledger,
    rewards,
    redemptions,
    badges: makeBadges(),
    notifications: seedNotifications(),
    brandUsers: BRAND_USERS,
    now: SEED_NOW,
  };
}
