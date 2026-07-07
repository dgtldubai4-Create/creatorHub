/* ============================================================
   YOUR PHOTOS LIVE HERE — this is the only file you need to edit.

   HOW TO ADD A PHOTO FROM GOOGLE DRIVE (3 steps):

   1. In Google Drive, right-click the photo → Share →
      set "General access" to "Anyone with the link".
   2. Copy the link. It looks like:
      https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing
   3. Paste the whole link into the `drive` field below.
      The site extracts the file ID automatically and loads the
      image at high resolution.

   You can also use a direct image URL in the `src` field instead
   (from your own hosting, Dropbox, etc). If both `drive` and `src`
   are empty, an art-directed placeholder frame is shown so the
   layout always looks intentional while you fill it in.

   FIELDS:
     drive    → paste a Google Drive share link (easiest)
     src      → OR a direct image URL
     title    → shown in the lightbox and on hover
     category → "events" | "fashion" | "sports" | "portrait"
     year     → shown as frame metadata
     wide     → true makes the frame span 2 columns (use for
                landscape/crowd shots to break the grid rhythm)
     featured → true puts it in the horizontal film-strip reel
                on the homepage (pick your 6–8 strongest images)
   ============================================================ */

const PHOTOS = [
  // ---------- EVENTS (your main body of work) ----------
  {
    drive: "",
    src: "",
    title: "Golden hour arrivals — private gala, DIFC",
    category: "events",
    year: "2025",
    wide: true,
    featured: true,
  },
  {
    drive: "",
    src: "",
    title: "First dance, unscripted",
    category: "events",
    year: "2025",
    featured: true,
  },
  {
    drive: "",
    src: "",
    title: "Speaker in full flight — GITEX keynote",
    category: "events",
    year: "2024",
  },
  {
    drive: "",
    src: "",
    title: "Confetti, mid-air",
    category: "events",
    year: "2025",
    featured: true,
  },
  {
    drive: "",
    src: "",
    title: "The quiet moment before doors open",
    category: "events",
    year: "2024",
    wide: true,
  },
  {
    drive: "",
    src: "",
    title: "Laughter at table twelve",
    category: "events",
    year: "2025",
  },

  // ---------- FASHION ----------
  {
    drive: "",
    src: "",
    title: "Silk against sandstone — Alserkal Avenue",
    category: "fashion",
    year: "2025",
    featured: true,
  },
  {
    drive: "",
    src: "",
    title: "Backstage, three minutes to call",
    category: "fashion",
    year: "2024",
  },
  {
    drive: "",
    src: "",
    title: "Editorial for a Dubai atelier",
    category: "fashion",
    year: "2025",
    wide: true,
    featured: true,
  },
  {
    drive: "",
    src: "",
    title: "Movement study in chiffon",
    category: "fashion",
    year: "2024",
  },

  // ---------- SPORTS ----------
  {
    drive: "",
    src: "",
    title: "The finish line, 1/2000s",
    category: "sports",
    year: "2025",
    featured: true,
  },
  {
    drive: "",
    src: "",
    title: "Dust and horsepower — desert rally",
    category: "sports",
    year: "2024",
    wide: true,
  },
  {
    drive: "",
    src: "",
    title: "Padel under floodlights",
    category: "sports",
    year: "2025",
  },

  // ---------- PORTRAIT / OTHER ----------
  {
    drive: "",
    src: "",
    title: "Founder portrait series",
    category: "portrait",
    year: "2025",
  },
  {
    drive: "",
    src: "",
    title: "Window light, no retouching",
    category: "portrait",
    year: "2024",
  },
];

/* ------------------------------------------------------------
   SITE SETTINGS — name, contact details, socials, stats.
   ------------------------------------------------------------ */
const SITE = {
  name: "Your Name",              // e.g. "Aisha Rahman"
  tagline: "Event · Fashion · Sports photographer, Dubai",
  email: "hello@example.com",
  phone: "+971 50 000 0000",      // shown on the contact panel
  whatsapp: "971500000000",       // digits only, for the wa.me link
  instagram: "yourhandle",        // without the @
  city: "Dubai, UAE",
  // Shown in the "by the numbers" strip — edit freely
  stats: [
    { number: "300+", label: "events covered" },
    { number: "8",    label: "years behind the lens" },
    { number: "48h",  label: "typical delivery" },
    { number: "∞",    label: "moments kept" },
  ],
};
