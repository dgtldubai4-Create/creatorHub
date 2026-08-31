"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Gift,
  Leaf,
  Rocket,
  Sparkles,
  Trophy,
  Wallet,
} from "lucide-react";
import { PROGRAM_TIERS, formatPoints } from "@/lib/program";
import { CountUp } from "@/components/motion";
import { cn } from "@/lib/utils";

const EASE = [0.23, 1, 0.32, 1] as const;

function Section({
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
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

const STEPS = [
  {
    icon: Rocket,
    title: "Join a launch",
    body: "Browse open briefs from Amla, Vatika, Hajmola, Herb'l and Real. Request a slot or pitch a barter — every decision comes back with a reason.",
  },
  {
    icon: BookOpen,
    title: "Learn the craft",
    body: "The Creator Academy teaches hooks, product shooting and Ramadan planning — each course banks points before you've posted a thing.",
  },
  {
    icon: Sparkles,
    title: "Create & get approved",
    body: "Submit content against the brief. Tulsi tier and up get 48-hour review. Approvals earn points; live posts earn a bonus on top.",
  },
  {
    icon: Wallet,
    title: "Earn & climb",
    body: "Track payments and barter value in one statement. Points climb tiers; tiers unlock paid-first briefs, boosts and the ambassador track.",
  },
];

const PROMISES = [
  "Every rejection comes with a written reason — no ghosting, ever",
  "Points on approvals, live posts, courses — nothing expires",
  "A live earnings statement for payments and barter value",
  "Paid media behind your best content, redeemable with points",
  "Tier perks that compound: priority review → paid-first briefs → ambassador track",
  "One hub for briefs, submissions, approvals and rewards",
];

export function Landing({
  stats,
}: {
  stats: { creators: number; liveCampaigns: number; pointsAwarded: number; regions: number };
}) {
  const reduce = useReducedMotion();

  return (
    <div className="hero-surface min-h-screen text-white">
      {/* Top bar */}
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-dabur-400 to-dabur-700 shadow-lg shadow-dabur-500/40">
            <Leaf className="h-5 w-5 text-white" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-wide">DaburStars</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-dabur-200">
              Creator Hub
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="press rounded-xl px-4 py-2 text-sm font-semibold text-dabur-100 transition-colors hover:bg-white/10 hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="press rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition-[filter] hover:brightness-105"
          >
            Become a Star
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 top-10 h-96 w-96 animate-float-slow rounded-full bg-amber-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 animate-float rounded-full bg-dabur-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-dabur-100 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              The Dabur creator program · Middle East
            </span>
          </motion.div>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
            className="mx-auto mt-6 max-w-3xl font-display text-5xl font-bold leading-[1.05] sm:text-6xl"
          >
            Create with the brands the region{" "}
            <span className="text-gradient-brand">grew up with.</span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: EASE }}
            className="mx-auto mt-5 max-w-2xl text-lg text-dabur-200"
          >
            DaburStars is the creator program behind Dabur Amla, Vatika, Hajmola, Herb&apos;l and
            Real — paid launches, a points economy that never expires, a creator academy, and a
            tier ladder that ends in an ambassador contract.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: EASE }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/signup"
              className="press group inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-base font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition-[filter,box-shadow] hover:brightness-105 hover:shadow-xl"
            >
              Join DaburStars — it&apos;s free
              <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out-strong group-hover:translate-x-1" />
            </Link>
            <a
              href="#tiers"
              className="press inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              See the tier ladder
            </a>
          </motion.div>

          {/* Stats strip */}
          <motion.dl
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.34, ease: EASE }}
            className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {[
              { label: "Creators on the bench", value: stats.creators },
              { label: "Live launches", value: stats.liveCampaigns },
              { label: "Points awarded", value: stats.pointsAwarded },
              { label: "Markets", value: stats.regions },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl px-4 py-5">
                <dt className="order-2 mt-1 text-xs text-dabur-200">{s.label}</dt>
                <dd className="text-3xl font-bold tracking-tight text-white">
                  <CountUp value={s.value} />
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </div>

      {/* Tier ladder */}
      <Section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" >
        <div id="tiers" className="mb-10 text-center">
          <h2 className="font-display text-4xl font-bold">The tier ladder</h2>
          <p className="mx-auto mt-3 max-w-xl text-dabur-200">
            Lifetime points decide your tier. Redeem rewards freely — your tier never drops.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAM_TIERS.map((tier, i) => (
            <motion.div
              key={tier.key}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.07, ease: EASE }}
              className="tier-shine glass flex flex-col rounded-3xl p-6"
            >
              <div
                className={cn(
                  "mb-4 inline-flex h-12 w-12 items-center justify-center self-start rounded-2xl bg-gradient-to-br text-2xl shadow-lg",
                  tier.gradient,
                )}
              >
                {tier.emoji}
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-dabur-200">
                {tier.min === 0 ? "Start here" : `${formatPoints(tier.min)}+ points`}
              </p>
              <h3 className="mt-1 font-display text-2xl font-bold">{tier.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-dabur-200">{tier.blurb}</p>
              <ul className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-dabur-100">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    {perk}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section className="border-y border-white/10 bg-black/10">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="font-display text-4xl font-bold">How it works</h2>
            <p className="mx-auto mt-3 max-w-xl text-dabur-200">
              Four moves, one loop — and every move earns points.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.07, ease: EASE }}
                  className="relative rounded-3xl border border-white/10 bg-white/5 p-6"
                >
                  <span className="absolute right-5 top-4 font-display text-5xl font-bold text-white/10">
                    {i + 1}
                  </span>
                  <Icon className="mb-4 h-7 w-7 text-amber-300" />
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-dabur-200">{step.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Program promises */}
      <Section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl font-bold leading-tight">
              Built like the programs you&apos;ve heard of.{" "}
              <span className="text-gradient-brand">Run like the one you&apos;d actually join.</span>
            </h2>
            <p className="mt-4 text-dabur-200">
              Global beauty programs made creator clubs famous. DaburStars keeps the glamour and
              fixes the friction — transparent approvals, points with no expiry, and a rewards
              store you can actually reach at every tier.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Dabur Amla", "Vatika", "Hajmola", "Herb'l", "Real"].map((brand) => (
                <span
                  key={brand}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-dabur-100"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
          <ul className="space-y-3">
            {PROMISES.map((promise, i) => (
              <motion.li
                key={promise}
                initial={reduce ? false : { opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
              >
                <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <span className="text-sm text-dabur-100">{promise}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Final CTA */}
      <Section className="mx-auto max-w-4xl px-4 pb-24 text-center sm:px-6">
        <div className="tier-shine relative overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-amber-400/20 via-white/5 to-dabur-500/20 px-8 py-14">
          <Gift className="mx-auto mb-4 h-10 w-10 text-amber-300" />
          <h2 className="font-display text-4xl font-bold">
            Your first 50 points are waiting.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-dabur-200">
            Signing up banks your welcome points before your first brief. The ladder starts today.
          </p>
          <Link
            href="/signup"
            className="press mt-7 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-7 py-3 text-base font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition-[filter] hover:brightness-105"
          >
            Become a DaburStar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Section>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-dabur-300">
        DaburStars · Dabur Creator Hub · Middle East — UAE · KSA · Kuwait · Qatar · Oman · Bahrain · Egypt
      </footer>
    </div>
  );
}
