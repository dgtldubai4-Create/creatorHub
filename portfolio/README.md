# Between the Frames — Photography Portfolio

A hand-crafted, single-page portfolio for an event / fashion / sports
photographer based in Dubai. No frameworks, no build step, no dependencies —
just `index.html`, `styles.css`, `script.js`, and one config file you edit.

## Add your photos (the only step that matters)

Open **`photos.js`**. Every image on the site comes from that file.

1. In Google Drive, right-click a photo → **Share** → set *General access*
   to **Anyone with the link**.
2. Copy the share link (`https://drive.google.com/file/d/FILE_ID/view?...`).
3. Paste it into the `drive` field of an entry in `photos.js`.

The site extracts the file ID and loads the image through Google's
high-resolution thumbnail endpoint (`drive.google.com/thumbnail?id=…&sz=w2000`),
which works for any publicly shared Drive file — no downloads, no re-uploading.

Until a frame has a link, it renders as an art-directed placeholder so the
layout always looks finished.

Also in `photos.js`: set your **name, email, WhatsApp, Instagram** in the
`SITE` object at the bottom.

## Preview locally

Open `index.html` in a browser — that's it. (Or `npx serve portfolio` if you
prefer a local server.)

## Deploy

Any static host works:

- **Vercel** — `npx vercel portfolio` or drag the folder into vercel.com/new
- **Netlify** — drag the `portfolio` folder into app.netlify.com/drop
- **GitHub Pages** — serve the `portfolio/` folder from your repo settings

## Design notes

- **Concept**: a photographer's contact sheet meets a fashion editorial —
  film-strip reel, frame numbers, darkroom palette with Dubai-dusk gold.
- **Type**: Fraunces (editorial serif) + Space Grotesk (technical sans),
  loaded from Google Fonts.
- **Interactions**: kinetic hero type, cursor-following image peek,
  drag-to-scroll film strip, filterable contact-sheet grid, full-screen
  lightbox with keyboard navigation, scroll-driven reveals, film grain.
- Fully responsive; honors `prefers-reduced-motion`.
