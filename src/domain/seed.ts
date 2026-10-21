import catalogue from "../data/catalogue.json";
import type {
  AcademyTrack, AcceptanceCriterion, AppState, Badge, Brand, BrandUser, Campaign, Creator, Language, LedgerEntry, Localised, MentorSession, Mission, Notification, Participation,
  Product, Referral, Review, Reward, Season, Shipment, Stage, StageLogEntry, Submission,
} from "./types";
import { STAGES } from "./stages";
import { autoCheck, connectAccount, COURIERS, fnv1a, missionCheck, newId, resetIdCounter, trackingNumber, addDays, addMinutes } from "./simulate";

export const SEED_VERSION = "2026-10-21.1";
export const SEED_NOW = "2026-10-21T09:00:00.000Z";

const L = (en: string, ar: string): Localised => ({ en, ar });

// ---------- creators ----------

type CreatorSeed = [name: string, handle: string, market: Creator["market"], city: string, niche: Creator["niche"], tier: Creator["tier"], followers: number, bioEn: string, bioAr: string, langs: Language[], vibeEn: string, vibeAr: string];

const CREATORS: CreatorSeed[] = [
  ["Layla Al Mansoori", "laylaoils", "UAE", "Dubai", "haircare", "macro", 412_000, "Oiling rituals, curl routines and the occasional hair disaster.", "طقوس الزيوت وروتين الكيرلي وبعض كوارث الشعر أحياناً.", ["ar", "en"], "Warm, a little chaotic, always honest.", "دافئة وفوضوية قليلاً وصادقة دائماً."],
  ["Noor Haddad", "noorhaddad", "UAE", "Dubai", "beauty", "micro", 58_300, "Get-ready-with-me videos that start at 6am and end with coffee.", "فيديوهات جهزي معي تبدأ الساعة 6 صباحاً وتنتهي بالقهوة.", ["en", "ar"], "Early mornings, big energy.", "صباحات مبكرة وطاقة كبيرة."],
  ["Reem Al Qasimi", "reemq", "UAE", "Sharjah", "family", "micro", 33_900, "Mum of three, chief negotiator at bath time.", "أم لثلاثة، وكبيرة المفاوضين وقت الاستحمام.", ["ar"], "Real family life, no filters.", "حياة عائلية حقيقية بلا فلاتر."],
  ["Hessa Al Nuaimi", "hessa.moves", "UAE", "Abu Dhabi", "fitness", "nano", 8_700, "Sunrise runs on the Corniche and post-run recovery tips.", "جري عند شروق الشمس على الكورنيش ونصائح للتعافي بعده.", ["ar", "en"], "Sweaty, sunny, consistent.", "عرق وشمس والتزام."],
  ["Dana Khalil", "danakcooks", "UAE", "Dubai", "food", "micro", 71_200, "Fifteen-minute dinners for people who are always late.", "عشاء في 15 دقيقة لمن يتأخرون دائماً.", ["en"], "Fast food, home-made.", "أكل سريع من البيت."],
  ["Yara Nassar", "yaranassar", "UAE", "Dubai", "lifestyle", "mega", 1_240_000, "Slow mornings, fast edits.", "صباحات هادئة ومونتاج سريع.", ["en", "ar"], "Calm on camera, chaos behind it.", "هدوء أمام الكاميرا وفوضى خلفها."],
  ["Omar Al Rashid", "omarlaughs", "UAE", "Dubai", "comedy", "macro", 356_000, "Sketches about Arab households, mostly accurate.", "سكتشات عن البيوت العربية، دقيقة في معظمها.", ["ar"], "If it is not funny, it is not posted.", "إن لم يكن مضحكاً فلن يُنشر."],
  ["Tariq Hamdan", "tariqbrushes", "UAE", "Abu Dhabi", "oralcare", "nano", 6_100, "Dental student explaining what your dentist wishes you knew.", "طالب طب أسنان يشرح ما يتمنى طبيبك أن تعرفه.", ["en", "ar"], "Nerdy and proud.", "مهووس بالتفاصيل وفخور."],
  ["Nadine Farah", "nadinefarah", "UAE", "Dubai", "wellness", "micro", 44_800, "Breathwork, sleep and the honest version of self-care.", "تمارين تنفس ونوم والنسخة الصادقة من العناية بالذات.", ["en"], "Soft voice, strong opinions.", "صوت هادئ وآراء قوية."],
  ["Aisha Rahman", "aisha.curls", "UAE", "Ajman", "haircare", "micro", 27_500, "Type 3C curls and every product that has ever touched them.", "شعر كيرلي 3C وكل منتج لمسه يوماً.", ["en"], "Curl science, explained simply.", "علم الكيرلي ببساطة."],
  ["Sara Alsheikh", "saraalsheikh", "KSA", "Riyadh", "beauty", "macro", 289_000, "Makeup for the Riyadh heat. Long-wear only.", "مكياج يتحمّل حر الرياض. ثبات طويل فقط.", ["ar"], "Glam that survives August.", "لمعة تصمد في أغسطس."],
  ["Mariam Bukhari", "mariam.b", "KSA", "Jeddah", "family", "micro", 52_400, "Twins, tantrums and tidy hair by 7:30.", "توأم ونوبات غضب وشعر مرتب بحلول 7:30.", ["ar", "en"], "Organised chaos.", "فوضى منظمة."],
  ["Fatima Zayed", "fatimazayed", "KSA", "Riyadh", "wellness", "nano", 9_800, "Herbal teas, evening walks and honest reviews.", "شاي أعشاب ومشي مسائي ومراجعات صادقة.", ["ar"], "Slow living, Riyadh edition.", "حياة هادئة بنكهة الرياض."],
  ["Lina Barakat", "linabarakat", "KSA", "Jeddah", "lifestyle", "micro", 63_100, "Jeddah by the sea, one vlog at a time.", "جدة على البحر، فلوغ واحد في كل مرة.", ["ar", "en"], "Sea air and street food.", "هواء البحر وأكل الشارع."],
  ["Salma Fahad", "salmafahad", "KSA", "Dammam", "haircare", "macro", 198_000, "Long hair, longer routines.", "شعر طويل وروتين أطول.", ["ar"], "Patience is a hair product.", "الصبر منتج للشعر."],
  ["Khalid Bin Saeed", "khalidfit", "KSA", "Riyadh", "fitness", "micro", 88_900, "Strength coach. Protein, patience, and honey in my tea.", "مدرب قوة. بروتين وصبر وعسل في الشاي.", ["ar", "en"], "Lift heavy, sleep early.", "ارفع ثقيلاً ونم مبكراً."],
  ["Youssef Karam", "yousefeats", "KSA", "Jeddah", "food", "macro", 402_000, "Street food tours and the digestion advice nobody asked for.", "جولات أكل شعبي ونصائح هضم لم يطلبها أحد.", ["ar"], "Always hungry, always filming.", "جائع دائماً ويصوّر دائماً."],
  ["Maha Sultan", "mahasultan", "KSA", "Riyadh", "beauty", "nano", 7_400, "Skincare on a student budget.", "عناية بالبشرة بميزانية طالبة.", ["ar", "en"], "Budget beauty, no compromises.", "جمال بميزانية بلا تنازلات."],
  ["Ghada Aziz", "ghadaaziz", "KSA", "Dammam", "family", "micro", 39_600, "Four kids, one bathroom, zero patience for tangles.", "أربعة أطفال وحمام واحد وصبر صفر على التشابك.", ["ar"], "Loud house, tidy hair.", "بيت صاخب وشعر مرتب."],
  ["Amal Darwish", "amaldarwish", "KSA", "Jeddah", "comedy", "micro", 76_300, "Voiceovers for the drama in my kitchen.", "تعليق صوتي على دراما مطبخي.", ["ar"], "My kitchen is a sitcom.", "مطبخي مسلسل كوميدي."],
  ["Maryam Al Sabah", "maryam.ks", "Kuwait", "Kuwait City", "beauty", "micro", 61_900, "Skincare for dry desert air and dry humour.", "عناية بالبشرة لهواء الصحراء الجاف وحس فكاهي جاف.", ["ar", "en"], "Dry air, dry jokes.", "هواء جاف ونكت جافة."],
  ["Alya Al Thani", "alya.doha", "Qatar", "Doha", "lifestyle", "micro", 48_200, "Doha cafés, weekend routines and a very opinionated cat.", "مقاهي الدوحة وروتين نهاية الأسبوع وقطة ذات رأي قوي.", ["ar", "en"], "Weekend energy, every day.", "طاقة نهاية الأسبوع كل يوم."],
  ["Zahra Al Lawati", "zahra.muscat", "Oman", "Muscat", "haircare", "nano", 9_300, "Thick Omani hair and the oils my grandmother swears by.", "شعر عماني كثيف والزيوت التي تقسم بها جدتي.", ["ar"], "Grandmother-approved.", "بموافقة الجدة."],
  ["Hamad Al Khalifa", "hamad.bh", "Bahrain", "Manama", "comedy", "micro", 54_700, "Bahraini household comedy, filmed between Friday lunches.", "كوميديا البيوت البحرينية مصوّرة بين غداءات الجمعة.", ["ar", "en"], "Friday lunch is content.", "غداء الجمعة محتوى."],
  ["Noura Al Mutairi", "noura.kw", "Kuwait", "Salmiya", "family", "micro", 36_100, "Three boys, one hairbrush, daily miracles.", "ثلاثة أولاد وفرشاة واحدة ومعجزات يومية.", ["ar"], "Miracles before 8am.", "معجزات قبل الثامنة صباحاً."],
];

