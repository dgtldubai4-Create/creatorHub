import { Crown, Flame, Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { TierBadge } from "@/components/program/tier-badge";
import { REGION_FLAGS, type Region } from "@/lib/constants";
import { formatPoints } from "@/lib/program";
import { cn, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PODIUM_STYLES = [
  "border-amber-300 bg-gradient-to-b from-amber-50 to-white shadow-lg shadow-amber-200/50",
  "border-slate-300 bg-gradient-to-b from-slate-50 to-white",
  "border-orange-300 bg-gradient-to-b from-orange-50 to-white",
];
const PODIUM_MEDALS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.creatorId) return null;
  const myId = session.user.creatorId;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [creators, recentEvents] = await Promise.all([
    prisma.creator.findMany({
      orderBy: { lifetimePoints: "desc" },
      take: 25,
      select: {
        id: true,
        name: true,
        region: true,
        primaryPlatform: true,
        lifetimePoints: true,
      },
    }),
    prisma.pointsEvent.groupBy({
      by: ["creatorId"],
      where: { createdAt: { gte: thirtyDaysAgo }, points: { gt: 0 } },
      _sum: { points: true },
    }),
  ]);
  const monthlyByCreator = new Map(recentEvents.map((e) => [e.creatorId, e._sum.points ?? 0]));

  const podium = creators.slice(0, 3);
  const rest = creators.slice(3);
  const myRank = creators.findIndex((c) => c.id === myId);

  return (
    <Shell>
      <FadeUp>
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-dabur-900">
            The <span className="text-gradient-green">Stars</span> Board
          </h1>
          <p className="mx-auto mt-1 max-w-xl text-muted-foreground">
            Lifetime points across the program.{" "}
            {myRank >= 0 ? `You're #${myRank + 1} of the top ${creators.length}.` : "Climb into the top 25 to appear here."}
          </p>
        </div>
      </FadeUp>

      {/* Podium */}
      <Stagger className="mb-8 grid gap-4 sm:grid-cols-3" delayChildren={0.1}>
        {podium.map((c, i) => (
          <StaggerItem key={c.id} className={cn(i === 0 && "sm:order-2", i === 1 && "sm:order-1", i === 2 && "sm:order-3")}>
            <div
              className={cn(
                "relative flex h-full flex-col items-center rounded-3xl border-2 px-6 pb-6 text-center",
                i === 0 ? "pt-10" : "pt-7",
                PODIUM_STYLES[i],
                c.id === myId && "ring-2 ring-dabur-500 ring-offset-2",
              )}
            >
              {i === 0 && (
                <Crown className="absolute -top-4 h-8 w-8 rotate-12 text-amber-400 drop-shadow" />
              )}
              <span className="text-3xl">{PODIUM_MEDALS[i]}</span>
              <span className="mt-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-dabur-400 to-dabur-700 text-lg font-bold text-white ring-4 ring-white">
                {initials(c.name)}
              </span>
              <p className="mt-3 font-semibold text-dabur-900">
                {c.name}
                {c.id === myId && <span className="ml-1 text-dabur-500">(you)</span>}
              </p>
              <p className="text-sm text-muted-foreground">
                {REGION_FLAGS[c.region as Region] ?? ""} {c.region}
              </p>
              <TierBadge points={c.lifetimePoints} className="mt-2" />
              <p className="mt-3 text-2xl font-bold tabular-nums text-dabur-800">
                {formatPoints(c.lifetimePoints)}
              </p>
              <p className="text-xs text-muted-foreground">lifetime pts</p>
              {(monthlyByCreator.get(c.id) ?? 0) > 0 && (
                <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-orange-600">
                  <Flame className="h-3.5 w-3.5" /> +{formatPoints(monthlyByCreator.get(c.id)!)} this month
                </p>
              )}
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      {/* The rest */}
      <FadeUp delay={0.25}>
        <section className="glass-card overflow-hidden">
          <ul className="divide-y divide-dabur-50">
            {rest.map((c, i) => {
              const rank = i + 4;
              const monthly = monthlyByCreator.get(c.id) ?? 0;
              return (
                <li
                  key={c.id}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3.5 transition-colors",
                    c.id === myId ? "bg-dabur-50/70" : "hover:bg-dabur-50/40",
                  )}
                >
                  <span className="w-8 text-center font-display text-lg font-bold text-muted-foreground">
                    {rank}
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-dabur-300 to-dabur-600 text-sm font-bold text-white">
                    {initials(c.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-dabur-900">
                      {c.name}
                      {c.id === myId && <span className="ml-1 text-sm text-dabur-500">(you)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {REGION_FLAGS[c.region as Region] ?? ""} {c.region}
                    </p>
                  </div>
                  <TierBadge points={c.lifetimePoints} className="hidden sm:inline-flex" />
                  {monthly > 0 && (
                    <span className="hidden items-center gap-1 text-xs font-semibold text-orange-600 md:flex">
                      <Flame className="h-3.5 w-3.5" /> +{formatPoints(monthly)}
                    </span>
                  )}
                  <span className="w-20 text-right font-bold tabular-nums text-dabur-800">
                    {formatPoints(c.lifetimePoints)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </FadeUp>

      <FadeUp delay={0.3}>
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <Trophy className="h-4 w-4 text-amber-500" />
          Approvals, live posts, courses and bonuses all count — redemptions never subtract here.
        </p>
      </FadeUp>
    </Shell>
  );
}
