/**
 * Every photograph the interface can show. `scripts/generate-art.ts` reads this
 * file, asks Gemini for each image (or imports ones you made in the Gemini app),
 * and writes `src/art/generated/<id>.webp`. `ArtSlot` and `Face` pick the files
 * up at build time; until a file exists the interface falls back to its drawn
 * panel or monogram, so nothing breaks while the set is incomplete.
 *
 * Direction: real photography, never illustration. Candid, warm, Gulf light,
 * people mid-action with products in frame. No text, no logos, no watermarks.
 */
export type ArtTool = "gemini" | "recraft" | "hf";

export interface ArtSlot {
  id: string;
  label: string;
  /** Where it appears, so the prompt and crop make sense. */
  placement: string;
  tool: ArtTool;
  style?: "vector_illustration" | "digital_illustration" | "icon" | "realistic_image";
  substyle?: string;
  width: number;
  height: number;
  prompt: string;
  /** Hue used by the placeholder tile. */
  hue: number;
}

const LOOK = "Photorealistic editorial photograph, candid and unposed, warm natural light, rich true-to-life colour, shallow depth of field, shot on a 35mm lens. Modern Gulf setting. No text, no captions, no logos, no brand names, no watermark.";

const photo = (id: string, label: string, placement: string, prompt: string, width = 1280, height = 720): ArtSlot => ({ id, label, placement, tool: "gemini", width, height, hue: 150, prompt: `${prompt} ${LOOK}` });

const mission = (id: string, label: string, prompt: string): ArtSlot => photo(`mission-${id}`, label, "Mission card cover and mission page", prompt, 960, 720);
const track = (id: string, label: string, prompt: string): ArtSlot => photo(`track-${id}`, label, "Academy track cover", prompt, 720, 960);

export const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const WOMAN = "a young Gulf Arab woman in her twenties";
const MAN = "a young Gulf Arab man in his twenties";
/** The seed cast. These people are fictional; their portraits are generated and say so in the README. */
const CAST: [name: string, who: string, where: string][] = [
  ["Layla Al Mansoori", `${WOMAN} with long glossy dark hair and small gold earrings`, "a bright Dubai apartment"],
  ["Noor Haddad", `${WOMAN} with a sleek dark bob`, "a vanity table with soft daylight in Dubai"],
  ["Reem Al Qasimi", `${WOMAN} wearing a soft blue hijab`, "a sunlit family living room in Sharjah"],
  ["Hessa Al Nuaimi", `${WOMAN} wearing a mint sports hijab and running jacket`, "the Abu Dhabi Corniche at sunrise"],
  ["Dana Khalil", `${WOMAN} with her hair in a bun and round glasses`, "a home kitchen with fresh ingredients in Dubai"],
  ["Yara Nassar", `${WOMAN} with long wavy brown hair`, "a Dubai cafe terrace"],
  ["Omar Al Rashid", `${MAN} with short cropped dark hair and light stubble, laughing`, "a colourful Dubai street"],
  ["Tariq Hamdan", `${MAN} with short dark hair and thin glasses, bright smile`, "a clean modern bathroom in Abu Dhabi"],
  ["Nadine Farah", `${WOMAN} with her dark hair in a low bun`, "a calm yoga corner with plants in Dubai"],
  ["Aisha Rahman", `${WOMAN} with voluminous dark curly hair`, "a balcony in Ajman in late afternoon light"],
  ["Sara Alsheikh", `${WOMAN} wearing a dusty rose hijab with polished make-up`, "a stylish Riyadh apartment"],
  ["Mariam Bukhari", `${WOMAN} wearing a cream hijab`, "a family home in Jeddah"],
  ["Fatima Zayed", `${WOMAN} wearing a white hijab`, "a quiet Riyadh courtyard with greenery"],
  ["Lina Barakat", `${WOMAN} with long light brown hair`, "the Jeddah waterfront"],
  ["Salma Fahad", `${WOMAN} wearing a terracotta hijab`, "a bright bedroom in Dammam"],
  ["Khalid Bin Saeed", `${MAN} with cropped dark hair and an athletic build`, "an outdoor gym in Riyadh"],
  ["Youssef Karam", `${MAN} with short dark hair and a warm grin`, "a Jeddah street food stall"],
  ["Maha Sultan", `${WOMAN} wearing a sky blue hijab and glasses`, "a beauty studio in Riyadh"],
  ["Ghada Aziz", `${WOMAN} wearing a sage green hijab`, "a family kitchen in Dammam"],
  ["Amal Darwish", `${WOMAN} with a dark bob, mid-laugh`, "a lively Jeddah cafe"],
  ["Maryam Al Sabah", `${WOMAN} with her hair in a sleek bun and bold lipstick`, "a Kuwait City rooftop"],
  ["Alya Al Thani", `${WOMAN} wearing a black hijab with gold jewellery`, "a Doha museum courtyard"],
  ["Zahra Al Lawati", `${WOMAN} with dark curly hair`, "a whitewashed terrace in Muscat"],
  ["Hamad Al Khalifa", `${MAN} with cropped hair and glasses, playful expression`, "a Manama souq alley"],
  ["Noura Al Mutairi", `${WOMAN} wearing a lilac hijab`, "a seaside promenade in Salmiya"],
  ["Rania Haddad", "a confident Arab woman in her thirties with a dark bob and glasses", "a modern Dubai office"],
  ["Faisal Al Amri", "an Arab man in his thirties with short dark hair and a trimmed beard", "a modern Dubai office"],
  ["Dina Saleh", "an Arab woman in her late twenties with long dark hair", "a creative studio in Dubai"],
  ["Karim Nasser", "an Arab man in his thirties with cropped hair and glasses", "a video editing suite"],
  ["Priya Menon", "a South Asian woman in her thirties with long dark hair", "a tidy warehouse office in Dubai"],
  ["Hana Yousef", "an Arab woman in her thirties wearing a navy hijab", "a modern Dubai office"],
];

