import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  Film,
  GraduationCap,
  Rocket,
  Send,
  Users,
  Wrench,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { Landing } from "@/components/landing";
import { CreatorHero } from "@/components/program/creator-hero";
import { CountUp, FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import {
  BRAND_LABELS,
  REGION_FLAGS,
  REGIONS,
  type Brand,
  type Region,
} from "@/lib/constants";
import {
  POINTS_EVENT_LABELS,
  formatPoints,
  nextTier,
  tierForPoints,
  tierProgress,
  type PointsEventType,
} from "@/lib/program";
import { formatDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

  // ── Signed out → public program landing ──────────────────────────────────
  if (!session?.user) {
    const [creators, liveCampaigns, pointsAgg] = await Promise.all([
      prisma.creator.count(),
      prisma.campaign.count({ where: { status: "LIVE" } }),
      prisma.pointsEvent.aggregate({ _sum: { points: true }, where: { points: { gt: 0 } } }),
    ]);
    return (
      <Landing
        stats={{
          creators,
          liveCampaigns,
          pointsAwarded: pointsAgg._sum.points ?? 0,
          regions: REGIONS.length,
        }}
      />
    );
  }

  const { role, region, creatorId, name } = session.user;
  const firstName = (name ?? "there").split(" ")[0];

  // ── Creator dashboard ─────────────────────────────────────────────────────
  if (role === "CREATOR" && creatorId) {
    const [creator, events, earnings, assets, rejectedAssets, courses, myProgress, approvedJoins, openCampaigns, nextReward] =
      await Promise.all([
        prisma.creator.findUniqueOrThrow({ where: { id: creatorId } }),
        prisma.pointsEvent.findMany({
          where: { creatorId },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
        prisma.earning.findMany({ where: { creatorId, status: { in: ["APPROVED", "PAID"] } } }),
        prisma.asset.findMany({ where: { creatorId }, select: { status: true } }),
        prisma.asset.findMany({
          where: { creatorId, status: "REJECTED" },
          include: { campaign: true },
          take: 2,
        }),
        prisma.course.count(),
        prisma.courseProgress.findMany({ where: { creatorId } }),
        prisma.joinRequest.findMany({
          where: { creatorId, status: "APPROVED" },
          include: { campaign: true },
        }),
        prisma.campaign.findMany({
          where: { openToCreators: true, status: { in: ["LIVE", "PLANNING"] } },
          orderBy: { startDate: "asc" },
          take: 3,
        }),
        prisma.reward.findFirst({
          where: { active: true, stock: { gt: 0 } },
          orderBy: { pointsCost: "asc" },
        }),
      ]);

    const tier = tierForPoints(creator.lifetimePoints);
    const next = nextTier(creator.lifetimePoints);
    const progress = tierProgress(creator.lifetimePoints);

    // Earned to date, grouped by currency (approved + paid).
    const byCurrency = new Map<string, number>();
    for (const e of earnings) byCurrency.set(e.currency, (byCurrency.get(e.currency) ?? 0) + e.amount);
    const earned =
      byCurrency.size === 0
        ? "—"
        : [...byCurrency.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([cur, amt]) => `${cur} ${Math.round(amt).toLocaleString()}`)
            .join(" · ");

    const decided = assets.filter((a) => ["APPROVED", "LIVE", "REJECTED"].includes(a.status));
    const approvedCount = assets.filter((a) => ["APPROVED", "LIVE"].includes(a.status)).length;
    const approvalRate = decided.length === 0 ? null : Math.round((approvedCount / decided.length) * 100);
    const liveCount = assets.filter((a) => a.status === "LIVE").length;

    const completedCourses = myProgress.filter((p) => p.completedAt !== null).length;

    // "Do next" — highest-leverage actions first.
    const actions: Array<{ icon: typeof Wrench; title: string; body: string; href: string; cta: string; tone: string }> = [];
    if (rejectedAssets.length > 0) {
      actions.push({
        icon: Wrench,
        title: "Fix and resubmit",
        body: `“${rejectedAssets[0].campaign.name}” came back with a reason — resolve it to keep your approval rate climbing.`,
        href: "/me",
        cta: "See the feedback",
        tone: "border-red-200 bg-red-50",
      });
    }
    if (completedCourses < courses) {
      actions.push({
        icon: GraduationCap,
        title: "Bank easy points in the Academy",
        body: `${courses - completedCourses} course${courses - completedCourses === 1 ? "" : "s"} left — each one pays out before you post a thing.`,
        href: "/academy",
        cta: "Continue learning",
        tone: "border-dabur-200 bg-dabur-50",
      });
    }
    if (approvedJoins.length > 0) {
      actions.push({
        icon: Send,
        title: "Submit your next deliverable",
        body: `You're approved on ${approvedJoins.length} launch${approvedJoins.length === 1 ? "" : "es"} — approved content earns ${approvedJoins[0].campaign.basePoints}+ points here.`,
        href: "/submit",
        cta: "Submit content",
        tone: "border-amber-200 bg-amber-50",
      });
    } else {
      actions.push({
        icon: Rocket,
        title: "Join your first launch",
        body: "Open briefs are waiting — request a slot or pitch a barter collab.",
        href: "/launches",
        cta: "Browse launches",
        tone: "border-amber-200 bg-amber-50",
      });
    }

    return (
      <Shell>
        <CreatorHero
          firstName={firstName}
          points={creator.points}
          lifetimePoints={creator.lifetimePoints}
          tier={{ label: tier.label, emoji: tier.emoji, gradient: tier.gradient }}
          next={next ? { label: next.label, emoji: next.emoji, min: next.min } : null}
          progress={progress}
          stats={[
            { label: "Earned to date", value: earned, href: "/earnings" },
            { label: "Approval rate", value: approvalRate === null ? "—" : `${approvalRate}%`, href: "/me" },
            { label: "Live assets", value: String(liveCount), href: "/me" },
          ]}
        />

        {/* Do next */}
        <Stagger className="mb-8 grid gap-4 md:grid-cols-3" delayChildren={0.2}>
          {actions.slice(0, 3).map((a) => {
            const Icon = a.icon;
            return (
              <StaggerItem key={a.title}>
                <Link href={a.href} className={`card-lift block h-full rounded-2xl border p-5 ${a.tone}`}>
                  <Icon className="mb-3 h-6 w-6 text-dabur-700" />
                  <h3 className="font-semibold text-dabur-900">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-dabur-700">
                    {a.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Points activity */}
          <FadeUp delay={0.3} className="lg:col-span-3">
            <section className="glass-card h-full p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-dabur-900">Points activity</h2>
                <span className="text-sm font-semibold text-dabur-600">
                  Balance: {formatPoints(creator.points)} pts
                </span>
              </div>
              <ul className="space-y-2.5">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-dabur-100 bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-dabur-900">{e.note}</p>
                      <p className="text-xs text-muted-foreground">
                        {POINTS_EVENT_LABELS[e.type as PointsEventType] ?? e.type} · {timeAgo(e.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-bold tabular-nums ${
                        e.points >= 0 ? "text-dabur-600" : "text-red-500"
                      }`}
                    >
                      {e.points >= 0 ? "+" : ""}
                      {formatPoints(e.points)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </FadeUp>

          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Open launches preview */}
            <FadeUp delay={0.4}>
              <section className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-dabur-900">Open launches</h2>
                  <Link href="/launches" className="text-sm font-medium text-dabur-600 hover:underline">
                    All launches →
                  </Link>
                </div>
                <ul className="space-y-3">
                  {openCampaigns.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/launches/${c.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-dabur-100 bg-white p-4 transition-colors hover:border-dabur-300"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-dabur-900">{c.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {BRAND_LABELS[c.brand as Brand] ?? c.brand} ·{" "}
                            {REGION_FLAGS[c.region as Region] ?? ""} {c.region} · {formatDate(c.startDate)}
                          </p>
                        </div>
                        <StatusBadge status={c.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </FadeUp>

            {/* Rewards teaser */}
            {nextReward && (
              <FadeUp delay={0.5}>
                <Link
                  href="/rewards"
                  className="tier-shine card-lift block rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Rewards store
                      </p>
                      <h3 className="mt-1 font-semibold text-dabur-900">
                        {nextReward.emoji} {nextReward.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {creator.points >= nextReward.pointsCost
                          ? "You can redeem this today."
                          : `${formatPoints(nextReward.pointsCost - creator.points)} points away.`}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                      {formatPoints(nextReward.pointsCost)} pts
                    </span>
                  </div>
                </Link>
              </FadeUp>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  // ── Marketer / Brand Lead / Admin home ────────────────────────────────────
  const regionFilter = role === "MARKETER" && region ? { campaign: { region } } : {};

  const [activeCreators, liveCampaigns, pendingApprovals, assetsAwaiting, recentCampaigns] =
    await Promise.all([
      prisma.creator.count({ where: { status: "ACTIVE" } }),
      prisma.campaign.count({
        where: { status: "LIVE", ...(role === "MARKETER" && region ? { region } : {}) },
      }),
      prisma.joinRequest.count({ where: { status: "PENDING", ...regionFilter } }),
      prisma.asset.count({
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] }, ...regionFilter },
      }),
      prisma.campaign.findMany({
        where: role === "MARKETER" && region ? { region } : {},
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

  const stats = [
    { label: "Active creators", value: activeCreators, icon: Users, href: "/creators", tint: "from-dabur-500 to-dabur-700" },
    { label: "Live campaigns", value: liveCampaigns, icon: Rocket, href: "/launches", tint: "from-emerald-500 to-teal-700" },
    { label: "Pending approvals", value: pendingApprovals, icon: ClipboardCheck, href: "/queue", tint: "from-amber-400 to-orange-600" },
    { label: "Assets in review", value: assetsAwaiting, icon: Film, href: "/queue", tint: "from-sky-500 to-indigo-600" },
  ];

  return (
    <Shell>
      <FadeUp>
        <section className="hero-surface relative mb-8 overflow-hidden rounded-3xl px-8 py-12 shadow-xl shadow-dabur-950/20">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 animate-float-slow rounded-full bg-amber-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 animate-float rounded-full bg-dabur-400/25 blur-3xl" />
          <div className="relative">
            <Badge variant="accent" className="mb-4">
              Marketing Cockpit · {role === "MARKETER" && region ? region : "All regions"}
            </Badge>
            <h1 className="font-display max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
              Ahlan, {firstName}.{" "}
              <span className="text-gradient-brand">Your stars are creating.</span>
            </h1>
            <p className="mt-3 max-w-xl text-dabur-200">
              Work the queue, cast the next launch from the directory, and read the program&apos;s
              pulse in Insights.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/queue"
                className="press group inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition-[filter,box-shadow] hover:brightness-105 hover:shadow-xl"
              >
                Open the queue ({pendingApprovals + assetsAwaiting})
                <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out-strong group-hover:translate-x-1" />
              </Link>
              <Link
                href="/insights"
                className="press inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                View insights
              </Link>
            </div>
          </div>
        </section>
      </FadeUp>

      <Stagger className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4" delayChildren={0.15}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={stat.label}>
              <Link href={stat.href} className="glass-card card-lift group block p-5">
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.tint} text-white shadow-lg transition-transform duration-200 ease-out-strong group-hover:scale-110 group-hover:rotate-3`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-bold tracking-tight text-dabur-900">
                  <CountUp value={stat.value} />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>

      <FadeUp delay={0.3}>
        <section className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-dabur-900">Latest campaigns</h2>
            <Link href="/launches" className="text-sm font-medium text-dabur-600 hover:underline">
              View all →
            </Link>
          </div>
          <ul className="space-y-3">
            {recentCampaigns.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/launches/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-dabur-100 bg-white p-4 transition-colors hover:border-dabur-300"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-dabur-900">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {BRAND_LABELS[c.brand as Brand] ?? c.brand} ·{" "}
                      {REGION_FLAGS[c.region as Region] ?? ""} {c.region} · {formatDate(c.startDate)}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </FadeUp>
    </Shell>
  );
}
