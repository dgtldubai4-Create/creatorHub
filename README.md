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
  score (approved share of reviewed cuts and posts blended with auto-check scores) and
  the current season's Ambassador cohort. Thresholds live in `LEVEL_RULES`.
- **Seasons** hold the Ambassador round: `advanceSeason` opens wildcards then voting
  (pulling the top Pros onto the shortlist), creators `enterWildcard` and
  `voteAmbassador` once each, and `selectAmbassadors` confirms the cohort.
- **Streaks** are monthly and computed from the ledger; the first Sparks-earning action
  in a month after an active month adds a streak bonus entry.
- **Academy** tracks gate on level; completing every module in a track issues a
  certificate and Sparks. Mentoring sessions have seats and level gates.

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

Bright, loud, personal. The interface is built on three things:

- **Candy palette** (`src/index.css`): cream canvas, deep plum ink, and six candies
  (lime, tangerine, bubblegum, sky, lemon, grape). Every card has a 2px ink outline and
  a hard offset shadow; buttons and chips are pills. Dark mode keeps the candies and
  flips the outline to cream.
- **Faces drawn in code** (`src/ui/Face.tsx`): every creator and team member gets a
  deterministic illustrated avatar from their name: skin, hair or hijab, colours,
  glasses, expression. The seed cast has hand-set looks; anyone new gets a hashed one.
  `Avatar` renders a `Face`, so faces appear everywhere a name does.
- **Motion everywhere** (`src/ui/motion.tsx`): ambient drift (blobs, marquees, bobbing
  faces, ticking counters, a rotating headline word, a cursor glow) and interaction
  (magnetic buttons, tilt, squish, springy page transitions, stamps and confetti).
  Everything collapses under `prefers-reduced-motion`.

The landing page leads with the people: a cloud of real Squad faces, a live ticker of
Sparks earned, a rotating creator spotlight in their own words, then missions, levels,
the season board, the Academy and the brands. The creator home greets you by name with
your face, a note from a named team member, the creators nearest you on the board, and
a feed of what the Squad is doing.

- Type: Outfit for Latin, Readex Pro for Arabic, both self-hosted variable fonts.
- Icons: Phosphor, named imports only.