export const portraitId = (name: string) => `portrait-${slug(name)}`;
const portrait = ([name, who, where]: (typeof CAST)[number]): ArtSlot => ({
  id: portraitId(name), label: `Portrait: ${name}`, placement: "Avatar everywhere this person appears", tool: "gemini", width: 384, height: 384, hue: 150,
  prompt: `Head-and-shoulders portrait photograph of ${who}, relaxed genuine smile, looking at the camera, in ${where} softly blurred behind. Natural window light, 85mm lens, shallow depth of field, square crop with the face centred. Photorealistic, true-to-life skin texture. No text, no logos, no watermark.`,
});

export const ART_SLOTS: ArtSlot[] = [
  // Landing and season
  photo("hero-golden-hour", "Landing hero", "Landing page hero, behind the membership card", "A young Gulf woman with long dark hair filming herself with a phone on a small tripod on a sunlit apartment balcony, massaging hair oil into her hair and laughing, an unlabelled green glass bottle on the table, city skyline behind.", 960, 1200),
  photo("season-summer-hair-rescue", "Season 1 banner", "Season card banner", "Close-up of wet curly dark hair being combed through with conditioner in a bright white bathroom, droplets catching the light."),
  photo("season-golden-hour", "Season 2 banner", "Season card banner", "A rooftop at golden hour in Dubai, a woman pouring honey from a jar into a glass of tea, long shadows and warm haze."),
  photo("season-winter-glow", "Season 3 banner", "Season card banner", "A cosy living room in Riyadh in soft winter light, hands holding a warm glass of milk beside a jar of herbal paste on a brass tray."),
  photo("circle-camp", "Circle Camp", "Circle Camp card", "A group of young creators laughing around a campfire in the Hajar mountains at dusk, phones and a small ring light nearby."),

  // Mission types
  mission("starter", "Starter mission cover", "Hands opening a delivery box lined with green tissue paper, revealing unlabelled bottles of hair oil and a jar of honey, phone propped up filming the unboxing."),
  mission("routine", "Routine mission cover", "A woman massaging oil into her scalp in front of a bathroom mirror, a small tripod and phone beside the sink, morning light."),
  mission("monthly", "Monthly challenge cover", "A phone on a tripod on a windowsill at golden hour filming a cup of honey tea and a small glass bottle, sun low over rooftops."),
  mission("team", "Team challenge cover", "Four friends in bathrobes with hair masks on, laughing together on a sofa and taking a group selfie."),
  mission("review", "Review mission cover", "A person on a sofa typing a product review on a phone, an unlabelled shampoo bottle and towel beside them."),
  mission("event", "Event mission cover", "A lively beauty pop-up stand inside a Dubai mall, a creator filming a hair treatment being applied under a ring light, small crowd watching."),
  mission("academy", "Academy mission cover", "A creator at a desk framing a vertical video on a phone tripod, notebook with storyboard sketches, plant in the corner."),
  mission("referral", "Referral mission cover", "Two friends leaning in over one phone and smiling, one pointing at the screen, cafe table in the background."),

  // Academy tracks
  track("craft", "Content craft cover", "A phone on a mini tripod catching window light, hands adjusting a small LED light, a notebook of storyboard squares."),
  track("growth", "Growth cover", "A creator looking at an analytics chart on a phone, coffee in hand, bright cafe background."),
  track("business", "Business of creating cover", "A tidy desk with a laptop, a printed media kit, a calculator and a pen signing a contract."),
  track("licensing", "Licensing and compliance cover", "Hands holding an official permit card next to a laptop, clean modern office desk."),
  track("wellbeing", "Wellbeing cover", "A person resting under a tree in a park with the phone face-down beside them, eyes closed, dappled light."),
  track("mentorship", "Mentorship cover", "Two people on facing chairs sharing a tablet showing a vertical video, one gesturing as they give feedback."),

  // The seed cast
  ...CAST.map(portrait),
];

export const slotById = (id: string): ArtSlot | undefined => ART_SLOTS.find((s) => s.id === id);
