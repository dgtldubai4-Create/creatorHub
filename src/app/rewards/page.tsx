import { Coins, History } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { RewardCard } from "@/components/reward-card";
import { TierBadge } from "@/components/program/tier-badge";
import { formatPoints, tierForPoints, tierRank } from "@/lib/program";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const session = await auth();
  if (!session?.user?.creatorId) return null;
  const creatorId = session.user.creatorId;

  const [creator, rewards, redemptions] = await Promise.all([
    prisma.creator.findUniqueOrThrow({ where: { id: creatorId } }),
    prisma.reward.findMany({ where: { active: true }, orderBy: { pointsCost: "asc" } }),
    prisma.redemption.findMany({
      where: { creatorId },
      include: { reward: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const tier = tierForPoints(creator.lifetimePoints);

  return (
    <Shell>
      <FadeUp>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-dabur-900">
              Rewards <span className="text-gradient-green">Store</span>
            </h1>
            <p className="mt-1 max-w-xl text-muted-foreground">
              Spend points on product drops, boosts and experiences. Redeeming never lowers your
              tier — that&apos;s lifetime points.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white px-5 py-3 shadow-sm">
            <Coins className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-xl font-bold leading-tight text-dabur-900">
                {formatPoints(creator.points)} pts
              </p>
              <p className="text-xs text-muted-foreground">spendable balance</p>
            </div>
            <TierBadge points={creator.lifetimePoints} size="md" className="ml-2" />
          </div>
        </div>
      </FadeUp>

      <Stagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" delayChildren={0.1}>
        {rewards.map((reward) => (
          <StaggerItem key={reward.id}>
            <RewardCard
              reward={reward}
              balance={creator.points}
              tierUnlocked={tierRank(tier.key) >= tierRank(reward.minTier)}
            />
          </StaggerItem>
        ))}
      </Stagger>

      {redemptions.length > 0 && (
        <FadeUp delay={0.25}>
          <section className="glass-card mt-10 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-dabur-900">
              <History className="h-5 w-5 text-dabur-600" /> Your redemptions
            </h2>
            <ul className="space-y-3">
              {redemptions.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-dabur-100 bg-white px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-2xl">{r.reward.emoji}</span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-dabur-900">{r.reward.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(r.createdAt)} · −{formatPoints(r.reward.pointsCost)} pts
                      </p>
                    </div>
                  </div>
                  <span
                    className={
                      r.status === "FULFILLED"
                        ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
                        : "rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
                    }
                  >
                    {r.status === "FULFILLED" ? "Fulfilled" : "On its way"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </FadeUp>
      )}
    </Shell>
  );
}
