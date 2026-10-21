/**
 * Every generated-art slot in the interface. `scripts/generate-art.ts` reads this file,
 * calls Recraft (vector and illustration work) or a Hugging Face image model (photographic
 * hero and season imagery), and writes `src/art/generated/<id>.<ext>`. The `ArtSlot`
 * component picks the file up automatically and shows a labelled placeholder until then.
 *
 * Palette words used in prompts: forest green #0f5a33, leaf green #178a47, marigold #f2b33d,
 * mist #f2f6f0. Style: warm, playful, hand-drawn energy, no text, no logos.
 */
export type ArtTool = "recraft" | "hf";

export interface ArtSlot {
  id: string;
  label: string;
  /** Where it appears, so the prompt and crop make sense. */
  placement: string;
  tool: ArtTool;
  /** Recraft style id, or ignored for Hugging Face. */
  style?: "vector_illustration" | "digital_illustration" | "icon" | "realistic_image";
  /** Recraft substyle, optional. */
  substyle?: string;
  width: number;
  height: number;
  prompt: string;
  /** Hue used by the placeholder tile. */
  hue: number;
}

const PALETTE = "palette: forest green, leaf green, marigold yellow, soft mist background; warm, playful, friendly; no text, no letters, no logos, no watermark";

const level = (id: string, label: string, prompt: string, hue: number): ArtSlot => ({
  id: `level-${id}`, label, placement: "Level emblem on the creator home, season page and profile", tool: "recraft", style: "vector_illustration", width: 1024, height: 1024, hue,
  prompt: `Flat vector emblem of ${prompt}, centered on a plain soft mist background, rounded shapes, two-tone green with a marigold accent, sticker style with a thin white outline, ${PALETTE}`,
});

const mission = (id: string, label: string, prompt: string, hue: number): ArtSlot => ({
  id: `mission-${id}`, label, placement: "Mission card header and mission detail hero", tool: "recraft", style: "digital_illustration", substyle: "hand_drawn", width: 1365, height: 1024, hue,
  prompt: `Playful hand-drawn illustration: ${prompt}. Generous negative space on the left third for UI text. ${PALETTE}`,
});

const track = (id: string, label: string, prompt: string, hue: number): ArtSlot => ({
  id: `track-${id}`, label, placement: "Academy track cover", tool: "recraft", style: "digital_illustration", substyle: "grain", width: 1365, height: 1024, hue,
  prompt: `Editorial illustration with soft grain: ${prompt}. Calm composition, one focal object, lots of breathing room. ${PALETTE}`,
});

const badge = (id: string, label: string, prompt: string, hue: number): ArtSlot => ({
  id: `badge-${id}`, label, placement: "Badge tile on the creator home", tool: "recraft", style: "icon", width: 1024, height: 1024, hue,
  prompt: `Single flat icon of ${prompt}, chunky rounded strokes, two colours (leaf green and marigold) on transparent background, ${PALETTE}`,
});

const photo = (id: string, label: string, placement: string, prompt: string, hue: number, width = 1344, height = 768): ArtSlot => ({
  id, label, placement, tool: "hf", width, height, hue,
  prompt: `${prompt} Natural light, warm tones, shot on 35mm, candid, Gulf region setting, no visible text or brand logos, no watermark.`,
});

