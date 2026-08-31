"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, PackageCheck } from "lucide-react";
import { redeemReward } from "@/actions/rewards";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TierBadge } from "@/components/program/tier-badge";
import { REWARD_CATEGORY_LABELS, formatPoints, type RewardCategory } from "@/lib/program";
import { cn } from "@/lib/utils";

const CATEGORY_TONES: Record<RewardCategory, string> = {
  PRODUCT: "bg-emerald-100 text-emerald-800",
  EXPERIENCE: "bg-violet-100 text-violet-800",
  BOOST: "bg-sky-100 text-sky-800",
  VOUCHER: "bg-amber-100 text-amber-800",
};

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
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState(false);
  const [pending, startTransition] = useTransition();

  const affordable = balance >= reward.pointsCost;
  const outOfStock = reward.stock <= 0;
  const locked = !tierUnlocked;
  const canRedeem = !locked && affordable && !outOfStock && !redeemed;

  function redeem() {
    setError(null);
    startTransition(async () => {
      const result = await redeemReward({ rewardId: reward.id });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRedeemed(true);
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <article
      className={cn(
        "tier-shine glass-card card-lift flex h-full flex-col p-6",
        locked && "opacity-75 saturate-50",
      )}
    >
      <div className="mb-3 flex items-start justify-between">
        <span className="text-4xl">{reward.emoji}</span>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              CATEGORY_TONES[reward.category as RewardCategory] ?? "bg-slate-100 text-slate-700",
            )}
          >
            {REWARD_CATEGORY_LABELS[reward.category as RewardCategory] ?? reward.category}
          </span>
          {locked && <TierBadge tierKey={reward.minTier} />}
        </div>
      </div>

      <h3 className="font-semibold text-dabur-900">{reward.title}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{reward.description}</p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-bold text-dabur-800">
          {formatPoints(reward.pointsCost)} <span className="text-sm font-semibold">pts</span>
        </span>
        <span className={cn("text-xs", outOfStock ? "font-semibold text-red-500" : "text-muted-foreground")}>
          {outOfStock ? "Out of stock" : `${reward.stock} left`}
        </span>
      </div>

      <div className="mt-3">
        {redeemed ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <PackageCheck className="h-4 w-4" /> Redeemed — check your notifications
          </div>
        ) : (
          <Button
            className="w-full"
            variant={canRedeem ? "default" : "secondary"}
            disabled={!canRedeem}
            onClick={() => setConfirming(true)}
          >
            {locked ? (
              <>
                <Lock className="h-4 w-4" /> Unlocks at {reward.minTier.charAt(0) + reward.minTier.slice(1).toLowerCase()}
              </>
            ) : outOfStock ? (
              "Out of stock"
            ) : affordable ? (
              "Redeem"
            ) : (
              `${formatPoints(reward.pointsCost - balance)} pts to go`
            )}
          </Button>
        )}
      </div>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Redeem ${reward.title}?`}
        description={`This spends ${formatPoints(reward.pointsCost)} points from your balance of ${formatPoints(balance)}. Your tier is based on lifetime points and won't change.`}
      >
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button onClick={redeem} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm — {formatPoints(reward.pointsCost)} pts
          </Button>
        </div>
      </Dialog>
    </article>
  );
}
