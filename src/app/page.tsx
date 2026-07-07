import Link from "next/link";
import { ArrowRight, ClipboardCheck, Film, Rocket, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { CountUp, FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { BRAND_LABELS, REGION_FLAGS, type Brand, type Region } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  const { role, region, creatorId, name } = session.user;

  const regionFilter =
    role === "MARKETER" && region ? { campaign: { region } } : {};

  const [activeCreators, liveCampaigns, pendingApprovals, assetsAwaiting] = await Promise.all([
    prisma.creator.count({ where: { status: "ACTIVE" } }),
    prisma.campaign.count({
      where: { status: "LIVE", ...(role === "MARKETER" && region ? { region } : {}) },
    }),
    prisma.joinRequest.count({ where: { status: "PENDING", ...regionFilter } }),
    prisma.asset.count({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] }, ...regionFilter },
    }),
  ]);

  const stats = [
    { label: "Active creators", value: activeCreators, icon: Users, href: role === "CREATOR" ? "/launches" : "/creators", tint: "from-dabur-500 to-dabur-700" },
    { label: "Live campaigns", value: liveCampaigns, icon: Rocket, href: "/launches", tint: "from-emerald-500 to-teal-700" },
    { label: "Pending approvals", value: pendingApprovals, icon: ClipboardCheck, href: role === "CREATOR" ? "/me" : "/queue", tint: "from-amber-400 to-orange-600" },
    { label: "Assets in review", value: assetsAwaiting, icon: Film, href: role === "CREATOR" ? "/me" : "/queue", tint: "from-sky-500 to-indigo-600" },
  ];

  // Recent activity strips (role-aware).
  const recentCampaigns = await prisma.campaign.findMany({
    where: role === "MARKETER" && region ? { region } : {},
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const myRequests =
    role === "CREATOR" && creatorId
      ? await prisma.joinRequest.findMany({
          where: { creatorId },
          include: { campaign: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        })
      : [];

  const firstName = (name ?? "there").split(" ")[0];

  return (
    <Shell>
      {/* Hero */}
      <FadeUp>
        <section className="hero-surface relative mb-8 overflow-hidden rounded-3xl px-8 py-12 shadow-xl shadow-dabur-950/20">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 animate-float-slow rounded-full bg-amber-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 animate-float rounded-full bg-dabur-400/25 blur-3xl" />
          <div className="relative">
            <Badge variant="accent" className="mb-4">
              {role === "CREATOR" ? "Creator Portal" : "Marketing Cockpit"} · Middle East
            </Badge>
            <h1 className="font-display max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
              Ahlan, {firstName}.{" "}
              <span className="text-gradient-brand">
                {role === "CREATOR"
                  ? "Your next collab is waiting."
                  : "Your creators are creating."}
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-dabur-200">
              {role === "CREATOR"
                ? "Browse open launches from Dabur Amla, Vatika, Hajmola, Herb'l and Real — request to join, propose barters, and track every submission."
                : "Review join requests and submitted content, keep campaigns moving, and grow the region's creator bench."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/launches"
                className="group inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition-all hover:brightness-105 hover:shadow-xl"
              >
                Explore open launches
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              {role !== "CREATOR" && (
                <Link
                  href="/queue"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
                >
                  Open approval queue
                </Link>
              )}
            </div>
          </div>
        </section>
      </FadeUp>

      {/* Stat tiles */}
      <Stagger className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4" delayChildren={0.15}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={stat.label}>
              <Link
                href={stat.href}
                className="glass-card card-lift group block p-5"
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.tint} text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3`}
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent campaigns */}
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
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-dabur-100 bg-white p-4 transition-colors hover:border-dabur-300"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-dabur-900">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {BRAND_LABELS[c.brand as Brand] ?? c.brand} ·{" "}
                      {REGION_FLAGS[c.region as Region] ?? ""} {c.region} ·{" "}
                      {formatDate(c.startDate)}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          </section>
        </FadeUp>

        {/* Creator: my recent requests / Marketer: quick tips */}
        <FadeUp delay={0.4}>
          <section className="glass-card p-6">
            {role === "CREATOR" ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-dabur-900">My recent requests</h2>
                  <Link href="/me" className="text-sm font-medium text-dabur-600 hover:underline">
                    My status →
                  </Link>
                </div>
                {myRequests.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-dabur-200 p-6 text-center text-sm text-muted-foreground">
                    No requests yet — head to{" "}
                    <Link href="/launches" className="font-medium text-dabur-600 hover:underline">
                      Open Launches
                    </Link>{" "}
                    to find your first collab.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {myRequests.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-dabur-100 bg-white p-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-dabur-900">{r.campaign.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {r.type === "BARTER" ? "Barter proposal" : "Join request"}
                          </p>
                        </div>
                        <StatusBadge status={r.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <h2 className="mb-4 text-lg font-semibold text-dabur-900">Today&apos;s focus</h2>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <span>
                      <strong>{pendingApprovals}</strong> join request
                      {pendingApprovals === 1 ? "" : "s"} waiting for a decision
                      {role === "MARKETER" && region ? ` in ${region}` : " across all regions"}.
                    </span>
                  </li>
                  <li className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
                    <Film className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                    <span>
                      <strong>{assetsAwaiting}</strong> asset{assetsAwaiting === 1 ? "" : "s"}{" "}
                      submitted by creators and awaiting review.
                    </span>
                  </li>
                  <li className="flex items-start gap-3 rounded-xl border border-dabur-200 bg-dabur-50 p-4">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-dabur-600" />
                    <span>
                      The bench holds <strong>{activeCreators}</strong> active creators — browse
                      the{" "}
                      <Link href="/creators" className="font-medium text-dabur-700 underline">
                        directory
                      </Link>{" "}
                      to cast your next launch.
                    </span>
                  </li>
                </ul>
              </>
            )}
          </section>
        </FadeUp>
      </div>
    </Shell>
  );
}
