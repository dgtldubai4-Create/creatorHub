"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ChunkyBar } from "@/components/game/chunky-bar";
import { Stamp } from "@/components/game/stamp";
import { formatMiles } from "@/lib/program";
import { initials } from "@/lib/utils";

const EASE = [0.23, 1, 0.32, 1] as const;

function Odometer({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const t0 = performance.now();
    const dur = 1300;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {formatMiles(display)}
    </span>
  );
}

export type CreatorCardHeroProps = {
  name: string;
  region: string;
  balance: number;
  lifetime: number;
  tier: { label: string; emoji: string };
  next: { label: string; emoji: string; min: number } | null;
  progress: number;
  visasHeld: number;
  streakWeeks: number;
  recentStamp: string | null; // e.g. "APPROVED · +120 MI"
  stats: Array<{ label: string; value: string; href: string }>;
};

/** The Creator Card + miles wallet — the dashboard's identity block. */
export function CreatorCardHero(props: CreatorCardHeroProps) {
  const reduce = useReducedMotion();
  const remaining = props.next ? props.next.min - props.lifetime : 0;

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="mb-8 grid gap-5 lg:grid-cols-5"
    >
      {/* Creator Card */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-dabur-600 bg-gradient-to-br from-card to-cream p-5 lg:col-span-3">
        <div className="flex items-center justify-between border-b border-border pb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-dabur-700">
          <span>DaburStars Creator Card</span>
          <span aria-hidden>★ ★ ★</span>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <span className="grid h-20 w-16 flex-none place-items-center rounded-lg border border-border bg-dabur-50 font-display text-2xl font-bold text-dabur-700">
            {initials(props.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-2xl font-bold text-dabur-900">{props.name}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full border-2 border-dabur-600 px-3 py-0.5 font-game text-sm font-bold text-dabur-700">
              <span aria-hidden>{props.tier.emoji}</span> {props.tier.label.toUpperCase()}
            </p>
            <dl className="mt-2 flex gap-5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              <div>
                <dt className="inline">Market&nbsp;</dt>
                <dd className="inline font-semibold text-inkbrown">{props.region}</dd>
              </div>
              <div>
                <dt className="inline">Campaigns&nbsp;</dt>
                <dd className="inline font-semibold text-inkbrown">{props.visasHeld}</dd>
              </div>
              <div>
                <dt className="inline">Streak&nbsp;</dt>
                <dd className="inline font-semibold text-tang-deep">
                  {props.streakWeeks > 0 ? `${props.streakWeeks}w 🔥` : "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        {props.recentStamp && (
          <Stamp tone="green" rotate={8} slam shape="round" className="absolute -right-1 bottom-3 h-[86px] w-[86px] text-[10px] sm:right-4">
            {props.recentStamp}
          </Stamp>
        )}
      </div>

      {/* Miles wallet */}
      <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-dabur-800 to-dabur-950 p-5 text-white lg:col-span-2">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-dabur-200">
          Miles balance
        </p>
        <p className="font-game text-5xl font-extrabold leading-none text-mango">
          <Odometer value={props.balance} /> <span className="text-lg text-dabur-100">MI</span>
        </p>
        <ChunkyBar value={props.progress} label={`Progress to ${props.next?.label ?? "the top"}`} />
        <p className="text-sm text-dabur-100">
          {props.next ? (
            <>
              <strong className="text-mango">{formatMiles(remaining)} mi</strong> to{" "}
              {props.next.emoji} {props.next.label} — stamps, live posts and courses all count.
            </>
          ) : (
            "Top of the ladder — the ambassador track is watching."
          )}
        </p>
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1">
          {props.stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="group inline-flex items-baseline gap-1.5 text-sm text-dabur-100 hover:text-white"
            >
              <span className="font-game font-bold text-white">{s.value}</span>
              <span>{s.label}</span>
              <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            </Link>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