const DIAL: Record<Creator["market"], string> = { UAE: "+971 5", KSA: "+966 5", Kuwait: "+965 ", Qatar: "+974 ", Oman: "+968 9", Bahrain: "+973 3" };

function makeCreators(): Creator[] {
  return CREATORS.map(([name, handle, market, city, niche, tier, followers, bioEn, bioAr, langs, vibeEn, vibeAr], i) => {
    const verified = i % 4 !== 3;
    const mobile = `${DIAL[market]}${(i % 5) + 2} ${(100 + i * 7) % 900} ${(1000 + i * 131) % 9000}`;
    const joinedAt = addDays(SEED_NOW, -(30 + i * 11));
    const hasTiktok = i % 6 !== 5;
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
        tiktok: !hasTiktok ? "action" : i % 3 === 0 ? "verified" : "pending",
      },
      socials: { instagram: handle, tiktok: hasTiktok ? handle : undefined },
      connected: {
        instagram: { ...connectAccount("instagram", handle, joinedAt), followers },
        ...(hasTiktok ? { tiktok: { ...connectAccount("tiktok", handle, joinedAt), followers: Math.round(followers * 0.6) } } : {}),
      },
      languages: langs,
      vibe: L(vibeEn, vibeAr),
      favouritePosts: [`https://www.instagram.com/p/${handle.replace(/\W/g, "")}1/`, `https://www.instagram.com/reel/${handle.replace(/\W/g, "")}2/`],
      email: `${handle.replace(/\W/g, "")}@example.com`,
      mobile,
      mobileVerified: true,
      licence: i % 3 === 0 ? { state: "verified", number: `${market === "KSA" ? "GCAM" : "UAE-ADV"}-${(100000 + i * 731).toString()}` } : i % 3 === 1 ? { state: "pending" } : { state: "action" },
      address: { line1: i % 2 === 0 ? `Villa ${12 + i}, Al Wasl Road` : `Apt ${300 + i}, Tower ${(i % 4) + 1}`, city, market, phone: mobile, confirmed: i < 14 },
      joinedAt,
      streakMonths: [4, 2, 3, 0, 2, 5, 4, 1, 2, 3, 3, 2, 0, 2, 4, 1, 3, 0, 2, 2, 1, 2, 0, 1][i],
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
    window: { start: "2026-08-20", end: "2026-10-05" }, targetNiches: ["haircare", "beauty", "lifestyle"], targetMarkets: ["UAE", "KSA", "Kuwait", "Qatar", "Oman", "Bahrain"], targetTiers: ["micro", "macro", "mega"],
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
    window: { start: "2026-08-25", end: "2026-09-30" }, targetNiches: ["haircare", "family", "lifestyle"], targetMarkets: ["UAE", "KSA", "Kuwait", "Qatar", "Oman", "Bahrain"], targetTiers: ["nano", "micro", "macro"],
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
    window: { start: "2026-08-15", end: "2026-09-15" }, targetNiches: ["family", "food"], targetMarkets: ["UAE", "KSA", "Kuwait", "Qatar", "Oman", "Bahrain"], targetTiers: ["micro", "macro"],
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
    window: { start: "2026-07-01", end: "2026-08-10" }, targetNiches: ["comedy", "food"], targetMarkets: ["UAE", "KSA", "Kuwait", "Qatar", "Oman", "Bahrain"], targetTiers: ["micro", "macro", "mega"],
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
    window: { start: "2026-09-10", end: "2026-10-20" }, targetNiches: ["haircare", "wellness", "beauty"], targetMarkets: ["UAE", "KSA", "Kuwait", "Qatar", "Oman", "Bahrain"], targetTiers: ["micro", "macro"],
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
    window: { start: "2026-08-28", end: "2026-10-01" }, targetNiches: ["food", "fitness", "wellness"], targetMarkets: ["UAE", "KSA", "Kuwait", "Qatar", "Oman", "Bahrain"], targetTiers: ["nano", "micro", "macro"],
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
    window: { start: "2026-08-18", end: "2026-09-25" }, targetNiches: ["oralcare", "family", "comedy"], targetMarkets: ["KSA", "UAE", "Kuwait", "Bahrain"], targetTiers: ["nano", "micro"],
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
    window: { start: "2026-10-05", end: "2026-11-15" }, targetNiches: ["wellness", "fitness", "family"], targetMarkets: ["UAE", "KSA", "Kuwait", "Qatar", "Oman", "Bahrain"], targetTiers: ["micro", "macro"],
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
  { campaign: "cp_goldenmornings", creator: "cr_hamadbh", stage: "first_cut", daysAgo: 5 },
  { campaign: "cp_oilsunday", creator: "cr_zahramuscat", stage: "invited", daysAgo: 0 },
  { campaign: "cp_blackseed30", creator: "cr_maryamks", stage: "completed", daysAgo: 48 },
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

// ---------- missions, seasons, academy, rewards, badges, users ----------

const ALL_MARKETS: Creator["market"][] = ["UAE", "KSA", "Kuwait", "Qatar", "Oman", "Bahrain"];
const BOTH: Language[] = ["ar", "en"];

function entry(state: Mission["entries"][string]["state"], daysAgo: number, caption: string, mission: { requiredHashtags: string[]; window: { start: string; end: string } }, awarded?: number, squadId?: string, note?: string): Mission["entries"][string] {
  const at = addDays(SEED_NOW, -daysAgo);
  const submitted = state !== "joined";
  return {
    state,
    joinedAt: addDays(at, -1),
    squadId,
    awarded,
    submissions: submitted
      ? [{ id: `ms_${fnv1a(caption + at).toString(16)}`, url: `https://www.instagram.com/reel/${fnv1a(caption).toString(36)}/`, caption, at, check: missionCheck(caption, mission.requiredHashtags, at, mission.window), ...(state === "completed" || state === "changes" || state === "approved" ? { decision: state === "changes" ? "changes" as const : "approved" as const, note, reviewedAt: addMinutes(at, 180), reviewerName: "Karim Nasser" } : {}) }]
      : [],
  };
}

function makeMissions(): Mission[] {
  const base = (id: string, type: Mission["type"], title: Localised, prompt: Localised, sparks: number, extra: Partial<Mission> = {}): Mission => ({
    id, type, status: "live", title, prompt, brandId: null, sparks, paid: false,
    window: { start: "2026-10-01", end: "2026-11-30" }, markets: ALL_MARKETS, languages: BOTH, niches: [], levelRequired: "member",
    requiredHashtags: ["#DaburSquad"], entries: {}, ...extra,
  });
  const tag = (...h: string[]) => ["#DaburSquad", ...h];

  const starter = base("ms_unbox", "starter", L("Unbox your welcome kit your way", "افتح كيت الترحيب بطريقتك"), L("Fifteen seconds, your style. Show the kit, say hi, tell us what you want to make this season.", "خمس عشرة ثانية بأسلوبك. أظهر الكيت، وقل مرحباً، وأخبرنا ماذا تريد أن تصنع هذا الموسم."), 60, { requiredHashtags: tag("#WelcomeKit") });
  starter.entries = {
    cr_laylaoils: entry("completed", 40, "Kit day! #DaburSquad #WelcomeKit #gifted", starter, 60),
    cr_noorhaddad: entry("completed", 35, "Unboxing before coffee #DaburSquad #WelcomeKit #ad", starter, 60),
    cr_maryamks: entry("completed", 20, "Kuwait unboxing #DaburSquad #WelcomeKit #gifted", starter, 60),
    cr_alyadoha: entry("submitted", 2, "Doha cat approves #DaburSquad #WelcomeKit #gifted", starter),
    cr_zahramuscat: entry("joined", 1, "", starter),
    cr_hamadbh: entry("changes", 3, "Friday lunch unboxing #DaburSquad", starter, undefined, undefined, "Add the gifted disclosure and the #WelcomeKit tag."),
  };

  const monthly = base("ms_goldenhour", "monthly", L("Golden Hour Routine", "روتين الساعة الذهبية"), L("This season's theme. Film one self-care step in the last hour of daylight: oil, honey tea, a mask, your call.", "موضوع هذا الموسم. صوّر خطوة واحدة من العناية بالذات في آخر ساعة من ضوء النهار: زيت، شاي بالعسل، ماسك، الخيار لك."), 180, { requiredHashtags: tag("#GoldenHour"), window: { start: "2026-10-01", end: "2026-10-31" } });
  monthly.entries = {
    cr_laylaoils: entry("completed", 12, "Oil, sunset, done. #DaburSquad #GoldenHour #ad", monthly, 180),
    cr_salmafahad: entry("completed", 10, "Golden hour mask night #DaburSquad #GoldenHour #gifted", monthly, 180),
    cr_yaranassar: entry("submitted", 1, "Sunset tea ritual #DaburSquad #GoldenHour #ad", monthly),
    cr_nadinefarah: entry("joined", 4, "", monthly),
  };

  const team = base("ms_masknight", "team", L("Squad Mask Night", "ليلة الماسك الجماعية"), L("Squads of four. Everyone posts a hair-mask night on the same evening and tags their squad. The squad with the most approved posts wins a bonus 300 Sparks each.", "فرق من أربعة. ينشر الجميع ليلة ماسك الشعر في المساء نفسه ويذكر فريقه. الفريق صاحب أكبر عدد من المنشورات المعتمدة يفوز بمكافأة 300 سباركس لكل عضو."), 220, {
    brandId: "vatika", requiredHashtags: tag("#MaskNight"), window: { start: "2026-10-15", end: "2026-11-05" }, niches: ["haircare", "beauty", "family", "lifestyle"],
    squads: [
      { id: "sq_argan", name: L("Team Argan", "فريق الأرغان"), memberIds: ["cr_laylaoils", "cr_aishacurls", "cr_zahramuscat"] },
      { id: "sq_blackseed", name: L("Team Black Seed", "فريق الحبة السوداء"), memberIds: ["cr_salmafahad", "cr_ghadaaziz", "cr_mariamb"] },
      { id: "sq_coconut", name: L("Team Coconut", "فريق جوز الهند"), memberIds: ["cr_saraalsheikh", "cr_maryamks"] },
    ],
  });
  team.entries = {
    cr_laylaoils: entry("completed", 3, "Team Argan mask night #DaburSquad #MaskNight #ad", team, 220, "sq_argan"),
    cr_aishacurls: entry("submitted", 2, "Curls under a mask #DaburSquad #MaskNight #gifted", team, undefined, "sq_argan"),
    cr_zahramuscat: entry("joined", 2, "", team, undefined, "sq_argan"),
    cr_salmafahad: entry("completed", 3, "Black seed night #DaburSquad #MaskNight #ad", team, 220, "sq_blackseed"),
    cr_ghadaaziz: entry("completed", 2, "Four kids, one mask #DaburSquad #MaskNight #gifted", team, 220, "sq_blackseed"),
    cr_mariamb: entry("joined", 2, "", team, undefined, "sq_blackseed"),
    cr_saraalsheikh: entry("joined", 1, "", team, undefined, "sq_coconut"),
    cr_maryamks: entry("submitted", 1, "Coconut night in Kuwait #DaburSquad #MaskNight #ad", team, undefined, "sq_coconut"),
  };

  const review = base("ms_review_noon", "review", L("Review Vatika on the retailer page", "راجع فاتيكا على صفحة المتجر"), L("Leave an honest review on the Vatika Black Seed oil listing at a major e-commerce retailer and paste the link.", "اترك مراجعة صادقة لزيت فاتيكا بالحبة السوداء على صفحة متجر إلكتروني كبير والصق الرابط."), 80, { brandId: "vatika", requiredHashtags: [], levelRequired: "member" });
  review.entries = {
    cr_fatimazayed: entry("completed", 15, "Five stars, smells like my childhood. #DaburSquad #gifted", review, 80),
    cr_khalidfit: entry("submitted", 1, "Review posted #DaburSquad #gifted", review),
  };

  const event = base("ms_hairbar", "event", L("Vatika Hair Bar pop-up, Dubai Mall", "بوب أب فاتيكا هير بار، دبي مول"), L("Come to the Hair Bar, get a hot oil treatment on camera, post a story set and one reel from the day.", "تعال إلى الهير بار، احصل على حمام زيت أمام الكاميرا، وانشر مجموعة ستوري وريل واحد من اليوم."), 350, {
    brandId: "vatika", markets: ["UAE"], paid: true, levelRequired: "insider", requiredHashtags: tag("#HairBar"), window: { start: "2026-10-24", end: "2026-10-26" }, place: L("Dubai Mall, Fashion Avenue, 4pm to 9pm", "دبي مول، فاشن أفنيو، من 4 إلى 9 مساءً"),
  });
  event.entries = { cr_laylaoils: entry("joined", 5, "", event), cr_noorhaddad: entry("joined", 4, "", event) };

  const riyadh = base("ms_riyadh_workshop", "event", L("Riyadh creator workshop with Dabur Amla", "ورشة صنّاع المحتوى في الرياض مع دابر أملا"), L("A half-day shoot workshop. Film your lesson in practice and post it within a week.", "ورشة تصوير لنصف يوم. صوّر درسك عملياً وانشره خلال أسبوع."), 300, {
    brandId: "dabur-amla", markets: ["KSA"], languages: ["ar"], paid: true, levelRequired: "insider", requiredHashtags: tag("#AmlaWorkshop"), window: { start: "2026-11-07", end: "2026-11-14" }, place: L("Riyadh, Diriyah studio, 10am", "الرياض، استوديو الدرعية، 10 صباحاً"),
  });
  riyadh.entries = { cr_saraalsheikh: entry("joined", 2, "", riyadh) };

  const academy = base("ms_hooks", "academy", L("Hooks that stop the scroll", "افتتاحيات توقف التمرير"), L("Finish the Content craft track, then post a reel whose first two seconds use one of the three hook patterns.", "أكمل مسار صناعة المحتوى ثم انشر ريل تستخدم أول ثانيتين منه إحدى أنماط الافتتاحية الثلاثة."), 150, { trackId: "tr_craft", requiredHashtags: tag("#SquadAcademy") });
  academy.entries = {
    cr_laylaoils: entry("completed", 18, "Hook pattern two, in the wild #DaburSquad #SquadAcademy #ad", academy, 150),
    cr_tariqbrushes: entry("completed", 9, "Dentist hook, 2 seconds #DaburSquad #SquadAcademy #gifted", academy, 150),
  };

  const referral = base("ms_referral", "referral", L("Bring a creator into the Squad", "أحضر صانع محتوى إلى السكواد"), L("Refer a creator you rate. Sparks land when their application is approved.", "رشّح صانع محتوى تثق به. تصلك السباركس عند اعتماد طلبه."), 150, { requiredHashtags: [] });

  const drop = base("ms_honeyhack", "monthly", L("Surprise drop: the 10-second honey hack", "إسقاط مفاجئ: حيلة العسل في 10 ثوانٍ"), L("Double Sparks for 48 hours. One quick honey hack, breakfast or skin, your choice.", "سباركس مضاعفة لمدة 48 ساعة. حيلة عسل سريعة واحدة، فطور أو بشرة، الخيار لك."), 90, { brandId: "dabur-honey", requiredHashtags: tag("#HoneyHack"), doubleSparksUntil: addDays(SEED_NOW, 2), window: { start: "2026-10-20", end: "2026-10-23" } });
  drop.entries = { cr_danakcooks: entry("submitted", 0, "Honey on everything #DaburSquad #HoneyHack #gifted", drop) };

  const ramadanDraft = base("ms_ramadan", "monthly", L("Ramadan self-care routine", "روتين العناية بالذات في رمضان"), L("Draft for Season 3. A suhoor or post-iftar self-care routine with any Dabur product.", "مسودة للموسم الثالث. روتين عناية بالذات في السحور أو بعد الإفطار مع أي منتج دابر."), 200, { status: "draft", window: { start: "2027-02-15", end: "2027-03-20" }, requiredHashtags: tag("#RamadanRoutine") });

  const circleCamp = base("ms_circlecamp", "event", L("Circle Camp 2026", "مخيم السيركل 2026"), L("Three days in the Hajar mountains for this year's Ambassadors: challenges, masterclasses and shoots. Invitation only.", "ثلاثة أيام في جبال الحجر لسفراء هذا العام: تحديات وماستر كلاس وجلسات تصوير. بالدعوة فقط."), 500, { paid: true, levelRequired: "ambassador", requiredHashtags: tag("#CircleCamp"), window: { start: "2026-12-10", end: "2026-12-13" }, place: L("Hatta, UAE", "حتا، الإمارات") });

  return [starter, monthly, team, review, event, riyadh, academy, referral, drop, ramadanDraft, circleCamp];
}

function makeSeasons(): Season[] {
  return [
    {
      id: "sn_1", name: L("Season 1: Summer Hair Rescue", "الموسم 1: إنقاذ شعر الصيف"), theme: L("Heat, humidity and the routines that survive them.", "الحر والرطوبة والروتين الذي يصمد أمامهما."), start: "2026-06-01", end: "2026-08-31",
      finalePrize: L("Studio day in Dubai for the top three", "يوم استوديو في دبي لأفضل ثلاثة"),
      ambassadors: { phase: "selected", shortlist: ["cr_omarlaughs", "cr_yousefeats", "cr_laylaoils", "cr_saraalsheikh", "cr_yaranassar"], wildcards: ["cr_amaldarwish"], votes: { cr_noorhaddad: "cr_laylaoils", cr_reemq: "cr_omarlaughs", cr_danakcooks: "cr_yousefeats", cr_linabarakat: "cr_saraalsheikh", cr_mahasultan: "cr_laylaoils", cr_ghadaaziz: "cr_amaldarwish" }, cohort: ["cr_omarlaughs", "cr_yousefeats", "cr_laylaoils", "cr_amaldarwish", "cr_saraalsheikh"] },
    },
    {
      id: "sn_2", name: L("Season 2: Golden Hour", "الموسم 2: الساعة الذهبية"), theme: L("Slow evening rituals, honey light, and the products that live on your shelf.", "طقوس مسائية هادئة وضوء العسل والمنتجات التي تعيش على رفّك."), start: "2026-09-01", end: "2026-11-30",
      finalePrize: L("A year of product plus a feature on Dabur Arabia", "سنة من المنتجات وظهور على حساب دابر أرابيا"),
      ambassadors: { phase: "voting", shortlist: ["cr_laylaoils", "cr_salmafahad", "cr_omarlaughs", "cr_saraalsheikh"], wildcards: ["cr_maryamks", "cr_hamadbh"], votes: { cr_noorhaddad: "cr_laylaoils", cr_reemq: "cr_omarlaughs", cr_mahasultan: "cr_maryamks", cr_tariqbrushes: "cr_laylaoils", cr_alyadoha: "cr_hamadbh" }, cohort: [] },
    },
    {
      id: "sn_3", name: L("Season 3: Winter Glow", "الموسم 3: توهج الشتاء"), theme: L("Dry air, warm drinks and skin that needs a little more.", "هواء جاف ومشروبات دافئة وبشرة تحتاج المزيد قليلاً."), start: "2026-12-01", end: "2027-02-28",
      finalePrize: L("Circle Camp invitation for the top five", "دعوة لمخيم السيركل لأفضل خمسة"),
      ambassadors: { phase: "upcoming", shortlist: [], wildcards: [], votes: {}, cohort: [] },
    },
  ];
}

function makeAcademy(): AcademyTrack[] {
  const mod = (id: string, title: Localised, summary: Localised, minutes: number, kind: AcademyTrack["modules"][number]["kind"]) => ({ id, title, summary, minutes, kind });
  return [
    { id: "tr_craft", title: L("Content craft", "صناعة المحتوى"), blurb: L("Filming on a phone, lighting, editing, hooks and short-form storytelling.", "التصوير بالهاتف والإضاءة والمونتاج والافتتاحيات وسرد القصص القصيرة."), format: L("Bite-size video lessons plus practice missions", "دروس فيديو قصيرة ومهام تطبيقية"), levelRequired: "member", sparks: 120, modules: [
      mod("md_light", L("Light you already own", "الإضاءة التي تملكها بالفعل"), L("Window light, the golden hour and one lamp.", "ضوء النافذة والساعة الذهبية ومصباح واحد."), 7, "video"),
      mod("md_hook", L("Three hook patterns", "ثلاثة أنماط للافتتاحية"), L("Question, contrast, and the mid-action start.", "السؤال والتباين والبدء من منتصف الحدث."), 9, "video"),
      mod("md_edit", L("Edit on your phone in 20 minutes", "المونتاج على هاتفك في 20 دقيقة"), L("Cuts, captions and sound without a laptop.", "القطع والترجمات والصوت بدون لابتوب."), 12, "video"),
    ] },
    { id: "tr_growth", title: L("Growth", "النمو"), blurb: L("Reading analytics, posting strategy, building community.", "قراءة التحليلات واستراتيجية النشر وبناء المجتمع."), format: L("Live sessions with creators and platform experts", "جلسات مباشرة مع صنّاع محتوى وخبراء المنصات"), levelRequired: "member", sparks: 120, modules: [
      mod("md_analytics", L("What your analytics are actually saying", "ما تقوله تحليلاتك فعلاً"), L("Retention curves, saves and the one number that matters.", "منحنيات الاحتفاظ والحفظ والرقم الوحيد المهم."), 25, "live"),
      mod("md_cadence", L("A posting cadence you can keep", "وتيرة نشر يمكنك الالتزام بها"), L("Batching, series, and when to rest.", "التجميع والسلاسل ومتى ترتاح."), 20, "live"),
    ] },
    { id: "tr_business", title: L("Business of creating", "تجارة صناعة المحتوى"), blurb: L("Pricing, media kits, contracts, brand pitching.", "التسعير والملف التعريفي والعقود وعرض الأفكار على العلامات."), format: L("Workshops and templates", "ورش عمل وقوالب"), levelRequired: "insider", sparks: 180, modules: [
      mod("md_pricing", L("Pricing without guessing", "التسعير بلا تخمين"), L("Rate cards for nano to macro, with GCC benchmarks.", "بطاقات أسعار من النانو إلى الماكرو مع معايير خليجية."), 30, "workshop"),
      mod("md_mediakit", L("A media kit in one afternoon", "ملف تعريفي في عصر واحد"), L("Template included.", "القالب مرفق."), 40, "workshop"),
      mod("md_contracts", L("Reading a brand contract", "قراءة عقد علامة تجارية"), L("Usage rights, exclusivity, and what to strike out.", "حقوق الاستخدام والحصرية وما يجب شطبه."), 25, "workshop"),
    ] },
    { id: "tr_licensing", title: L("Licensing and compliance", "الترخيص والامتثال"), blurb: L("Getting and keeping UAE and KSA creator licences, disclosure rules.", "الحصول على تراخيص صنّاع المحتوى في الإمارات والسعودية والحفاظ عليها وقواعد الإفصاح."), format: L("Guided walkthroughs", "إرشادات خطوة بخطوة"), levelRequired: "member", sparks: 100, modules: [
      mod("md_uae_licence", L("The UAE advertiser permit", "تصريح المعلن في الإمارات"), L("Who needs it, what it costs, how to apply.", "من يحتاجه وكم يكلف وكيف تتقدم."), 15, "walkthrough"),
      mod("md_ksa_licence", L("The KSA Mawthooq licence", "رخصة موثوق في السعودية"), L("Step by step through the GCAM portal.", "خطوة بخطوة عبر بوابة الهيئة العامة للإعلام المرئي والمسموع."), 15, "walkthrough"),
      mod("md_disclosure", L("Ad and gifted labels that pass", "وسوم الإعلان والهدية المقبولة"), L("Where the label goes and what the auto check looks for.", "أين يوضع الوسم وما الذي يبحث عنه الفحص الآلي."), 8, "walkthrough"),
    ] },
    { id: "tr_wellbeing", title: L("Wellbeing", "الصحة النفسية"), blurb: L("Handling burnout, online negativity, balancing creating with life.", "التعامل مع الإرهاق والسلبية على الإنترنت وموازنة صناعة المحتوى مع الحياة."), format: L("Sessions with specialists", "جلسات مع مختصين"), levelRequired: "member", sparks: 100, modules: [
      mod("md_burnout", L("Spotting burnout early", "اكتشاف الإرهاق مبكراً"), L("The three signs and a reset plan.", "العلامات الثلاث وخطة إعادة الضبط."), 30, "session"),
      mod("md_comments", L("Comments, trolls and boundaries", "التعليقات والمتنمرون والحدود"), L("What to answer, what to mute.", "على ماذا ترد وماذا تكتم."), 25, "session"),
    ] },
    { id: "tr_mentorship", title: L("Mentorship", "الإرشاد"), blurb: L("Feedback on real content from senior creators and Dabur's marketing team.", "ملاحظات على محتوى حقيقي من صنّاع محتوى كبار وفريق تسويق دابر."), format: L("Group sessions for Insiders, 1:1 for Pros", "جلسات جماعية للإنسايدر وفردية للبرو"), levelRequired: "insider", sparks: 150, modules: [
      mod("md_portfolio", L("Portfolio review", "مراجعة الأعمال"), L("Bring three posts. Leave with a plan.", "أحضر ثلاثة منشورات واخرج بخطة."), 45, "session"),
      mod("md_pitch", L("Pitch practice", "تدريب على العرض"), L("Pitch a brand to the Dabur team, get notes.", "اعرض فكرة على فريق دابر واحصل على ملاحظات."), 45, "session"),
    ] },
  ];
}

function makeMentorSessions(): MentorSession[] {
  return [
    { id: "mt_group_oct", title: L("Group feedback: October cuts", "ملاحظات جماعية: مقاطع أكتوبر"), kind: "group", mentor: "Yara Nassar and Dina Saleh", at: addDays(SEED_NOW, 6), levelRequired: "insider", seats: 12, bookedBy: ["cr_noorhaddad", "cr_mariamb", "cr_linabarakat"] },
    { id: "mt_group_nov", title: L("Group feedback: November cuts", "ملاحظات جماعية: مقاطع نوفمبر"), kind: "group", mentor: "Omar Al Rashid and Karim Nasser", at: addDays(SEED_NOW, 34), levelRequired: "insider", seats: 12, bookedBy: [] },
    { id: "mt_one_layla", title: L("1:1 with the Dabur content team", "جلسة فردية مع فريق محتوى دابر"), kind: "one_to_one", mentor: "Faisal Al Amri", at: addDays(SEED_NOW, 9), levelRequired: "pro", seats: 1, bookedBy: ["cr_laylaoils"] },
    { id: "mt_one_open", title: L("1:1 with the Dabur content team", "جلسة فردية مع فريق محتوى دابر"), kind: "one_to_one", mentor: "Rania Haddad", at: addDays(SEED_NOW, 16), levelRequired: "pro", seats: 1, bookedBy: [] },
    { id: "mt_women", title: L("Women creators circle", "دائرة صانعات المحتوى"), kind: "group", mentor: "Sara Alsheikh and Hana Yousef", at: addDays(SEED_NOW, 12), levelRequired: "member", seats: 20, bookedBy: ["cr_fatimazayed", "cr_mahasultan", "cr_zahramuscat"] },
  ];
}

function makeReferrals(): Referral[] {
  return [
    { id: "ref_1", referrerId: "cr_laylaoils", handle: "hairbyhind", status: "approved", at: addDays(SEED_NOW, -22) },
    { id: "ref_2", referrerId: "cr_omarlaughs", handle: "abuyousefcomedy", status: "pending", at: addDays(SEED_NOW, -1) },
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
    b("bg_mission", L("Mission One", "المهمة الأولى"), L("Completed a mission.", "أكملت مهمة."), "first_mission", "Compass"),
    b("bg_streak", L("Three in a Row", "ثلاثة على التوالي"), L("Three consecutive active months.", "ثلاثة أشهر نشطة متتالية."), "streak_3", "Fire"),
    b("bg_verified", L("Fully Verified", "موثّق بالكامل"), L("Identity and both platforms verified.", "الهوية والمنصتان موثقة."), "all_verified", "SealCheck"),
    b("bg_publish", L("Live", "على الهواء"), L("First verified post.", "أول منشور موثق."), "first_publish", "Broadcast"),
    b("bg_five", L("Five Live", "خمسة على الهواء"), L("Five verified posts.", "خمسة منشورات موثقة."), "five_published", "Confetti"),
    b("bg_clean", L("One Take", "لقطة واحدة"), L("Approved with zero revision rounds.", "اعتُمد بدون جولات تعديل."), "revision_free", "Target"),
    b("bg_early", L("Early Bird", "الطائر المبكر"), L("Accepted an invitation within a day.", "قبلت دعوة خلال يوم واحد."), "early_bird", "SunHorizon"),
    b("bg_paid", L("Paid Pro", "محترف مدفوع"), L("Completed your first paid mission.", "أكملت أول مهمة مدفوعة."), "first_paid", "Coins"),
    b("bg_graduate", L("Academy Graduate", "خريج الأكاديمية"), L("Finished an Academy track.", "أنهيت مساراً في الأكاديمية."), "academy_graduate", "GraduationCap"),
    b("bg_voted", L("Crowd Favourite", "المفضل لدى الجمهور"), L("Three or more Ambassador votes.", "ثلاثة أصوات أو أكثر لترشيح السفراء."), "top_voted", "Star"),
    b("bg_squad", L("Squad Player", "لاعب فريق"), L("Completed a team challenge.", "أكملت تحدياً جماعياً."), "squad_player", "UsersThree"),
    b("bg_referrer", L("Talent Scout", "كشّاف المواهب"), L("Brought an approved creator into the Squad.", "أحضرت صانع محتوى معتمداً إلى السكواد."), "referrer", "Handshake"),
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
    n("creator:cr_laylaoils", "push", L("+220 Sparks", "+220 سباركس"), L("Squad Mask Night approved.", "تم اعتماد ليلة الماسك الجماعية."), 70, "/creator/rewards", true),
    n("creator:cr_laylaoils", "email", L("You are shortlisted for Ambassador", "تم ترشيحك للسفراء"), L("Season 2 voting is open until the finale.", "التصويت للموسم الثاني مفتوح حتى الختام."), 48, "/creator/season"),
    n("brand", "inapp", L("New cut from Layla Al Mansoori", "مقطع جديد من ليلى المنصوري"), L("30 Days Stronger v2. Auto check ready.", "30 يوماً أقوى الإصدار الثاني. الفحص الآلي جاهز."), 30, "/admin/review"),
    n("brand", "inapp", L("Ghada Aziz posted Back-to-School Mornings", "غادة عزيز نشرت صباحات العودة إلى المدرسة"), L("Verified. Finance can release 450 Sparks.", "تم التحقق. يمكن للفريق المالي تحرير 450 سباركس."), 40, "/admin/loyalty"),
    n("brand", "inapp", L("Yara Nassar submitted Golden Hour Routine", "يارا نصار سلّمت روتين الساعة الذهبية"), L("Auto check passed. Needs a light review.", "اجتاز الفحص الآلي. يحتاج مراجعة خفيفة."), 20, "/admin/missions/ms_goldenhour"),
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
  const missions = makeMissions();
  const academy = makeAcademy();

  // Mission completions land in the ledger with the award recorded on the entry.
  for (const m of missions) {
    for (const [creatorId, e] of Object.entries(m.entries)) {
      if (e.state === "completed" && e.awarded) {
        const at = e.submissions[e.submissions.length - 1]?.reviewedAt ?? SEED_NOW;
        ledger.push({ id: `led_${m.id}_${creatorId}`, creatorId, delta: e.awarded, reason: L(`Mission: ${m.title.en}`, `مهمة: ${m.title.ar}`), ref: { kind: "mission", id: `${m.id}:${creatorId}` }, at });
      }
    }
  }

  // Academy progress and certificates.
  const progress: AppState["academy"]["progress"] = {
    cr_laylaoils: { md_light: addDays(SEED_NOW, -30), md_hook: addDays(SEED_NOW, -28), md_edit: addDays(SEED_NOW, -25), md_uae_licence: addDays(SEED_NOW, -20), md_ksa_licence: addDays(SEED_NOW, -20), md_disclosure: addDays(SEED_NOW, -19), md_pricing: addDays(SEED_NOW, -8) },
    cr_tariqbrushes: { md_light: addDays(SEED_NOW, -16), md_hook: addDays(SEED_NOW, -14), md_edit: addDays(SEED_NOW, -12) },
    cr_noorhaddad: { md_light: addDays(SEED_NOW, -6), md_analytics: addDays(SEED_NOW, -3) },
    cr_salmafahad: { md_light: addDays(SEED_NOW, -40), md_hook: addDays(SEED_NOW, -39), md_edit: addDays(SEED_NOW, -38), md_burnout: addDays(SEED_NOW, -10) },
    cr_maryamks: { md_uae_licence: addDays(SEED_NOW, -4) },
  };
  const certificates: AppState["academy"]["certificates"] = { cr_laylaoils: ["tr_craft", "tr_licensing"], cr_tariqbrushes: ["tr_craft"], cr_salmafahad: ["tr_craft"] };
  for (const [creatorId, tracks] of Object.entries(certificates)) {
    for (const trackId of tracks) {
      const track = academy.find((t) => t.id === trackId)!;
      const at = progress[creatorId][track.modules[track.modules.length - 1].id];
      ledger.push({ id: `led_academy_${trackId}_${creatorId}`, creatorId, delta: track.sparks, reason: L(`Academy: ${track.title.en}`, `الأكاديمية: ${track.title.ar}`), ref: { kind: "academy", id: `${trackId}:${creatorId}` }, at });
    }
  }

  const referrals = makeReferrals();
  ledger.push({ id: "led_ref_1", creatorId: "cr_laylaoils", delta: 150, reason: L("Referral: @hairbyhind", "إحالة: @hairbyhind"), ref: { kind: "referral", id: "ref_1" }, at: addDays(SEED_NOW, -21) });

  // Welcome bonuses, season history and streak bonuses so levels and leaderboards have texture.
  const welcome = (creatorId: string, daysAgo: number, delta = 100): LedgerEntry => ({ id: `led_welcome_${creatorId}`, creatorId, delta, reason: L("Welcome bonus", "مكافأة ترحيبية"), ref: { kind: "bonus", id: "welcome" }, at: addDays(SEED_NOW, -daysAgo) });
  creators.forEach((c, i) => ledger.push(welcome(c.id, 30 + i * 11)));
  const bonus = (id: string, creatorId: string, delta: number, en: string, ar: string, daysAgo: number, kind: LedgerEntry["ref"]["kind"] = "bonus"): LedgerEntry => ({ id, creatorId, delta, reason: L(en, ar), ref: { kind, id }, at: addDays(SEED_NOW, -daysAgo) });
  ledger.push(
    bonus("led_s1_layla", "cr_laylaoils", 900, "Season 1 finale: top three", "ختام الموسم 1: أفضل ثلاثة", 52),
    bonus("led_s1_omar", "cr_omarlaughs", 1100, "Season 1 finale: first place", "ختام الموسم 1: المركز الأول", 52),
    bonus("led_s1_yousef", "cr_yousefeats", 700, "Season 1 finale: top three", "ختام الموسم 1: أفضل ثلاثة", 52),
    bonus("led_s2_layla_oct", "cr_laylaoils", 400, "Ambassador partnership: October", "شراكة السفراء: أكتوبر", 14),
    bonus("led_s2_omar_oct", "cr_omarlaughs", 400, "Ambassador partnership: October", "شراكة السفراء: أكتوبر", 14),
    bonus("led_s2_sara_sep", "cr_saraalsheikh", 400, "Ambassador partnership: September", "شراكة السفراء: سبتمبر", 40),
    bonus("led_s2_sara_feat", "cr_saraalsheikh", 350, "Featured on Dabur Arabia", "ظهور على دابر أرابيا", 9),
    bonus("led_s2_salma_feat", "cr_salmafahad", 300, "Top reach, September", "أعلى وصول، سبتمبر", 25),
    bonus("led_s2_omar_feat", "cr_omarlaughs", 300, "Top reach, September", "أعلى وصول، سبتمبر", 25),
    bonus("led_streak_layla", "cr_laylaoils", 50, "Streak bonus", "مكافأة الاستمرارية", 12, "streak"),
    bonus("led_streak_salma", "cr_salmafahad", 50, "Streak bonus", "مكافأة الاستمرارية", 10, "streak"),
    bonus("led_streak_omar", "cr_omarlaughs", 50, "Streak bonus", "مكافأة الاستمرارية", 14, "streak"),
    bonus("led_sep_noor", "cr_noorhaddad", 120, "Spotlight, September", "أضواء سبتمبر", 33),
    bonus("led_sep_maryam", "cr_maryamks", 90, "Kuwait launch bonus", "مكافأة إطلاق الكويت", 28),
  );
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
  ledger.sort((a, b) => a.at.localeCompare(b.at));

  return {
    seedVersion: SEED_VERSION,
    lang: "en",
    session: { seat: null, creatorId: "cr_laylaoils", role: "super_admin", brandUserId: "bu_admin" },
    brands,
    products,
    creators,
    campaigns,
    participations,
    missions,
    seasons: makeSeasons(),
    academy: { tracks: academy, progress, certificates },
    mentorSessions: makeMentorSessions(),
    referrals,
    ledger,
    rewards,
    redemptions,
    badges: makeBadges(),
    notifications: seedNotifications(),
    brandUsers: BRAND_USERS,
    now: SEED_NOW,
  };
}
