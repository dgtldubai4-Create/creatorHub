# DaburStars · Dabur Creator Hub 🌿

The creator program platform for Dabur's Middle East marketing team — built to go
head-to-head with the big beauty-house creator programs. Creators join launches, learn,
earn points and climb a tier ladder; marketers run approvals and read the program's pulse.

**The program loop:** join a launch → learn in the Academy → create & get approved → earn
points and money → climb Sprout 🌱 → Tulsi 🌿 → Amla ✨ → Kesar 👑.

## What's inside

**For creators**

- **Public landing page** (`/` signed out) — program pitch, tier ladder, how-it-works
- **Dashboard** — animated tier-progress ring, spendable balance vs lifetime points,
  earnings summary, "do next" actions, live points ledger
- **Launch briefs** (`/launches/[id]`) — deliverables, do's & don'ts, compensation,
  KPIs, points per asset, join/barter flows
- **Creator Academy** (`/academy`) — 5 seeded courses with lessons + server-graded
  quizzes; passing banks points (answers never reach the client)
- **Rewards Store** (`/rewards`) — tier-gated catalog, atomic redemption (balance,
  stock, ledger and notification in one transaction)
- **Stars Board** (`/leaderboard`) — podium + rankings by lifetime points with
  30-day momentum
- **Earnings** (`/earnings`) — cash + barter statement across currencies with
  paid/approved/pending status
- **Notifications** — bell with unread badge; every decision that affects a creator
  notifies them with the reason

**For marketers / brand leads / admins**

- **Approval queue** — region-scoped; every approval automatically writes ledger
  points, bumps tier progress and notifies the creator; rejections require a reason
- **Insights** (`/insights`) — queue load, approval rates, request/content funnels,
  creator bench by region, top creators, campaign table
- **Creator directory** — searchable, with program tiers

## The points economy

| Event | Points |
| --- | --- |
| Signing up | +50 |
| Accepted into a launch | +40 |
| Asset approved | +campaign `basePoints` (80–120 seeded) |
| Asset goes live | +50 |
| Course completed | +60–100 |
| Reward redemption | −cost (balance only) |

Two numbers per creator: **balance** (spendable, redemptions subtract) and
**lifetime points** (only ever grows — drives the tier, so redeeming never demotes).
Both are updated in the same transaction as their ledger event.

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS + shadcn-style components ·
framer-motion (custom easing system per design review) · Fraunces + Inter via `next/font` ·
Prisma (SQLite locally, Postgres-ready) · NextAuth credentials + JWT with role-based
middleware · Zod + React Hook Form.

## Quick start

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies the schema
npm run db:seed          # creators, campaigns, ledgers, courses, rewards, earnings
npm run dev              # http://localhost:3000
```

Copy `.env.example` to `.env` first if it doesn't exist (the defaults work for local dev).

## Demo logins

Password for all accounts: **`dabur2026`**

| Role       | Email                        | What you'll see                                          |
| ---------- | ---------------------------- | -------------------------------------------------------- |
| CREATOR    | `layla@creators.example`     | Amla tier, rich ledger, earnings, a rejection to fix     |
| CREATOR    | `noora@creators.example`     | Fresh Sprout account — the day-one experience            |
| MARKETER   | `marketer.uae@dabur.example` | Queue + insights scoped to **UAE**                       |
| BRAND_LEAD | `brandlead@dabur.example`    | Everything across all seven regions                      |
| ADMIN      | `admin@dabur.example`        | Everything                                               |

## Route map

| Route             | Access                        | Purpose                                     |
| ----------------- | ----------------------------- | ------------------------------------------- |
| `/`               | Public / all roles            | Landing (signed out) · role dashboard (in)  |
| `/signup`         | Public                        | Creator self-signup (+50 welcome points)    |
| `/login`          | Public                        | Credentials sign-in with demo quick-fill    |
| `/launches`       | All roles                     | Open launches board with filters            |
| `/launches/[id]`  | All roles                     | Full campaign brief                         |
| `/academy`        | CREATOR                       | Course list with progress                   |
| `/academy/[slug]` | CREATOR                       | Lessons + quiz (server-graded)              |
| `/rewards`        | CREATOR                       | Rewards store + redemption history          |
| `/leaderboard`    | CREATOR                       | Stars board                                 |
| `/earnings`       | CREATOR                       | Payment/barter statement                    |
| `/submit`         | CREATOR                       | Asset submission (approved campaigns only)  |
| `/me`             | CREATOR                       | Requests + assets state tracker             |
| `/queue`          | MARKETER / BRAND_LEAD / ADMIN | Approval queue (marketers region-scoped)    |
| `/creators`       | MARKETER / BRAND_LEAD / ADMIN | Creator directory + detail pages            |
| `/insights`       | MARKETER / BRAND_LEAD / ADMIN | Program analytics                           |

Role enforcement happens twice: in `src/middleware.ts` (route protection) and again inside
every server action (`src/actions/*`) with Zod validation — the UI is never the security
boundary. Quiz answers are graded server-side; redemptions are stock-guarded transactions.

## Deploying (Vercel / Netlify)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdgtldubai4-Create%2FcreatorHub&env=DATABASE_URL,NEXTAUTH_SECRET&envDescription=Postgres%20connection%20string%20and%20a%20random%2032-byte%20auth%20secret&project-name=dabur-creator-hub)

1. Provision a hosted Postgres (Neon, Supabase, or Vercel Postgres).
2. In `prisma/schema.prisma`, change `provider = "sqlite"` → `"postgresql"`.
3. Set `DATABASE_URL`, `NEXTAUTH_SECRET` (32+ random bytes), and `NEXTAUTH_URL`.
4. Run `npx prisma migrate deploy && npm run db:seed` once against the production DB.

SQLite is for local dev only — serverless filesystems are ephemeral.

## Project layout

```
prisma/schema.prisma    # core + program layer (points, rewards, courses, earnings)
prisma/seed.ts          # demo data: ledgers, courses, rewards, earnings, notifications
src/lib/program.ts      # tier ladder, point values, tier math — single source of truth
src/middleware.ts       # role-based route protection ("/" public for the landing)
src/lib/                # auth config, prisma client, zod validators, enum constants
src/actions/            # all mutations (server actions, zod-validated, role-checked)
src/app/                # App Router pages
src/components/         # UI primitives + feature components (program/ = tier UI)
```

Future modules (Grading, Sentiment, Brand Books) attach to the same `Creator` /
`Campaign` / `Asset` anchors — see the schema header comment.
