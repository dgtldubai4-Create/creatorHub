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
import { CreatorCardHero } from "@/components/program/creator-card-hero";
import { CountUp, FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { StatusBadge } from "@/components/status-badge";
import { MilesValue } from "@/components/game/miles-chip";
import { Stamp } from "@/components/game/stamp";
import { ProductImage } from "@/components/product-image";
import {
  BRAND_LABELS,
  REGION_FLAGS,
  REGIONS,
  parseJson,
  type Brand,
  type Region,
} from "@/lib/constants";
import {
  POINTS_EVENT_LABELS,
  formatMiles,
  nextTier,
  tierForPoints,
  tierProgress,
  type Deliverable,
  type PointsEventType,
} from "@/lib/program";
import { formatDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Consecutive calendar weeks (ending now) with at least one positive event. */
function streakWeeks(dates: Date[]): number {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let streak = 0;
  for (let w = 0; w < 26; w++) {
    const start = now - (w + 1) * weekMs;
    const end = now - w * weekMs;
    if (dates.some((d) => d.getTime() > start && d.getTime() <= end)) streak++;
    else if (w > 0) break;
  }
  return streak;
}

export default async function HomePage() {
  const session = await auth();

  // ── Signed out → public program landing ──────────────────────────────────
  if (!session?.user) {
    const [creators, liveCampaigns, pointsAgg, flagship] = await Promise.all([
      prisma.creator.count(),
      prisma.campaign.count({ where: { status: "LIVE" } }),
      prisma.pointsEvent.aggregate({ _sum: { points: true }, where: { points: { gt: 0 } } }),
      prisma.campaign.findFirst({
        where: { publicEntry: true, status: "LIVE" },
        select: { id: true, name: true, tagline: true, brand: true },
      }),
    ]);
    return (
      <Landing
        stats={{
          creators,
          liveCampaigns,
          milesAwarded: pointsAgg._sum.points ?? 0,
          regions: REGIONS.length,
        }}
        flagship={flagship}
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
          take: 60,
        }),
        prisma.earning.findMany({ where: { creatorId, status: { in: ["APPROVED", "PAID"] } } }),
        prisma.asset.findMany({ where: { creatorId }, select: { status: true, campaignId: true } }),
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

    const completedCourses = myProgress.filter((p) => p.completedAt !== null).length;
    const positiveDates = events.filter((e) => e.points > 0).map((e) => e.createdAt);
    const lastStampEvent = events.find((e) => e.type === "ASSET_APPROVED");

    // Stamp series: the approved campaign with the most activity.
    const series = approvedJoins
      .map((j) => {
        const deliverables = parseJson<Deliverable[]>(j.campaign.deliverables, []);
        const slots = Math.min(
          Math.max(deliverables.reduce((s, d) => s + (d.qty || 0), 0), 1),
          6,
        );
        const stamped = assets.filter(
          (a) => a.campaignId === j.campaignId && ["APPROVED", "LIVE"].includes(a.status),
        ).length;
        return { campaign: j.campaign, slots, stamped: Math.min(stamped, slots) };
      })
      .sort((a, b) => b.stamped - a.stamped)[0];

    // "Do next" — highest-leverage actions first.
    const actions: Array<{ icon: typeof Wrench; title: string; body: string; href: string; cta: string; tone: string }> = [];
    if (rejectedAssets.length > 0) {
      actions.push({
        icon: Wrench,
        title: "A craft note is waiting",
        body: `“${rejectedAssets[0].campaign.name}” came back with a fix — the resubmit carries a turnaround bonus.`,
        href: "/me",
        cta: "Read the note",
        tone: "border-stampred/40 bg-stampred-soft/60",
      });
    }
    if (completedCourses < courses) {
      actions.push({
        icon: GraduationCap,
        title: "Easy miles in the Academy",
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
        body: `You're cast in ${approvedJoins.length} campaign${approvedJoins.length === 1 ? "" : "s"} — a stamp here banks ${approvedJoins[0].campaign.basePoints}+ miles.`,
        href: "/submit",
        cta: "Submit content",
        tone: "border-mango bg-tang-soft/60",
      });
    } else {
      actions.push({
        icon: Rocket,
        title: "Join your first campaign",
        body: "Open briefs are waiting — request a slot or pitch a barter collab.",
        href: "/launches",
        cta: "Browse campaigns",
        tone: "border-mango bg-tang-soft/60",
      });
    }

    return (
      <Shell>
        <CreatorCardHero
          name={creator.name}
          region={creator.region}
          balance={creator.points}
          lifetime={creator.lifetimePoints}
          tier={{ label: tier.label, emoji: tier.emoji }}
          next={next ? { label: next.label, emoji: next.emoji, min: next.min } : null}
          progress={progress}
          visasHeld={approvedJoins.length}
          streakWeeks={streakWeeks(positiveDates)}
          recentStamp={lastStampEvent ? `STAMPED\n+${lastStampEvent.points} MI` : null}
          stats={[
            { label: "earned", value: earned, href: "/earnings" },
            { label: "approval", value: approvalRate === null ? "—" : `${approvalRate}%`, href: "/me" },
            { label: "live", value: String(assets.filter((a) => a.status === "LIVE").length), href: "/me" },
          ]}
        />

        {/* Do next */}
        <Stagger className="mb-8 grid gap-4 md:grid-cols-3" delayChildren={0.15}>
          {actions.slice(0, 3).map((a) => {
            const Icon = a.icon;
            return (
              <StaggerItem key={a.title}>
                <Link href={a.href} className={`card-lift block h-full rounded-2xl border-2 p-5 ${a.tone}`}>
                  <Icon className="mb-3 h-6 w-6 text-dabur-700" aria-hidden />
                  <h3 className="font-game text-[17px] font-bold text-dabur-900">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                  <span className="mt-3 inline-flex items-center gap-1 font-game text-sm font-bold text-tang-deep">
                    {a.cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="flex flex-col gap-6 lg:col-span-3">
            {/* Stamp series */}
            {series && (
              <FadeUp delay={0.2}>
                <section className="glass-card p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="font-game text-lg font-bold text-dabur-900">
                      {BRAND_LABELS[series.campaign.brand as Brand] ?? series.campaign.brand} stamp series
                    </h2>
                    <span className="font-mono text-xs text-muted-foreground">
                      {series.stamped} / {series.slots} stamped
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <ProductImage brand={series.campaign.brand as Brand} height={64} className="mr-1" />
                    {Array.from({ length: series.slots }).map((_, i) =>
                      i < series.stamped ? (
                        <Stamp key={i} tone={i % 2 ? "orange" : "green"} rotate={i % 2 ? 5 : -6} shape="round" className="h-16 w-16 text-[9px]">
                          STAMPED
                          <br />·{series.campaign.region}·
                        </Stamp>
                      ) : (
                        <span
                          key={i}
                          aria-label="Empty stamp slot"
                          className="grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-border font-game text-lg font-bold text-border"
                        >
                          ?
                        </span>
                      ),
                    )}
                  </div>
                  <p className="mt-4 rounded-xl border border-dashed border-mango bg-tang-soft/50 px-4 py-2.5 text-sm text-inkbrown">
                    Complete the series for an <strong className="font-game text-tang-deep">Upgrade: +500 MI</strong>{" "}
                    and priority review on your next brief.
                  </p>
                </section>
              </FadeUp>
            )}

            {/* Miles activity */}
            <FadeUp delay={0.25}>
              <section className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-game text-lg font-bold text-dabur-900">Miles activity</h2>
                  <span className="font-mono text-xs text-muted-foreground">
                    balance {formatMiles(creator.points)} MI
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {events.slice(0, 7).map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-paper/60 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-dabur-900">{e.note}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {POINTS_EVENT_LABELS[e.type as PointsEventType] ?? e.type} · {timeAgo(e.createdAt)}
                        </p>
                      </div>
                      <MilesValue miles={e.points} className="text-sm" />
                    </li>
                  ))}
                </ul>
              </section>
            </FadeUp>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Open campaigns */}
            <FadeUp delay={0.3}>
              <section className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-game text-lg font-bold text-dabur-900">Open campaigns</h2>
                  <Link href="/launches" className="font-game text-sm font-bold text-dabur-600 hover:underline">
                    All →
                  </Link>
                </div>
                <ul className="space-y-3">
                  {openCampaigns.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/launches/${c.id}`}
                        className="flex items-center gap-3 rounded-xl border border-border bg-paper/60 p-3.5 transition-colors hover:border-dabur-300"
                      >
                        <ProductImage brand={c.brand as Brand} height={44} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-dabur-900">{c.name}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {REGION_FLAGS[c.region as Region] ?? ""} {c.region} · {formatDate(c.startDate)}
                          </p>
                        </div>
                        <MilesValue miles={c.basePoints} className="text-xs" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </FadeUp>

            {/* Shop teaser */}
            {nextReward && (
              <FadeUp delay={0.35}>
                <Link
                  href="/rewards"
                  className="tier-shine card-lift block rounded-2xl border-2 border-mango bg-gradient-to-br from-tang-soft to-card p-6"
                >
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-tang-deep">
                    The shop
                  </p>
                  <h3 className="mt-1 font-game text-lg font-bold text-dabur-900">
                    {nextReward.emoji} {nextReward.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {creator.points >= nextReward.pointsCost
                      ? "You can claim this today — spending never drops your class."
                      : `${formatMiles(nextReward.pointsCost - creator.points)} miles away.`}
                  </p>
                  <MilesValue miles={nextReward.pointsCost} signed={false} className="mt-2 inline-block" />
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
        take: 4,
      }),
    ]);

  const stats = [
    { label: "Active creators", value: activeCreators, icon: Users, href: "/creators", tint: "from-dabur-500 to-dabur-700" },
    { label: "Live campaigns", value: liveCampaigns, icon: Rocket, href: "/launches", tint: "from-tealpop to-cyan-700" },
    { label: "Casting requests", value: pendingApprovals, icon: ClipboardCheck, href: "/queue", tint: "from-mango to-tang" },
    { label: "Content in review", value: assetsAwaiting, icon: Film, href: "/queue", tint: "from-sky-500 to-indigo-600" },
  ];

  return (
    <Shell>
      <FadeUp>
        <section className="mb-8 rounded-3xl border border-border bg-card p-8">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-dabur-600">
            Control Room · {role === "MARKETER" && region ? region : "All markets"}
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-4xl font-bold leading-tight text-dabur-900">
            Ahlan, {firstName}. Creators play the game —{" "}
            <span className="text-tang">you own the board.</span>
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Cast creators, stamp content, and every decision pays out miles and notifies the creator
            automatically.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/queue"
              className="btn-3d inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dabur-600"
            >
              Open the Control Room ({pendingApprovals + assetsAwaiting})
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/insights"
              className="press inline-flex items-center gap-2 rounded-xl border-2 border-border bg-card px-5 py-2.5 font-game text-sm font-bold text-dabur-800 transition-colors hover:border-dabur-400"
            >
              View insights
            </Link>
          </div>
        </section>
      </FadeUp>

      <Stagger className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4" delayChildren={0.12}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={stat.label}>
              <Link href={stat.href} className="glass-card card-lift group block p-5">
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.tint} text-white shadow-md transition-transform duration-200 ease-out-strong group-hover:scale-110 group-hover:rotate-3`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <p className="font-game text-3xl font-extrabold tracking-tight text-dabur-900">
                  <CountUp value={stat.value} />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>

      <FadeUp delay={0.25}>
        <section className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-game text-lg font-bold text-dabur-900">Latest campaigns</h2>
            <Link href="/launches" className="font-game text-sm font-bold text-dabur-600 hover:underline">
              View all →
            </Link>
          </div>
          <ul className="space-y-3">
            {recentCampaigns.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/launches/${c.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-paper/60 p-4 transition-colors hover:border-dabur-300"
                >
                  <ProductImage brand={c.brand as Brand} height={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-dabur-900">
                      {c.name}
                      {c.publicEntry && (
                        <span className="stamped ml-2 inline-block -rotate-3 rounded border-2 border-tang px-1.5 text-[10px] text-tang-deep">
                          PUBLIC
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {BRAND_LABELS[c.brand as Brand] ?? c.brand} · {REGION_FLAGS[c.region as Region] ?? ""}{" "}
                      {c.region} · {formatDate(c.startDate)}
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