export const ART_SLOTS: ArtSlot[] = [
  // Level emblems
  level("member", "Member emblem", "a single sprouting seed in a small mound of earth", 140),
  level("insider", "Insider emblem", "a young plant with three leaves and a tiny marigold bud", 150),
  level("pro", "Pro emblem", "a blooming marigold flower with layered petals", 45),
  level("ambassador", "Ambassador emblem", "a broad banyan tree with hanging roots and a golden crown of leaves", 160),

  // Mission types
  mission("starter", "Starter mission art", "a cardboard welcome box bursting open with green leaves, a small bottle of hair oil and confetti", 150),
  mission("routine", "Routine mission art", "a calendar page with a thirty-day loop drawn around it, a hair oil bottle and a comb", 140),
  mission("monthly", "Monthly challenge art", "a sun low over rooftops, golden hour light, a cup of honey tea on a windowsill", 40),
  mission("team", "Team challenge art", "four hands of different skin tones holding up one big hair mask jar together", 170),
  mission("review", "Review mission art", "a smartphone showing five hand-drawn stars next to a shampoo bottle", 200),
  mission("event", "Event mission art", "a pop-up stand with a striped awning, ring light and a crowd of small happy figures", 20),
  mission("academy", "Academy mission art", "a graduation cap resting on a phone tripod with a tiny plant growing out of it", 150),
  mission("referral", "Referral mission art", "two paper planes flying in a loop between two smiling faces", 60),

  // Academy tracks
  track("craft", "Content craft cover", "a phone on a mini tripod catching window light, with a notebook of storyboard squares", 150),
  track("growth", "Growth cover", "a potted plant whose leaves form a rising chart line", 140),
  track("business", "Business of creating cover", "a tidy desk with a media kit folder, a calculator and a signed contract with a leaf paperclip", 45),
  track("licensing", "Licensing and compliance cover", "an official stamp coming down on a certificate, with a small green checkmark", 200),
  track("wellbeing", "Wellbeing cover", "a person resting under a tree with the phone face-down beside them", 170),
  track("mentorship", "Mentorship cover", "two chairs facing each other with a shared tablet between them showing a reel", 60),

  // Badges
  badge("first-shoot", "First Shoot badge", "a sparkle over a film clapperboard", 150),
  badge("regular", "Regular badge", "three looping arrows in a circle", 140),
  badge("mission-one", "Mission One badge", "a compass rose", 160),
  badge("three-in-a-row", "Three in a Row badge", "a small flame with three tongues", 30),
  badge("fully-verified", "Fully Verified badge", "a wax seal with a checkmark", 150),
  badge("live", "Live badge", "a broadcast tower emitting two arcs", 200),
  badge("five-live", "Five Live badge", "a burst of confetti", 45),
  badge("one-take", "One Take badge", "a target with one arrow in the centre", 0),
  badge("early-bird", "Early Bird badge", "a sun rising over a horizon line", 40),
  badge("paid-pro", "Paid Pro badge", "two stacked coins with a leaf", 45),
  badge("academy-graduate", "Academy Graduate badge", "a graduation cap with a tassel", 150),
  badge("crowd-favourite", "Crowd Favourite badge", "a star held up by two small hands", 45),
  badge("squad-player", "Squad Player badge", "three overlapping circles like a team huddle", 170),
  badge("talent-scout", "Talent Scout badge", "a handshake with a sparkle", 60),

  // Photography
  photo("hero-golden-hour", "Entry hero photo", "Entry page hero, right column", "A young Gulf woman filming herself with a phone on a small tripod on a sunlit apartment balcony, hair oil bottle on the table, laughing mid-take.", 40, 1024, 1280),
  photo("season-summer-hair-rescue", "Season 1 banner", "Season page banner (past season)", "Close-up of wet curly hair being combed in a bright white bathroom, droplets catching light.", 150),
  photo("season-golden-hour", "Season 2 banner", "Season page banner (current season)", "A rooftop at golden hour in Dubai, a woman pouring honey into tea, long shadows, warm haze.", 40),
  photo("season-winter-glow", "Season 3 banner", "Season page banner (upcoming season)", "A cosy living room in Riyadh in winter light, a jar of herbal paste and a warm glass of milk on a tray.", 20),
  photo("join-welcome", "Join page welcome photo", "Join flow, final step", "A doorstep delivery box with green tissue paper and small bottles, a hand reaching in, morning light.", 150, 1024, 1024),
  photo("circle-camp", "Circle Camp photo", "Season page, Circle Camp card", "A group of young creators laughing around a campfire in the Hajar mountains at dusk, phones and a ring light nearby.", 30),
  photo("academy-hero", "Academy hero photo", "Academy page header", "Over-the-shoulder view of a creator editing a vertical video on a phone at a café table, notebook with hand-drawn storyboard.", 150),
];

export const slotById = (id: string): ArtSlot | undefined => ART_SLOTS.find((s) => s.id === id);
