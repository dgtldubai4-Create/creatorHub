# Social assets

Posts pulled from Dabur's own Instagram and TikTok accounts live here: one image
file per post plus `posts.json`, which lists them. `npm run social` writes both.
The app reads this folder at build time; nothing is fetched while the app runs.

See the header of `scripts/import-social.ts` for the three ways to fill it.
