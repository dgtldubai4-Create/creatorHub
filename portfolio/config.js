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
    preset: "ivory",
    bg:      "#f5f0e6",   // page background
    bgSoft:  "#ebe4d3",   // alternate section background
    ink:     "#231d14",   // main text
    muted:   "#7e7460",   // secondary text
    line:    "#d8cfba",   // hairlines & borders
    accent:  "#96662e",   // links, highlights, italic words
    accent2: "#b98a4e",   // lighter accent (tags, hovers)
    mark:    "#c4442a",   // grease-pencil hover mark
    reelBg:  "#171310",   // the dark film-strip band
    reelInk: "#efe8da",   // text on the film strip
  },

  /* ---- gallery categories (the filter chips, in order) ---- */
  categories: [
    { key: "comedy",   label: "Comedy shows" },
    { key: "concerts", label: "Concerts" },
    { key: "events",   label: "Events" },
    { key: "fashion",  label: "Fashion" },
    { key: "sports",   label: "Sports" },
  ],

  /* ---- Google Drive folders — your galleries ----
     apiKey: paste your free Google API key here (README explains
     how to get one in ~5 minutes). Until then the site shows
     placeholder frames, and single-photo links still work.
     featured: how many photos from that folder go into the
     film-strip reel on the homepage. */
  drive: {
    apiKey: "",
    folders: [
      { link: "https://drive.google.com/drive/folders/1eQXXUinyqs1hZE5JcKvY_USPXaO9dH50", category: "comedy",   label: "Comedy show",  year: "2025", featured: 2 },
      { link: "https://drive.google.com/drive/folders/15y2PAqoNo2vWeToYe_WkQ-9WNdV5gpBW", category: "comedy",   label: "Comedy show",  year: "2025", featured: 1 },
      { link: "https://drive.google.com/drive/folders/1ztURSIDo-Eq5gNWYbjqH_e0yjGGDw3Rh", category: "concerts", label: "Live concert", year: "2025", featured: 1 },
      { link: "https://drive.google.com/drive/folders/1RZ_DPFrNnrxtBWrOpdIBAeu0h_8HTznS", category: "concerts", label: "Live concert", year: "2025", featured: 1 },
      { link: "https://drive.google.com/drive/folders/15_vXI0zPailEh653-csRBaL6W6_AWBCY", category: "concerts", label: "Live concert", year: "2025", featured: 1 },
      { link: "https://drive.google.com/drive/folders/1tpDb4j3boeSQi5nm-P-s3YCf_wMagn_b", category: "concerts", label: "Live concert", year: "2024", featured: 1 },
      { link: "https://drive.google.com/drive/folders/1HfsiVvwl79--3r6glNNQqb9J9AkdkUJk", category: "concerts", label: "Live concert", year: "2024", featured: 0 },
      { link: "https://drive.google.com/drive/folders/1tf-2FyvfKvhy_bFHn0jyy-DpMvAV68OS", category: "concerts", label: "Live concert", year: "2024", featured: 0 },
      { link: "https://drive.google.com/drive/folders/1EYtv2ndAhO5Yf5MTh7WllITPEwWvDmld", category: "concerts", label: "Live concert", year: "2024", featured: 0 },
      { link: "https://drive.google.com/drive/folders/1tKrE840f3k9F8SViR3TK-HJ65y_ecs8u", category: "concerts", label: "Live concert", year: "2024", featured: 0 },
    ],
  },

  hero: {
    eyebrow: "Event photography · Dubai",
    lineStart: "Your",
    rotator: ["comedy night", "concert", "gala", "conference"],
    lineEnd: "remembered as it felt.",
    sub: "I photograph live events across Dubai — comedy shows, concerts, galas and launches — with a quiet, documentary approach. No interruptions, no stiff line-ups; just an honest record of the night.",
  },

  about: {
    heading: "Hello — it's lovely to meet you.",
    paragraphs: [
      "I'm an event photographer based in Dubai. Most weeks you'll find me side-stage at a comedy night or in the pit at a concert — the kind of evenings that pass in a blur for everyone involved, which is exactly why the photographs matter.",
      "Clients often tell me guests and performers relax more quickly with a woman behind the camera. For women-only gatherings and behind-the-scenes moments, that comfort isn't a bonus — it's the whole job. And when the brief moves to a runway or a finish line, the same instinct applies: find the honest frame.",
    ],
    quote: "My favourite photographs are the ones nobody remembers being taken.",
    portraitCaption: "usually the one behind the camera",
  },

  stats: [
    { number: "300+", label: "events covered" },
    { number: "8",    label: "years in Dubai" },
    { number: "48h",  label: "gallery delivery" },
    { number: "70%",  label: "repeat clients" },
  ],

  /* ---- venues & artists — EXAMPLES below, replace with your own
          real list in the admin panel before publishing ---- */
  credits: {
    heading: "Rooms I've worked",
    sub: "A few of the venues and stages that have trusted me with their evenings.",
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
    artistsTitle: "Artists & performers",
    artists: [
      "Touring stand-up headliners",
      "International music acts",
      "Regional comedy collectives",
      "Festival main-stage DJs",
      "Symphony orchestra — gala night",
      "Spoken-word & poetry nights",
    ],
  },

  ticker: ["Comedy nights", "Concerts", "Galas", "Conferences", "Award nights", "Brand launches", "Fashion", "Sports"],

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
     a folder fills their category. */
  photos: [
    { drive: "", src: "", title: "Headliner, mid-punchline",            category: "comedy",   year: "2025", wide: true,  featured: true  },
    { drive: "", src: "", title: "Front row, mid-laugh",                category: "comedy",   year: "2025", wide: false, featured: true  },
    { drive: "", src: "", title: "Encore, from the pit",                category: "concerts", year: "2025", wide: false, featured: true  },
    { drive: "", src: "", title: "Crowd under the lights",              category: "concerts", year: "2024", wide: true,  featured: true  },
    { drive: "", src: "", title: "Golden-hour arrivals — private gala", category: "events",   year: "2025", wide: false, featured: true  },
    { drive: "", src: "", title: "Confetti, mid-air",                   category: "events",   year: "2025", wide: false, featured: false },
    { drive: "", src: "", title: "Silk against sandstone — Alserkal",   category: "fashion",  year: "2025", wide: false, featured: true  },
    { drive: "", src: "", title: "Backstage, three minutes to call",    category: "fashion",  year: "2024", wide: false, featured: false },
    { drive: "", src: "", title: "The finish line, 1/2000s",            category: "sports",   year: "2025", wide: false, featured: false },
    { drive: "", src: "", title: "Dust and horsepower — desert rally",  category: "sports",   year: "2024", wide: true,  featured: false },
  ],
};
