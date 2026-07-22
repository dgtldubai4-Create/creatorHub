/* ============================================================
   SITE CONFIG — every word, photo, color and list on the site.

   You rarely need to edit this file by hand: open the site with
   #admin at the end of the URL (e.g. index.html#admin) and use
   the editing panel. When you're happy, press "Export config.js"
   in the panel and replace this file with the downloaded one.

   PHOTOS — two ways, mix freely:

   A) WHOLE DRIVE FOLDERS (easiest — already set up below):
      share each folder as "Anyone with the link", paste the
      folder link, and every image inside loads automatically.
      This needs a free Google API key once — see README.md,
      section "Connect Google Drive" (5 minutes).

   B) SINGLE PHOTOS: right-click a photo in Drive → Share →
      "Anyone with the link", and paste the link into a photo's
      "drive" field in the photos list at the bottom.

   ARTISTS — give a folder (or photo) an "artist" name and it
   links to the Artists list: visitors click the artist's name
   to see only their frames.
   ============================================================ */

const CONFIG = {

  site: {
    name: "Your Name",
    tagline: "Event photographer — Dubai",
    email: "hello@example.com",
    whatsapp: "971500000000",        // digits only, for the wa.me link
    instagram: "yourhandle",         // without the @
    city: "Dubai, UAE",
  },

  /* ---- color scheme (edit per-token in the admin panel,
          or pick a preset there: Ivory, Gallery, Darkroom, Dusk) ---- */
  theme: {
    preset: "pastel",
    bg:      "#f7f6f2",   // cool gallery white
    bgSoft:  "#efeeea",
    ink:     "#24252a",   // cool charcoal
    ink2:    "#47484f",
    muted:   "#6f7076",
    line:    "#e1e1dc",
    accent:  "#96697f",   // dusty rose-mauve — pink, never brown
    accent2: "#c9a2b4",   // pastel pink
    mark:    "#b6465f",   // rose-red collector's dot
    reelBg:  "#17181d",
    reelInk: "#eceaf0",
  },

  /* ---- night mode (design C follows the visitor's system
          setting; these tokens are the after-dark palette) ---- */
  themeNight: {
    bg:      "#17181f",   // cool ink, not black
    bgSoft:  "#1f2029",
    ink:     "#eceaf0",
    ink2:    "#c3c1cc",
    muted:   "#8c8a96",
    line:    "#30313c",
    accent:  "#c9a2b4",   // pastel pink glows after dark
    accent2: "#a98bb8",   // lilac
    mark:    "#d3607a",
    reelBg:  "#101117",
    reelInk: "#eceaf0",
  },

  /* ---- the Curator — methodical best-image selection ----
     Every Drive photo is scored (metadata, filename forensics,
     and a pixel pass where the browser allows). The top picks
     hang in the reel; you can pin or hide any frame from the
     zoom view while in #admin mode. */
  curator: {
    perFolder: 3,          // how many top frames per folder join the reel
    pins: [],              // Drive file IDs you always want featured
    vetoes: [],            // Drive file IDs never to show
  },

  /* ---- gallery categories (the filter chips, in order) ---- */
  categories: [
    { key: "events",   label: "Events" },
    { key: "concerts", label: "Concerts" },
    { key: "comedy",   label: "Comedy" },
    { key: "sports",   label: "Sports" },
  ],

  /* ---- Google Drive folders — your galleries ----
     apiKey:   your free Google API key (README explains the
               5-minute setup). Until then placeholders show.
     artist:   type the performer/show name to link the folder's
               photos to the Artists list below.
     featured: how many photos from that folder go into the
               film-strip reel on the homepage. */
  drive: {
    apiKey: "",
    folders: [
      { link: "https://drive.google.com/drive/folders/1eQXXUinyqs1hZE5JcKvY_USPXaO9dH50", category: "comedy",   label: "Comedy show",  artist: "", year: "2025", featured: 1 },
      { link: "https://drive.google.com/drive/folders/15y2PAqoNo2vWeToYe_WkQ-9WNdV5gpBW", category: "comedy",   label: "Comedy show",  artist: "", year: "2025", featured: 1 },
      { link: "https://drive.google.com/drive/folders/1ztURSIDo-Eq5gNWYbjqH_e0yjGGDw3Rh", category: "concerts", label: "Live concert", artist: "", year: "2025", featured: 1 },
      { link: "https://drive.google.com/drive/folders/1RZ_DPFrNnrxtBWrOpdIBAeu0h_8HTznS", category: "concerts", label: "Live concert", artist: "", year: "2025", featured: 1 },
      { link: "https://drive.google.com/drive/folders/15_vXI0zPailEh653-csRBaL6W6_AWBCY", category: "concerts", label: "Live concert", artist: "", year: "2025", featured: 1 },
      { link: "https://drive.google.com/drive/folders/1tpDb4j3boeSQi5nm-P-s3YCf_wMagn_b", category: "concerts", label: "Live concert", artist: "", year: "2024", featured: 1 },
      { link: "https://drive.google.com/drive/folders/1HfsiVvwl79--3r6glNNQqb9J9AkdkUJk", category: "concerts", label: "Live concert", artist: "", year: "2024", featured: 0 },
      { link: "https://drive.google.com/drive/folders/1tf-2FyvfKvhy_bFHn0jyy-DpMvAV68OS", category: "concerts", label: "Live concert", artist: "", year: "2024", featured: 0 },
      { link: "https://drive.google.com/drive/folders/1EYtv2ndAhO5Yf5MTh7WllITPEwWvDmld", category: "concerts", label: "Live concert", artist: "", year: "2024", featured: 0 },
      { link: "https://drive.google.com/drive/folders/1tKrE840f3k9F8SViR3TK-HJ65y_ecs8u", category: "concerts", label: "Live concert", artist: "", year: "2024", featured: 0 },
    ],
  },

  hero: {
    eyebrow: "Event photography · Dubai",
    lineStart: "Your",
    rotator: ["event", "concert", "gala", "comedy night"],
    lineEnd: "remembered as it felt.",
    note: "…and pulling it is my favourite part",
    sub: "I photograph live events across Dubai — concerts, galas, launches and comedy nights — with a quiet, documentary approach. No interruptions, no stiff line-ups; just an honest record of the night.",
  },

  about: {
    heading: "Hello — it's lovely to meet you.",
    paragraphs: [
      "I'm an event photographer based in Dubai. Most weeks you'll find me side-stage or in the pit — at concerts, galas and comedy nights, the kind of evenings that pass in a blur for everyone involved, which is exactly why the photographs matter.",
      "Clients often tell me guests and performers relax more quickly with a woman behind the camera. For women-only gatherings and behind-the-scenes moments, that comfort isn't a bonus — it's the whole job. And when the brief moves to a finish line or a keynote stage, the same instinct applies: find the honest frame.",
    ],
    quote: "My favourite photographs are the ones nobody remembers being taken.",
    statement: "Half my job is light. The other half is trust.",
    portraitCaption: "usually the one behind the camera",
  },

  stats: [
    { number: "300+", label: "events covered" },
    { number: "8",    label: "years in Dubai" },
    { number: "48h",  label: "gallery delivery" },
    { number: "70%",  label: "repeat clients" },
  ],

  /* ---- artists & venues — EXAMPLES below, replace with your own
          real names in the admin panel before publishing.
          An artist whose name matches photos (via the "artist"
          field on folders or photos) becomes clickable. ---- */
  credits: {
    heading: "Artists & stages",
    sub: "The performers and rooms that have trusted me with their nights — click an artist to see their frames.",
    artistsTitle: "Artists & performers",
    artists: [
      { name: "Arena headliner",       note: "international tour stop" },
      { name: "The stand-up special",  note: "comedy night" },
      { name: "Festival main stage",   note: "DJ sets & live acts" },
      { name: "Symphony gala",         note: "orchestra night" },
    ],
    venuesTitle: "Venues & stages",
    venues: [
      "Coca-Cola Arena",
      "Dubai Opera",
      "The Agenda, Dubai Media City",
      "Zabeel Theatre",
      "Madinat Jumeirah",
      "Expo City Dubai",
      "DIFC Gate Village",
    ],
  },

  ticker: ["Concerts", "Galas", "Award nights", "Conferences", "Comedy nights", "Brand launches", "Weddings", "Sports"],

  process: {
    heading: "How it works",
    steps: [
      {
        title: "We talk, briefly.",
        text: "A call or a WhatsApp voice note. You tell me the occasion, the venue and what matters most; I tell you exactly how I'd cover it — and what it costs, with no surprises.",
      },
      {
        title: "I blend into your event.",
        text: "Quiet shoes, two cameras, natural light wherever the room allows. Your guests won't be asked to perform — the best photographs happen when nobody is posing.",
      },
      {
        title: "Your gallery, quickly.",
        text: "A same-night selection for your socials, and the full edited gallery within 48 hours as a private link you can share with everyone who was there.",
      },
    ],
  },

  /* ---- kind words — EXAMPLES, replace with real ones ---- */
  testimonials: [
    { quote: "She was everywhere and nowhere — we never noticed her working, and somehow she caught everything.", name: "Events manager", role: "arena show" },
    { quote: "The same-night selection saved our social team. The full gallery arrived before the venue invoice did.", name: "Brand producer", role: "product launch" },
    { quote: "Guests keep asking who took the photos. That's the review.", name: "Private client", role: "gala dinner" },
  ],

  contact: {
    eyebrow: "Currently booking",
    titleLine1: "Planning something?",
    titleLine2: "I'd love to hear about it.",
    note: "Replies within a day — usually much faster.",
  },

  footer: {
    tag: "Dubai, UAE — happy to travel for good light",
    rights: "All photographs are mine. Please ask before using them.",
  },

  /* ---- individually-added photographs ----
     These render alongside the Drive folders above. Entries with
     no link act as placeholders and step aside automatically once
     a folder fills their category. The "artist" field links a
     photo to the Artists list. */
  photos: [
    { drive: "", src: "", title: "Golden-hour arrivals — private gala", category: "events",   artist: "",                     year: "2025", wide: true,  featured: true,  note: "shot barefoot — heels off at hour six" },
    { drive: "", src: "", title: "Confetti, mid-air",                   category: "events",   artist: "",                     year: "2025", wide: false, featured: true  },
    { drive: "", src: "", title: "The quiet minute before doors open",  category: "events",   artist: "",                     year: "2024", wide: false, featured: false },
    { drive: "", src: "", title: "Encore, from the pit",                category: "concerts", artist: "Arena headliner",      year: "2025", wide: false, featured: true,  note: "ears rang for two days. worth it." },
    { drive: "", src: "", title: "Crowd under the lights",              category: "concerts", artist: "Arena headliner",      year: "2024", wide: true,  featured: true  },
    { drive: "", src: "", title: "Strings, half a beat before",         category: "concerts", artist: "Symphony gala",        year: "2024", wide: false, featured: false },
    { drive: "", src: "", title: "Main stage, blue hour",               category: "concerts", artist: "Festival main stage",  year: "2025", wide: false, featured: true  },
    { drive: "", src: "", title: "Headliner, mid-punchline",            category: "comedy",   artist: "The stand-up special", year: "2025", wide: true,  featured: true,  note: "the lights did this, not me" },
    { drive: "", src: "", title: "Front row, mid-laugh",                category: "comedy",   artist: "The stand-up special", year: "2025", wide: false, featured: false },
    { drive: "", src: "", title: "The finish line, 1/2000s",            category: "sports",   artist: "",                     year: "2025", wide: false, featured: false },
    { drive: "", src: "", title: "Dust and horsepower — desert rally",  category: "sports",   artist: "",                     year: "2024", wide: true,  featured: false },
  ],
};
