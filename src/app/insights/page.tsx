import Link from "next/link";
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Film,
  Flame,
  Users,
  XCircle,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { TierBadge } from "@/components/program/tier-badge";
import { BRAND_LABELS, REGION_FLAGS, REGIONS, type Brand, type Region } from "@/lib/constants";
import { formatPoints } from "@/lib/program";
import { cn, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Single-hue horizontal bar row with a direct value label (no tooltip needed). */
function BarRow({
  label,
  value,
  max,
  sublabel,
}: {
  label: React.ReactNode;
  value: number;
  max: number;
  sublabel?: string;
}) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 shrink-0 truncate text-sm text-dabur-900 sm:w-44">{label}</div>
      <div className="h-5 flex-1 overflow-hidden rounded-md bg-dabur-50">
        <div
          className="h-full rounded-r-[4px] bg-dabur-500 transition-[width] duration-700 ease-out-strong"
          style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
        />
      </div>
      <div className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-dabur-800">
        {value.toLocaleString()}
        {sublabel && <span className="ml-1 text-xs font-normal text-muted-foreground">{sublabel}</span>}
      </div>
    </div>
  );
}

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user) return null;
  const { role, region } = session.user;
  const scoped = role === "MARKETER" && region ? region : null;

  const campaignScope = scoped ? { region: scoped } : {};
  const relScope = scoped ? { campaign: { region: scoped } } : {};
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    joinRequests,
    assets,
    activeCreators,
    creatorsByRegion,
    pointsThirtyDays,
    campaigns,
    topCreators,
  ] = await Promise.all([
    prisma.joinRequest.findMany({ where: relScope, select: { status: true } }),
    prisma.asset.findMany({ where: relScope, select: { status: true } }),
    prisma.creator.count({ where: { status: "ACTIVE" } }),
    prisma.creator.groupBy({ by: ["region"], _count: { _all: true } }),
    prisma.pointsEvent.aggregate({
      _sum: { points: true },
      where: { points: { gt: 0 }, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.campaign.findMany({
      where: campaignScope,
      include: { _count: { select: { joinRequests: true, assets: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.creator.findMany({
      orderBy: { lifetimePoints: "desc" },
      take: 5,
      include: { assets: { select: { status: true } } },
    }),
  ]);

  const jr = {
    pending: joinRequests.filter((r) => r.status === "PENDING").length,
    approved: joinRequests.filter((r) => r.status === "APPROVED").length,
    rejected: joinRequests.filter((r) => r.status === "REJECTED").length,
  };
  const assetCounts = {
    inReview: assets.filter((a) => ["SUBMITTED", "UNDER_REVIEW"].includes(a.status)).length,
    approved: assets.filter((a) => a.status === "APPROVED").length,
    live: assets.filter((a) => a.status === "LIVE").length,
    rejected: assets.filter((a) => a.status === "REJECTED").length,
  };
  const decidedAssets = assetCounts.approved + assetCounts.live + assetCounts.rejected;
  const approvalRate =
    decidedAssets === 0
      ? null
      : Math.round(((assetCounts.approved + assetCounts.live) / decidedAssets) * 100);

  const regionRows = REGIONS.map((r) => ({
    region: r,
    count: creatorsByRegion.find((g) => g.region === r)?._count._all ?? 0,
  })).sort((a, b) => b.count - a.count);
  const regionMax = Math.max(...regionRows.map((r) => r.count), 1);

  const kpis = [
    { label: "In the queue now", value: jr.pending + assetCounts.inReview, icon: ClipboardCheck },
    { label: "Asset approval rate", value: approvalRate === null ? "—" : `${approvalRate}%`, icon: CheckCircle2 },
    { label: "Active creators (program-wide)", value: activeCreators, icon: Users },
    { label: "Points awarded · 30d", value: formatPoints(pointsThirtyDays._sum.points ?? 0), icon: Flame },
  ];

  // Status rows: reserved status colors, always icon + label, never color alone.
  const requestFunnel = [
    { label: "Pending", value: jr.pending, icon: Clock, tone: "bg-amber-100 text-amber-800", bar: "bg-amber-400" },
    { label: "Approved", value: jr.approved, icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-800", bar: "bg-emerald-500" },
    { label: "Rejected", value: jr.rejected, icon: XCircle, tone: "bg-red-100 text-red-800", bar: "bg-red-400" },
  ];
  const assetFunnel = [
    { label: "In review", value: assetCounts.inReview, icon: Clock, tone: "bg-amber-100 text-amber-800", bar: "bg-amber-400" },
    { label: "Approved", value: assetCounts.approved, icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-800", bar: "bg-emerald-500" },
    { label: "Live", value: assetCounts.live, icon: Film, tone: "bg-dabur-100 text-dabur-800", bar: "bg-dabur-600" },
    { label: "Rejected", value: assetCounts.rejected, icon: XCircle, tone: "bg-red-100 text-red-800", bar: "bg-red-400" },
  ];
  const requestMax = Math.max(...requestFunnel.map((r) => r.value), 1);
  const assetMax = Math.max(...assetFunnel.map((r) => r.value), 1);

  return (
    <Shell>
      <FadeUp>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-dabur-900">
            Program <span className="text-gradient-green">Insights</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            {scoped
              ? `Campaign activity scoped to ${REGION_FLAGS[scoped as Region] ?? ""} ${scoped}; creator bench is program-wide.`
              : "The whole program at a glance — all regions, all brands."}
          </p>
        </div>
      </FadeUp>

      {/* KPI tiles */}
      <Stagger className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4" delayChildren={0.1}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <StaggerItem key={kpi.label}>
              <div className="glass-card p-5">
                <Icon className="mb-3 h-5 w-5 text-dabur-500" />
                <p className="text-3xl font-bold tracking-tight text-dabur-900">{kpi.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{kpi.label}</p>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Join request funnel */}
        <FadeUp delay={0.15}>
          <section className="glass-card p-6">
            <h2 className="mb-1 text-lg font-semibold text-dabur-900">Join requests</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              {joinRequests.length} total{scoped ? ` in ${scoped}` : ""}
            </p>
            <div className="space-y-3">
              {requestFunnel.map((row) => {
                const Icon = row.icon;
                const pct = Math.round((row.value / requestMax) * 100);
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className={cn("flex w-32 shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", row.tone)}>
                      <Icon className="h-3.5 w-3.5" /> {row.label}
                    </span>
                    <div className="h-5 flex-1 overflow-hidden rounded-md bg-dabur-50">
                      <div
                        className={cn("h-full rounded-r-[4px] transition-[width] duration-700 ease-out-strong", row.bar)}
                        style={{ width: `${Math.max(pct, row.value > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-dabur-800">
                      {row.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </FadeUp>

        {/* Asset funnel */}
        <FadeUp delay={0.2}>
          <section className="glass-card p-6">
            <h2 className="mb-1 text-lg font-semibold text-dabur-900">Content pipeline</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              {assets.length} asset{assets.length === 1 ? "" : "s"} submitted
              {scoped ? ` in ${scoped}` : ""}
            </p>
            <div className="space-y-3">
              {assetFunnel.map((row) => {
                const Icon = row.icon;
                const pct = Math.round((row.value / assetMax) * 100);
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className={cn("flex w-32 shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", row.tone)}>
                      <Icon className="h-3.5 w-3.5" /> {row.label}
                    </span>
                    <div className="h-5 flex-1 overflow-hidden rounded-md bg-dabur-50">
                      <div
                        className={cn("h-full rounded-r-[4px] transition-[width] duration-700 ease-out-strong", row.bar)}
                        style={{ width: `${Math.max(pct, row.value > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-dabur-800">
                      {row.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </FadeUp>

        {/* Creator bench by region */}
        <FadeUp delay={0.25}>
          <section className="glass-card p-6">
            <h2 className="mb-5 text-lg font-semibold text-dabur-900">Creator bench by region</h2>
            <div className="space-y-3">
              {regionRows.map((row) => (
                <BarRow
                  key={row.region}
                  label={
                    <span>
                      {REGION_FLAGS[row.region]} {row.region}
                    </span>
                  }
                  value={row.count}
                  max={regionMax}
                />
              ))}
            </div>
          </section>
        </FadeUp>

        {/* Top creators */}
        <FadeUp delay={0.3}>
          <section className="glass-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-dabur-900">Top creators</h2>
              <Link href="/creators" className="text-sm font-medium text-dabur-600 hover:underline">
                Directory →
              </Link>
            </div>
            <ul className="space-y-3">
              {topCreators.map((c) => {
                const decided = c.assets.filter((a) =>
                  ["APPROVED", "LIVE", "REJECTED"].includes(a.status),
                );
                const ok = c.assets.filter((a) => ["APPROVED", "LIVE"].includes(a.status)).length;
                const rate = decided.length === 0 ? null : Math.round((ok / decided.length) * 100);
                return (
                  <li key={c.id} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-dabur-300 to-dabur-600 text-xs font-bold text-white">
                      {initials(c.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-dabur-900">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {REGION_FLAGS[c.region as Region] ?? ""} {c.region}
                        {rate !== null ? ` · ${rate}% approval` : ""}
                      </p>
                    </div>
                    <TierBadge points={c.lifetimePoints} />
                    <span className="w-16 text-right text-sm font-bold tabular-nums text-dabur-800">
                      {formatPoints(c.lifetimePoints)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </FadeUp>
      </div>

      {/* Campaign table */}
      <FadeUp delay={0.35}>
        <section className="glass-card mt-6 overflow-hidden">
          <div className="border-b border-dabur-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-dabur-900">Campaigns</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dabur-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-semibold">Campaign</th>
                  <th className="px-4 py-3 font-semibold">Brand</th>
                  <th className="px-4 py-3 font-semibold">Region</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Requests</th>
                  <th className="px-6 py-3 text-right font-semibold">Assets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dabur-50">
                {campaigns.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-dabur-50/40">
                    <td className="px-6 py-3.5">
                      <Link href={`/launches/${c.id}`} className="font-medium text-dabur-900 hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {BRAND_LABELS[c.brand as Brand] ?? c.brand}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {REGION_FLAGS[c.region as Region] ?? ""} {c.region}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          c.status === "LIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.status === "PLANNING"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {c.status === "LIVE" ? "Live" : c.status === "PLANNING" ? "Planning" : "Closed"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-dabur-800">
                      {c._count.joinRequests}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold tabular-nums text-dabur-800">
                      {c._count.assets}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </FadeUp>
    </Shell>
  );
}
