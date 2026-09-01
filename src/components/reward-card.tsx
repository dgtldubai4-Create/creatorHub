"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, PackageCheck } from "lucide-react";
import { redeemReward } from "@/actions/rewards";
import { MilesValue } from "@/components/game/miles-chip";
import { REWARD_CATEGORY_LABELS, formatMiles, tierByKey, type RewardCategory } from "@/lib/program";
import { confettiFrom } from "@/lib/confetti";
import { cn } from "@/lib/utils";

const CATEGORY_TONES: Record<RewardCategory, string> = {
  PRODUCT: "bg-dabur-100 text-dabur-800",
  EXPERIENCE: "bg-violet-100 text-violet-800",
  BOOST: "bg-tealpop-soft text-cyan-900",
  VOUCHER: "bg-tang-soft text-tang-deep",
};

const HOLD_MS = 1000;

/**
 * Shop item with hold-to-claim: spending 300+ miles deserves a deliberate
 * press (1s linear fill), and an early release snaps back in 200ms. The hold
 * IS the confirmation — no dialog.
 */
export function RewardCard({
  reward,
  balance,
  tierUnlocked,
}: {
  reward: {
    id: string;
    title: string;
    description: string;
    category: string;
    emoji: string;
    pointsCost: number;
    minTier: string;
    stock: number;
  };
  balance: number;
  tierUnlocked: boolean;
}) {
  const router = useRouter();
  const [holding, setHolding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState(false);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const affordable = balance >= reward.pointsCost;
  const outOfStock = reward.stock <= 0;
  const locked = !tierUnlocked;
  const canRedeem = !locked && affordable && !outOfStock && !redeemed && !pending;
  const minTierLabel = tierByKey(reward.minTier).label;

  function startHold() {
    if (!canRedeem) return;
    setError(null);
    setHolding(true);
    timer.current = setTimeout(() => {
      setHolding(false);
      startTransition(async () => {
        const result = await redeemReward({ rewardId: reward.id });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setRedeemed(true);
        if (btnRef.current) confettiFrom(btnRef.current, 70);
        router.refresh();
      });
    }, HOLD_MS);
  }

  function cancelHold() {
    setHolding(false);
    if (timer.current) clearTimeout(timer.current);
  }

  return (
    <article className={cn("tier-shine glass-card card-lift flex h-full flex-col p-6", locked && "opacity-75 saturate-50")}>
      <div className="mb-3 flex items-start justify-between">
        <span className="text-4xl" aria-hidden>{reward.emoji}</span>
        <div className="flex flex-col items-end gap-1.5">
          <span className={cn("rounded-full px-2.5 py-0.5 font-game text-xs font-bold", CATEGORY_TONES[reward.category as RewardCategory] ?? "bg-slate-100 text-slate-700")}>
            {REWARD_CATEGORY_LABELS[reward.category as RewardCategory] ?? reward.category}
          </span>
          {locked && (
            <span className="stamped rotate-2 rounded border-2 border-stampred px-1.5 py-0.5 text-[10px] text-stampred">
              {minTierLabel.toUpperCase()}+
            </span>
          )}
        </div>
      </div>

      <h3 className="font-game text-[17px] font-bold leading-tight text-dabur-900">{reward.title}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{reward.description}</p>

      <div className="mt-4 flex items-center justify-between">
        <MilesValue miles={reward.pointsCost} signed={false} className="text-lg" />
        <span className={cn("font-mono text-[11px]", outOfStock ? "font-semibold text-stampred" : "text-muted-foreground")}>
          {outOfStock ? "Out of stock" : `${reward.stock} left`}
        </span>
      </div>

      <div className="mt-3">
        {redeemed ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-dabur-50 py-2.5 font-game text-sm font-bold text-dabur-700 ring-2 ring-dabur-300">
            <PackageCheck className="h-4 w-4" aria-hidden /> Claimed — check notifications
          </div>
        ) : (
          <button
            ref={btnRef}
            disabled={!canRedeem}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              startHold();
            }}
            onPointerUp={cancelHold}
            onPointerCancel={cancelHold}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.repeat) startHold();
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter") cancelHold();
            }}
            aria-label={
              canRedeem
                ? `Hold to claim ${reward.title} for ${formatMiles(reward.pointsCost)} miles`
                : undefined
            }
            className={cn(
              "press relative w-full select-none overflow-hidden rounded-xl border-2 py-2.5 font-game text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tang",
              canRedeem
                ? "border-dabur-600 bg-card text-dabur-700"
                : "cursor-not-allowed border-border bg-secondary text-muted-foreground",
            )}
          >
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-dabur-500 to-dabur-600"
              style={{
                clipPath: holding ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
                transition: holding
                  ? `clip-path ${HOLD_MS}ms linear`
                  : "clip-path 200ms cubic-bezier(0.23, 1, 0.32, 1)",
              }}
            />
            <span className={cn("relative z-[1]", holding && "text-white")}>
              {locked ? (
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" aria-hidden /> Unlocks at {minTierLabel}
                </span>
              ) : outOfStock ? (
                "Out of stock"
              ) : pending ? (
                "Claiming…"
              ) : affordable ? (
                "Hold to claim"
              ) : (
                `${formatMiles(reward.pointsCost - balance)} MI to go`
              )}
            </span>
          </button>
        )}
        {error && (
          <p className="mt-2 rounded-lg bg-stampred-soft px-3 py-1.5 text-xs font-semibold text-stampred" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
