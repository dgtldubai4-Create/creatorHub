# Dabur Squad

The always-on creator community for Dabur across six GCC markets (UAE, KSA, Kuwait,
Qatar, Oman, Bahrain). One codebase, two seats behind one sign-in.

- **Creator seat**: a mission board (starter, routine, monthly, team, review, event,
  Academy and referral missions), campaign journeys with kits and timestamped feedback,
  Sparks and levels that reset every season, a leaderboard and the Ambassador round,
  the Creator Academy with six tracks, mentoring and certificates, rewards and a ledger.
- **Brand-team seat**: campaigns and match-scored shortlists, the mission builder and
  mission-post review, seasons and Ambassador selection, Academy progress, creator
  directory with verification, the cut-review player, logistics, loyalty, and the
  read-only product catalogue.

Bilingual English and Arabic, LTR and RTL, with language as global state.

Everything runs in the browser. There is no backend, no network call at runtime and no
payment. State persists to browser storage and rehydrates on boot.

## Run it

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # production bundle in dist/
npm run build:single   # one self-contained HTML file in dist-single/index.html
npm test               # domain tests (stage machine, permissions, simulation, reducer, seed)
npm run typecheck
```

The single-file build inlines JavaScript, CSS and both variable fonts, and switches to
hash routing so it opens from disk for offline review.

## Demo seats

Pick a seat at `/login`. No passwords.

| Seat | Sign in as | What you can do |
| --- | --- | --- |
| Creator | any of the 24 seeded creators | Layla Al Mansoori is a Pro with data at most stages; Zahra Al Lawati is a new Member |
| Brand team | Super Admin | all six permissions |
| Brand team | Brand Manager | campaigns, invite, review, products |
| Brand team | Campaign Manager | campaigns, invite, review |
| Brand team | Content Reviewer | review |
| Brand team | Logistics | logistics |
| Brand team | Finance | loyalty |

Switch seat or role from the top bar; the whole seat re-scopes. "Reset demo data" in
the avatar menu wipes browser storage and reloads the seed.

## Where things live

```
src/domain/       types, stage machine, permissions, reducer, seed, simulations, selectors, persistence
src/data/         catalogue.json (product catalogue, read-only in the app)
src/i18n/         every UI string in English and Arabic
src/app/          store provider, router, seat shells
src/ui/           primitives, motion helpers, the journey trail, product art
src/screens/      public, creator and admin screens
scripts/          sync-products.ts
tests/            vitest suites for the domain layer
```

### The program loop

- **Missions** (`src/domain/types.ts`, `Mission`) carry type, Sparks, window, market,
  language, niche and level filters, required hashtags, optional squads, a surprise-drop
  deadline and per-creator entries. `missionsFor` filters the board; `missionCheck` runs
  the hashtag, disclosure and timing pre-check on every submission; `reviewMission`
  approves or asks for changes and writes Sparks to the ledger (doubled during a drop).
- **Levels** are derived, never stored: `level()` combines season Sparks, a quality
  score (approved share of reviewed cuts and posts blended with auto-check scores), a
  short list of named tasks per level, and the current season's Ambassador cohort.
- **Seasons** hold the Ambassador round: `advanceSeason` opens wildcards then voting
  (pulling the top Pros onto the shortlist), creators `enterWildcard` and
  `voteAmbassador` once each, and `selectAmbassadors` confirms the cohort.
- **Streaks** are monthly and computed from the ledger; the first Sparks-earning action
  in a month after an active month adds a streak bonus entry.
- **Academy** tracks gate on level; completing every module in a track issues a
  certificate and Sparks. Mentoring sessions have seats and level gates.

### Program rules

Every rule a creator can read on the "How Sparks work" page lives in
`src/domain/policy.ts`, and the reducer pays from the same constants, so the published
table cannot drift from what the approve button does.

- **Reach-weighted Sparks.** `quoteSparks` multiplies a mission's base Sparks by format
  (video, post, story), reach band (followers on the platform the post went out on),
  engagement band and brand mix (two or more Dabur brands), rounds to 5, and doubles
  during a surprise drop. Every multiplier has a floor of 1, so a small account never
  earns below base. Referrals and retailer reviews are paid flat. The working is stored
  with each award (`entry.award`, `participation.award`) and shown to the creator and
  the reviewer. Stories only count when a mission lists the format.
- **Next-level checklist.** `LEVEL_TASKS` names what each level needs on top of Sparks
  and quality: Insider wants a starter mission and one monthly or team challenge this
  season; Pro wants a completed campaign journey, an Academy certificate and, in the
  UAE and KSA, a verified creator licence. `levelTasks` returns the list with progress
  and a link for each item; `level()` enforces it.
- **Level kits.** The first time a creator reaches Insider, Pro or Ambassador a kit is
  unlocked (`settleKits`, run after every level-changing action). The creator claims it
  with `claimLevelKit`, logistics moves it with `advanceKitShipment`, and delivery opens
  that level's unboxing mission. One kit per level, ever.
- **Posts stay live.** `recheckPosts` is the 30-day job: it re-checks every approved
  post past the mark (`postLiveCheck`, simulated) and, when one is gone, appends a
  negative `clawback` ledger entry. The ledger stays append-only; season Sparks and the
  level checklist both net clawbacks out.
- **Sparks expiry.** Balances lapse after 365 days with no earning and no spending.
  `expireSparks` warns once inside the last 30 days, then appends an `expiry` entry.
  Any earn or spend resets the clock (`sparksExpiry`).
- **Squad charter.** Six commitments, versioned. `registerCreator` refuses an
  application that has not accepted them, and acceptance is stored on the creator.
- **Mission drops.** Setting a mission live notifies every creator who can see it.

The design reasoning behind these, and the comparison with L'Oréal's LOREALISTAR
programme they came from, is in `docs/lorealistar-teardown.md`.

### Installable app

The hosted build is a progressive web app: `public/manifest.webmanifest`, icons and
`public/sw.js` (an offline shell cache). `src/app/pwa.tsx` injects the manifest and
registers the worker at boot, offers the install prompt on the profile page, and raises
device notifications for mission drops and Sparks while the app is open. There is no
push server, so that card is labelled Simulated. The single-file build skips all of it
and still makes no network requests.

### The journey state machine

`src/domain/stages.ts` holds the one ordered stage list. Every participation sits at
exactly one stage and only moves along an explicit edge; `canTransition` refuses skips
and regressions, and the `changes_requested -> revised_cut -> manual_review` loop is the
only edge that points back. Every move appends to an immutable stage log with a
timestamp, and the log drives every progress display (the trail, phase strips, funnels).
Points are written to the ledger exactly once, at `points_released`, only after
`post_verified`.

### Reducer and actions

`src/domain/reducer.ts` is one reducer over one state object with a typed action union
(`respondInvite`, `upload`, `review`, `publish`, `verifyPost`, `releasePoints`,
`advanceShipment`, `joinQuest`, `redeem`, `invite`, `saveCampaign`, `registerCreator`
and more). Brand-team mutations check `can(role, permission)`; creator mutations check
the signed-in creator. `safeReducer` turns thrown errors into a transient `lastError`
that the UI surfaces as a toast.

### Simulated services

Everything external is simulated in-process and labelled "Simulated" in the interface:

- **Automated content check**: hashes `filename:size:version` (FNV-1a) into bit fields and
  evaluates the campaign's acceptance criteria into a weighted 0-100 score with a note
  per check. Same input, same result. Each new version adds an independent chance per
  check, so the revise loop converges.
- **Courier tracking**: status advances on command with generated tracking numbers per courier.
- **Identity and social verification**: state transitions only.
- **Email and push**: written to the notification log, never sent.
- **Post link check**: `postLiveCheck` stands in for fetching a post 30 days on. A link
  containing "deleted" or "removed" is gone, as is roughly one in ten others by hash.

## Product catalogue

`src/data/catalogue.json` is treated as read-only by the app. It ships with a starter
catalogue of 29 Dabur UAE products flagged `pendingSync: true` (the admin Products
screen shows a "Pending sync" chip on each).

```bash
npm run sync:products                          # crawl daburinternational.com/uae
npm run sync:products -- --from saved-page.html   # parse a saved product page offline
```

The script reads schema.org Product JSON-LD first and falls back to Open Graph and
headings. It copies text verbatim, leaves fields the page does not expose empty, and
writes product image URLs into `image`. It could not be run from the build sandbox
because outbound access to the Dabur site was blocked there; run it locally, then
commit the regenerated JSON.

## Generated art

Every illustration slot in the interface is listed in `src/art/manifest.ts` with its
placement, prompt, size and provider. Until a file exists the `ArtSlot` component shows
a labelled tile in the slot's hue, so nothing pretends to be art that is not there.

```bash
RECRAFT_API_KEY=... HF_TOKEN=... npm run art          # all 42 slots
npm run art -- --only level-pro,mission-team         # a subset
npm run art -- --tool hf                             # one provider
npm run art -- --dry-run                             # print the plan
```

Recraft handles the vector and illustration work (level emblems, mission art, Academy
covers, badge icons). A Hugging Face image model (FLUX.1-schnell by default, override
with `HF_MODEL`) handles photographic hero and season imagery. Output lands in
`src/art/generated/` and is picked up on the next build. Neither service is called at
runtime, and the sandbox this was built in could not reach either, so the files are
not committed yet.

## Design notes

Quiet, monochrome, personal. The interface is built on three things:

- **One accent on neutral** (`src/index.css`): zinc surfaces in light and dark, a single
  saffron accent for the primary moment (Sparks, the active step, the one thing to do
  next), green and red only for outcomes. Cards are a surface, a hairline and a soft
  shadow; there are no outlines, hard shadows or colour blocks. Product packs and the
  membership cards are the only saturated things on a screen.
- **Monogram portraits** (`src/ui/Face.tsx`): until a creator uploads a photo they get a
  tonal disc with their initials, one of eight muted tones picked from their name.
  `Avatar` renders a `Face`, so a person appears everywhere their name does.
- **Motivated motion** (`src/ui/motion.tsx`): content rises into place once, counters
  tick, the membership card tilts under the pointer, the headline word rotates, the
  ticker scrolls. Nothing wobbles or bobs. Everything collapses under
  `prefers-reduced-motion`.

Light and dark are both designed. The app follows the device by default and the moon or
sun button in the header overrides it (stored per browser, outside the app state).

The landing page opens with the promise beside a real membership card and the live
Sparks ledger, then the ticker, a creator spotlight in their own words, how it works,
missions, the public Sparks maths, levels, the season board, the Academy and the brands.
The creator home greets you by name with a note from a named team member, the creators
nearest you on the board, and a feed of what the Squad is doing.

- Type: Geist for Latin, Readex Pro for Arabic, both self-hosted variable fonts.
- Icons: Phosphor, named imports only.
