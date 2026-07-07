# Between the Frames — Photography Portfolio

A hand-crafted portfolio for an event photographer in Dubai (concerts,
galas, comedy nights, sports). No frameworks, no build step, one shared
config file — and **two complete designs**:

| | Design A — “The Contact Sheet” | Design B — “The Print Room” |
|---|---|---|
| File | `index.html` | `b.html` |
| Feel | editorial contact-sheet, filterable grid | museum hang, one print per wall, exhibitions |
| Artists | click a name → filtered grid | click a name → walk into their room |

Both read the same `config.js`, share the same saved edits, and have the
same admin panel — edit once, both designs update. Deploy whichever you
prefer as your homepage (rename it `index.html`), or keep both.

## Edit everything with the admin panel

Open the site with `#admin` at the end of the URL:

```
index.html#admin          (locally)
https://your-site.com/#admin   (once deployed)
```

An **"✎ Edit site"** button appears. It opens a panel where you can change
every detail — your name and contact links, all headlines and paragraphs,
the venues & artists lists, stats, photos, Drive folders, and the whole
color scheme (four presets plus per-color pickers). Changes apply live
and are remembered in your browser.

**To publish your edits**: press **Export config.js** in the panel and
replace the `config.js` file in this folder with the downloaded one
(then redeploy / re-upload). That's the whole publishing step.

## Connect Google Drive (one-time, ~5 minutes)

Your galleries are Drive folders — the site loads every image in the
folders listed in `config.js` automatically. Google requires a free API
key for folder listing:

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and
   sign in with the Google account of your choice (any account works —
   the key only reads *publicly shared* files).
2. Create a project (top bar → "New project", any name).
3. Menu → **APIs & Services → Library** → search **Google Drive API** → Enable.
4. Menu → **APIs & Services → Credentials** → **Create credentials → API key**.
5. Recommended: click the key → under "API restrictions" choose
   **Restrict key → Google Drive API**; under "Website restrictions" add
   your site's domain once deployed.
6. Paste the key into the admin panel → "Google Drive galleries" →
   **Google API key** (or into `drive.apiKey` in `config.js`).

Make sure each folder is shared as **"Anyone with the link"** (right-click
folder in Drive → Share → General access). Individual photos can also be
added one at a time in the admin panel's Photos section — those don't
need the API key, just a share link.

Until photos are connected, frames show art-directed placeholders so the
layout always looks finished.

## Preview locally

Open `index.html` in a browser — that's it. (Or `npx serve portfolio`.)

## Deploy

Any static host:

- **Vercel** — `npx vercel portfolio` or drag the folder into vercel.com/new
- **Netlify** — drag the `portfolio` folder into app.netlify.com/drop
- **GitHub Pages** — serve the `portfolio/` folder from repo settings

## Design notes

- **Concept**: a photographer's contact sheet meets a quiet editorial —
  ivory gallery base, one dark film-strip band, grease-pencil hover marks,
  frame numbers as wayfinding.
- **Type**: Fraunces (editorial serif) + Space Grotesk (technical sans).
- **Interactions**: rotating headline word, cursor-following photo peek,
  drag-to-scroll film strip, filterable contact sheet, keyboard-navigable
  lightbox, counter preloader, live Dubai clock, film grain.
- Fully responsive; honors `prefers-reduced-motion`.
