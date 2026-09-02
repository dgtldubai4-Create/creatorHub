import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp } from "@/components/motion";
import { NewRewardForm, RewardAdminRow } from "@/components/reward-admin";

export const dynamic = "force-dynamic";

export default async function AdminShopPage() {
  const session = await auth();
  if (!session?.user || session.user.role === "CREATOR") return null;

  const rewards = await prisma.reward.findMany({
    include: { _count: { select: { redemptions: true } } },
    orderBy: [{ active: "desc" }, { pointsCost: "asc" }],
  });

  return (
    <Shell>
      <FadeUp>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-game text-3xl font-extrabold text-dabur-900">
              Shop <span className="text-tang">Manager</span>
            </h1>
            <p className="mt-1 max-w-xl text-muted-foreground">
              Prices, stock and class gates for everything creators can claim. Stock is a budget
              line — the shop honestly shows &ldquo;out of stock&rdquo; when it hits zero.
            </p>
          </div>
          <NewRewardForm />
        </div>
      </FadeUp>

      <FadeUp delay={0.1}>
        <ul className="space-y-3">
          {rewards.map((r) => (
            <RewardAdminRow
              key={r.id}
              reward={{
                id: r.id,
                title: r.title,
                description: r.description,
                category: r.category,
                emoji: r.emoji,
                pointsCost: r.pointsCost,
                minTier: r.minTier,
                stock: r.stock,
                active: r.active,
              }}
              redemptions={r._count.redemptions}
            />
          ))}
        </ul>
      </FadeUp>
    </Shell>
  );
}
