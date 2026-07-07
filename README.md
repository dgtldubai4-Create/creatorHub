# Dabur Creator Hub 🌿

The creator-facing front door and marketer approval cockpit for Dabur's Middle East digital
marketing team — the MVP module of a larger creator-marketing platform.

- **Creators** sign up, browse open campaign launches (Dabur Amla, Vatika, Hajmola, Herb'l, Real),
  request to join or propose barter collabs, submit content, and track every request/asset through
  an animated state tracker.
- **Marketers** work a region-scoped approval queue (join requests + submitted assets — rejections
  always require a reason that flows back to the creator) and browse a searchable creator directory.
- **Brand Leads / Admins** see everything across all seven regions.

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS + shadcn-style components · framer-motion ·
Prisma (SQLite locally, Postgres-ready) · NextAuth credentials + JWT with role-based middleware ·
Zod + React Hook Form.

## Quick start

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies the schema
npm run db:seed          # 12 creators, 5 campaigns, requests & assets
npm run dev              # http://localhost:3000
```

Copy `.env.example` to `.env` first if it doesn't exist (the defaults work for local dev).

## Demo logins

Password for all accounts: **`dabur2026`**

| Role       | Email                        | What you'll see                                        |
| ---------- | ---------------------------- | ------------------------------------------------------ |
| CREATOR    | `layla@creators.example`     | Launches board, barter flow, submissions, status tracker |
| MARKETER   | `marketer.uae@dabur.example` | Approval queue scoped to **UAE** only                  |
| BRAND_LEAD | `brandlead@dabur.example`    | Full queue + creator directory across all regions       |
| ADMIN      | `admin@dabur.example`        | Everything                                              |

(A second marketer, `marketer.ksa@dabur.example`, demonstrates KSA scoping.)

## Route map

| Route            | Access                       | Purpose                                            |
| ---------------- | ---------------------------- | -------------------------------------------------- |
| `/signup`        | Public                       | Creator self-signup → `Creator` + `User(CREATOR)`  |
| `/login`         | Public                       | Credentials sign-in (demo account quick-fill)      |
| `/`              | All roles                    | Dashboard with live counts                         |
| `/launches`      | All roles                    | Open launches board, region/category filters, join + barter flows |
| `/submit`        | CREATOR                      | Asset submission (approved campaigns only)         |
| `/me`            | CREATOR                      | Join requests + assets state tracker with feedback |
| `/queue`         | MARKETER / BRAND_LEAD / ADMIN | Approval queue (marketers region-scoped)          |
| `/creators`      | MARKETER / BRAND_LEAD / ADMIN | Searchable/filterable directory + detail pages    |

Role enforcement happens twice: in `src/middleware.ts` (route protection) and again inside every
server action (`src/actions/*`) with Zod validation — the UI is never the security boundary.

## Deploying (Vercel / Netlify)

The backend is intentionally simple — server actions + Prisma, no separate API service.

1. Provision a hosted Postgres (Neon, Supabase, or Vercel Postgres).
2. In `prisma/schema.prisma`, change `provider = "sqlite"` → `"postgresql"`.
3. Set `DATABASE_URL`, `NEXTAUTH_SECRET` (32+ random bytes), and `NEXTAUTH_URL` in the host's
   environment variables.
4. Run `npx prisma migrate deploy && npm run db:seed` once against the production DB.

SQLite is for local dev only — serverless filesystems are ephemeral.

## How the data model extends to future modules

The schema is deliberately normalized around three permanent anchors — **Creator**, **Campaign**,
and **Asset** — all keyed by stable `cuid()` IDs that future modules reference directly:

- **Grading module** — attaches a `Grade`/`Scorecard` table keyed by `assetId`; the reserved
  `Asset.score` and `Creator.avgScore` fields are its write targets (nothing in the MVP writes
  them). Roll-ups flow Asset → Creator.
- **Sentiment module** — attaches `SentimentSnapshot` rows keyed by `assetId` (comment analysis
  per published asset) and aggregates per `campaignId`.
- **Brand Books module** — attaches `BrandBook`/`BrandRule` tables keyed by brand, with
  per-`campaignId` overrides; asset review in the queue can then surface rule checks inline.

Enum-like fields are `String` (SQLite limitation) with the exact value sets documented in the
schema and enforced by Zod + TS union types in `src/lib/constants.ts` — on Postgres they can be
promoted to native enums without data changes. JSON payloads (`handles`, `tags`, `kpis`) are
stringified for SQLite and become `Jsonb` on Postgres.

## Project layout

```
prisma/schema.prisma    # data model (read the header comment)
prisma/seed.ts          # demo data + logins
src/middleware.ts       # role-based route protection
src/lib/                # auth config, prisma client, zod validators, enum constants
src/actions/            # all mutations (server actions, zod-validated, role-checked)
src/app/                # App Router pages
src/components/         # UI primitives + feature components
```
