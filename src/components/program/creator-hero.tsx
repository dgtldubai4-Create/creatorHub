"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { TierRing } from "@/components/program/tier-ring";
import { formatPoints } from "@/lib/program";

const EASE = [0.23, 1, 0.32, 1] as const;

export type CreatorHeroProps = {
  firstName: string;
  points: number; // spendable balance
  lifetimePoints: number; // drives tier + distance to next tier
  tier: { label: string; emoji: string; gradient: string };
  next: { label: string; emoji: string; min: number } | null;
  progress: number; // 0–1 toward next tier
  stats: Array<{ label: string; value: string; href: string }>;
};

export function CreatorHero({
  firstName,
  points,
  lifetimePoints,
  tier,
  next,
  progress,
  stats,
}: CreatorHeroProps) {
  const reduce = useReducedMotion();
  const remaining = next ? next.min - lifetimePoints : 0;

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="hero-surface relative mb-8 overflow-hidden rounded-3xl px-6 py-8 text-white shadow-xl shadow-dabur-950/20 sm:px-8"
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 animate-float-slow rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 animate-float rounded-full bg-dabur-400/25 blur-3xl" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center">
        {/* Tier ring + progress */}
        <div className="flex items-center gap-6">
          <TierRing progress={progress} emoji={tier.emoji} size={132} />
          <div>
            <p className="text-sm text-dabur-200">Ahlan, {firstName}</p>
            <p className="font-display text-4xl font-bold leading-tight">
              {tier.label}
              <span className="ml-2 align-middle text-base font-semibold text-amber-300">
                {formatPoints(points)} pts to spend
              </span>
            </p>
            {next ? (
              <p className="mt-1.5 max-w-xs text-sm text-dabur-200">
                <span className="font-semibold text-white">{formatPoints(remaining)} points</span>{" "}
                to {next.emoji} {next.label} — approvals, live posts and courses all count.
              </p>
            ) : (
              <p className="mt-1.5 max-w-xs text-sm text-dabur-200">
                Top of the ladder. The ambassador track is reviewing creators like you.
              </p>
            )}
            <Link
              href="/leaderboard"
              className="group mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300 hover:text-amber-200"
            >
              See where you rank
              <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out-strong group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid flex-1 grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.07, ease: EASE }}
            >
              <Link
                href={s.href}
                className="glass block h-full rounded-2xl px-4 py-4 transition-colors hover:bg-white/15"
              >
                <p className="text-xl font-bold tracking-tight sm:text-2xl">{s.value}</p>
                <p className="mt-1 text-xs text-dabur-200">{s.label}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
