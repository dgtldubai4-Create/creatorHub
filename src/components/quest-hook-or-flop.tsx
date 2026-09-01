"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Coin } from "@/components/game/miles-chip";
import { confettiFrom } from "@/lib/confetti";
import { cn } from "@/lib/utils";

const EASE = [0.23, 1, 0.32, 1] as const;
const MILES_PER_ROUND = 50;

// Original teaching content — each round trains a craft rule from the Academy.
const ROUNDS = [
  {
    hooks: ["My haircare routine, step by step", "The mistake ruining your hair oil (you're doing it tonight)"],
    right: 1,
    why: [
      "Routine lists scroll past — there's no tension to stop for.",
      "Curiosity plus 'tonight' gives a reason to stop right now.",
    ],
  },
  {
    hooks: ["I tested this oil for 30 days in Dubai heat", "This product is amazing — honest review!"],
    right: 0,
    why: [
      "Stakes and a real test build instant credibility.",
      "'Amazing' is what every ad says — thumbs keep moving.",
    ],
  },
  {
    hooks: ["Watch till the end for the result 🙏", "50°C outside. My hair? Still hydrated."],
    right: 1,
    why: [
      "Begging for retention is how you lose it.",
      "A concrete claim in six words — the hook IS the result.",
    ],
  },
];

/**
 * The guest side quest. Earned miles are held in escrow (localStorage) and
 * banked by the signup action — which re-validates and caps the value.
 */
export function QuestHookOrFlop({ signedIn = false }: { signedIn?: boolean }) {
  const reduce = useReducedMotion();
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [escrow, setEscrow] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!finished || signedIn) return;
    try {
      const prev = JSON.parse(localStorage.getItem("ds_escrow") ?? "{}");
      const miles = Math.max(Number(prev?.miles) || 0, escrow);
      localStorage.setItem("ds_escrow", JSON.stringify({ miles, quest: "hook-or-flop" }));
    } catch {
      /* private mode etc. — the quest still plays */
    }
  }, [finished, escrow, signedIn]);

  function pick(i: number, el: HTMLButtonElement) {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === ROUNDS[round].right;
    if (correct) {
      setEscrow((e) => e + MILES_PER_ROUND);
      confettiFrom(el, 30);
    }
    setTimeout(() => {
      if (round + 1 < ROUNDS.length) {
        setRound((r) => r + 1);
        setPicked(null);
      } else {
        setFinished(true);
        if (correct || escrow > 0) confettiFrom(el, 90);
      }
    }, 1700);
  }

  function replay() {
    setRound(0);
    setPicked(null);
    setEscrow(0);
    setFinished(false);
  }

  const r = ROUNDS[round];

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-inkbrown bg-card shadow-[8px_8px_0_#ffc531]">
      <div className="flex items-center justify-between gap-3 bg-inkbrown px-5 py-3.5 text-white">
        <p className="font-game text-[15px] font-bold">SIDE QUEST · Hook or Flop?</p>
        <p className="flex items-center gap-2 font-game text-sm font-bold text-mango">
          <Coin size={20} />
          <span className="tabular-nums">{escrow}</span> in escrow
        </p>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait" initial={false}>
          {!finished ? (
            <motion.div
              key={round}
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <p className="font-semibold text-dabur-900">Which hook stops the scroll?</p>
              <p className="mb-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Round {round + 1} / {ROUNDS.length} · +{MILES_PER_ROUND} MI per correct pick
              </p>
              <div className="grid gap-2.5">
                {r.hooks.map((hook, i) => {
                  const showResult = picked !== null;
                  const isRight = i === r.right;
                  return (
                    <button
                      key={hook}
                      disabled={picked !== null}
                      onClick={(e) => pick(i, e.currentTarget)}
                      className={cn(
                        "press rounded-xl border-2 px-4 py-3 text-left text-[15px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tang",
                        showResult && isRight && "border-dabur-600 bg-dabur-50",
                        showResult && !isRight && picked === i && "border-stampred bg-stampred-soft",
                        !showResult && "border-border bg-paper hover:border-tang",
                      )}
                    >
                      “{hook}”
                    </button>
                  );
                })}
              </div>
              <p
                aria-live="polite"
                className={cn(
                  "mt-3 min-h-[22px] font-game text-sm font-bold",
                  picked !== null && (picked === r.right ? "text-dabur-700" : "text-stampred"),
                )}
              >
                {picked !== null &&
                  `${picked === r.right ? `+${MILES_PER_ROUND} MI — ` : ""}${r.why[picked]}`}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="py-3 text-center"
            >
              <p className="font-game text-3xl font-bold text-tang-deep">
                +{escrow} MI {signedIn ? "— nice run!" : "banked in escrow"}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {signedIn
                  ? "You've already got an account — quests like this pay out inside the Academy."
                  : escrow > 0
                    ? "Create your DaburStars account to claim them — plus 50 welcome miles on top."
                    : "No miles this run — but the retry button is right there."}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {!signedIn && escrow > 0 && (
                  <Link
                    href="/signup"
                    className="btn-3d inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dabur-600"
                  >
                    Claim my {escrow} miles <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <button
                  onClick={replay}
                  className="press rounded-xl border-2 border-border px-5 py-3 font-game text-sm font-bold text-muted-foreground hover:border-dabur-400 hover:text-dabur-700"
                >
                  Play again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
