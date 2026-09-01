"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Leaf, Sparkles } from "lucide-react";
import { PROGRAM_TIERS, formatMiles } from "@/lib/program";
import {
  BRANDS,
  BRAND_LABELS,
  BRAND_TAGLINES,
  type Brand,
} from "@/lib/constants";
import { ProductImage } from "@/components/product-image";
import { QuestHookOrFlop } from "@/components/quest-hook-or-flop";
import { CountUp } from "@/components/motion";
import { Coin } from "@/components/game/miles-chip";
import { cn } from "@/lib/utils";

const EASE = [0.23, 1, 0.32, 1] as const;

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.55, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const VERBS = [
  {
    title: "EARN",
    body: "Approved content slams a stamp and banks miles. Quests, courses and streaks pay too.",
    cls: "bg-gradient-to-br from-dabur-500 to-dabur-800 text-white",
  },
  {
    title: "LEVEL",
    body: "Lifetime miles climb four classes — Scout to Ambassador. Levels never drop.",
    cls: "bg-gradient-to-br from-tealpop to-cyan-800 text-white",
  },
  {
    title: "SPEND",
    body: "Miles buy product drops, boosts and studio days. Spending never touches your class.",
    cls: "bg-gradient-to-br from-mango to-tang text-[#4d2500]",
  },
];

