# Dabur Squad

The creator-community portal for Dabur in the UAE and KSA. One codebase, two seats
behind one sign-in: a **creator** seat (invitations, kits, uploads, feedback, rewards)
and a **brand-team** seat (campaigns, shortlists, review queue, logistics, loyalty,
product catalogue). Bilingual English and Arabic, LTR and RTL, with language as global state.

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
| Creator | any of the 20 seeded creators | Layla Al Mansoori has data at most stages |
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

## Design notes

- Palette: one green, one marigold accent, green-tinted neutrals. Light and dark follow
  the system preference.
- Type: Outfit for Latin, Readex Pro for Arabic, both self-hosted variable fonts.
- Motion: `motion/react` springs for state changes, Lenis for smooth scrolling, a
  confetti burst on the moments that deserve one. Everything collapses under
  `prefers-reduced-motion`.
- Icons: Phosphor.