export function Landing({
  stats,
  flagship,
}: {
  stats: { creators: number; liveCampaigns: number; milesAwarded: number; regions: number };
  flagship: { id: string; name: string; tagline: string | null; brand: string } | null;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="bg-paper text-inkbrown">
      {/* Top bar */}
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-dabur-400 to-dabur-700 shadow-md">
            <Leaf className="h-5 w-5 text-white" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-game text-sm font-bold text-dabur-800">DaburStars</span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Creator Hub
            </span>
          </span>
        </div>
        <nav className="flex items-center gap-2" aria-label="Landing">
          <Link
            href="/login"
            className="press rounded-xl px-4 py-2 font-game text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-dabur-800"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="btn-3d rounded-xl px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dabur-600"
          >
            Start earning
          </Link>
        </nav>
      </header>

      {/* Hero + playable quest */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-2 lg:pt-16">
        <div>
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border-2 border-dabur-200 bg-dabur-50 px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-dabur-800"
          >
            <Sparkles className="h-3.5 w-3.5 text-tang" aria-hidden />
            Dabur&apos;s creator program · 7 markets
          </motion.span>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: EASE }}
            className="mt-5 max-w-xl font-game text-5xl font-extrabold leading-[1.02] text-dabur-900 sm:text-6xl"
            style={{ textWrap: "balance" }}
          >
            Create. Get stamped.{" "}
            <span className="text-tang">Bank the miles.</span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
            className="mt-4 max-w-lg text-lg text-muted-foreground"
          >
            Real paid campaigns from the brands on every shelf in the region. Every approval earns a
            stamp and miles; miles buy product drops, boosts and studio days — and the ladder ends in
            an <strong className="text-inkbrown">ambassador contract</strong>.
          </motion.p>

          {/* Live stats */}
          <motion.dl
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="mt-8 flex flex-wrap gap-3"
          >
            {[
              { label: "creators", value: stats.creators },
              { label: "live campaigns", value: stats.liveCampaigns },
              { label: "miles awarded", value: stats.milesAwarded },
              { label: "markets", value: stats.regions },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card px-4 py-3">
                <dd className="font-game text-2xl font-bold tabular-nums text-dabur-800">
                  <CountUp value={s.value} />
                </dd>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </dt>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
        >
          <QuestHookOrFlop />
          <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            No account needed — miles wait in escrow until you claim them
          </p>
        </motion.div>
      </section>

      {/* Flagship public challenge */}
      {flagship && (
        <Reveal className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link
            href="/challenge"
            className="card-lift group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-zinc-950 px-7 py-9 text-white"
          >
            <span className="stamped absolute right-6 top-6 rotate-6 rounded border-[2.5px] border-sunny px-3 py-1 text-xs text-sunny opacity-90">
              OPEN TO EVERYONE
            </span>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
              Flagship challenge · Vatika Menz · no account needed to enter
            </p>
            <h2 className="mt-2 max-w-xl font-game text-3xl font-extrabold sm:text-4xl" style={{ textWrap: "balance" }}>
              {flagship.name} <span aria-hidden>🧔🏻‍♂️</span>
            </h2>
            <p className="mt-1 max-w-xl text-slate-300">
              {flagship.tagline ?? "Before/after. No filters. Weekly winners."} Post your
              transformation, enter with one form, and let the judges do the rest — winners are
              fast-tracked into the program.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 font-game text-[15px] font-bold text-mango">
              Enter the challenge
              <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out-strong group-hover:translate-x-1" aria-hidden />
            </span>
          </Link>
        </Reveal>
      )}

      {/* Three verbs */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <h2 className="text-center font-game text-3xl font-extrabold text-dabur-900 sm:text-4xl">
            Three verbs. That&apos;s the whole game.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {VERBS.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.07}>
              <div className={cn("relative h-full overflow-hidden rounded-2xl p-6", v.cls)}>
                <span aria-hidden className="absolute -bottom-5 -right-2 font-game text-8xl font-extrabold opacity-15">
                  {i + 1}
                </span>
                <h3 className="font-game text-2xl font-extrabold">{v.title}</h3>
                <p className={cn("mt-1.5 text-sm", i === 2 ? "text-[#6b3300]" : "opacity-90")}>{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Class ladder */}
        <Reveal delay={0.1} className="mt-8">
          <div className="flex flex-wrap items-center justify-center gap-2.5 rounded-2xl border border-border bg-card px-5 py-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              The ladder:
            </span>
            {PROGRAM_TIERS.map((t, i) => (
              <span key={t.key} className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 font-game text-sm font-bold",
                    t.soft,
                    t.text,
                  )}
                >
                  <span aria-hidden>{t.emoji}</span> {t.label}
                  <span className="font-mono text-[10px] font-semibold opacity-70">
                    {t.min === 0 ? "start" : `${formatMiles(t.min)}+`}
                  </span>
                </span>
                {i < PROGRAM_TIERS.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                )}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* The brands — mirrors the brand team's card grid */}
      <section className="border-y border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Reveal>
            <h2 className="text-center font-game text-3xl font-extrabold text-dabur-900 sm:text-4xl">
              The brands you&apos;ll create for
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
              The real portfolio, from the 1940 original to the men&apos;s range — each with its own
              campaigns and stamp series.
            </p>
          </Reveal>
          <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {BRANDS.map((brand, i) => (
              <Reveal key={brand} delay={i * 0.04}>
                <div className="card-lift flex h-full flex-col items-center rounded-2xl border border-dabur-100 bg-dabur-50/70 px-4 py-6 text-center">
                  <ProductImage brand={brand as Brand} height={76} />
                  <p className="mt-3 font-semibold text-dabur-900">{BRAND_LABELS[brand as Brand]}</p>
                  <p className="text-sm text-muted-foreground">{BRAND_TAGLINES[brand as Brand]}</p>
                  {brand === "VATIKA_MENZ" && (
                    <span className="stamped mt-2 -rotate-3 rounded border-2 border-tang px-2 py-0.5 text-[10px] text-tang-deep">
                      YES SHABAB, THIS ONE&apos;S YOURS
                    </span>
                  )}
                </div>
              </Reveal>
            ))}
            <Reveal delay={0.3}>
              <Link
                href="/signup"
                className="card-lift flex h-full flex-col items-center justify-center gap-2 rounded-2xl bg-dabur-500 px-4 py-6 text-center font-game text-lg font-bold text-white"
              >
                <span aria-hidden className="text-2xl">+</span>
                See open campaigns
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Why it doesn't feel transactional */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-game text-3xl font-extrabold leading-tight text-dabur-900 sm:text-4xl" style={{ textWrap: "balance" }}>
              Built to grow creators, not just collect posts.
            </h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              The mechanics put their money where the copy is — every rule below is enforced by the
              platform, not promised by a deck.
            </p>
            <Link
              href="/signup"
              className="btn-3d mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dabur-600"
            >
              <Coin size={20} /> Bank your first 50 miles
            </Link>
          </Reveal>
          <div className="grid gap-3">
            {[
              "Nothing bounces without a craft note — and the resubmit carries a bonus",
              "Your Creator Card is a live media kit: class, approval rate, live work",
              "Miles for learning, streaks and mentoring — never silence between campaigns",
              "Spending in the shop never lowers your class. Splurge guilt-free",
              "Every decision comes from a named regional team, with the reason attached",
            ].map((line, i) => (
              <Reveal key={line} delay={i * 0.05}>
                <div className="flex items-start gap-3 rounded-2xl border border-border bg-card px-5 py-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-dabur-600" aria-hidden />
                  <span className="text-[15px] text-inkbrown">{line}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        DaburStars · Earn → Level → Spend · UAE · KSA · Kuwait · Qatar · Oman · Bahrain · Egypt
      </footer>
    </div>
  );
}
