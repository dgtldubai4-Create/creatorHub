import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Coins,
  Film,
  Target,
  Wallet,
  XCircle,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { StatusBadge } from "@/components/status-badge";
import { LaunchActions } from "@/components/launch-actions";
import {
  ASSET_TYPE_LABELS,
  BRAND_GRADIENTS,
  BRAND_LABELS,
  REGION_FLAGS,
  parseJson,
  parseKpis,
  parseStringList,
  type AssetType,
  type Brand,
  type Region,
} from "@/lib/constants";
import { formatPoints, type Deliverable } from "@/lib/program";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LaunchBriefPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return null;

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { joinRequests: true, assets: true } },
    },
  });
  if (!campaign) notFound();

  const isCreator = session.user.role === "CREATOR";
  const myRequest =
    isCreator && session.user.creatorId
      ? await prisma.joinRequest.findUnique({
          where: {
            creatorId_campaignId: {
              creatorId: session.user.creatorId,
              campaignId: campaign.id,
            },
          },
        })
      : null;

  const pendingHere = !isCreator
    ? await prisma.joinRequest.count({ where: { campaignId: campaign.id, status: "PENDING" } })
    : 0;

  const brand = campaign.brand as Brand;
  const gradient = BRAND_GRADIENTS[brand] ?? "from-dabur-600 to-dabur-800";
  const kpis = parseKpis(campaign.kpis);
  const deliverables = parseJson<Deliverable[]>(campaign.deliverables, []);
  const dos = parseStringList(campaign.dos);
  const donts = parseStringList(campaign.donts);

  return (
    <Shell>
      <FadeUp>
        <Link
          href="/launches"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-dabur-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> All launches
        </Link>

        {/* Brief hero */}
        <section
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} px-6 py-10 text-white shadow-xl sm:px-10`}
        >
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_80%_20%,white,transparent_50%)]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                {BRAND_LABELS[brand] ?? campaign.brand}
              </p>
              <StatusBadge status={campaign.status} />
              {campaign.openToCreators && (
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">
                  Recruiting creators
                </span>
              )}
            </div>
            <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">
              {campaign.name}
            </h1>
            {campaign.tagline && (
              <p className="mt-2 max-w-xl text-lg text-white/85">{campaign.tagline}</p>
            )}
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
              <span className="flex items-center gap-1.5">
                <Target className="h-4 w-4" />
                {REGION_FLAGS[campaign.region as Region] ?? ""} {campaign.region}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
              </span>
              {campaign.submissionDeadline && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Submissions close {formatDate(campaign.submissionDeadline)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Coins className="h-4 w-4" />
                {formatPoints(campaign.basePoints)} pts per approved asset
              </span>
            </div>
            {isCreator && campaign.openToCreators && (
              <div className="mt-7">
                <LaunchActions
                  campaignId={campaign.id}
                  campaignName={campaign.name}
                  brandLabel={BRAND_LABELS[brand] ?? campaign.brand}
                  existingRequestStatus={myRequest?.status ?? null}
                />
              </div>
            )}
            {!isCreator && (
              <div className="mt-7 flex flex-wrap gap-3 text-sm">
                <Link
                  href="/queue"
                  className="press inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 font-semibold backdrop-blur transition-colors hover:bg-white/25"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  {pendingHere} pending request{pendingHere === 1 ? "" : "s"} in the queue
                </Link>
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 font-medium backdrop-blur">
                  <Film className="h-4 w-4" /> {campaign._count.assets} asset
                  {campaign._count.assets === 1 ? "" : "s"} submitted
                </span>
              </div>
            )}
          </div>
        </section>
      </FadeUp>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Objective + deliverables */}
        <div className="space-y-6 lg:col-span-2">
          <FadeUp delay={0.1}>
            <section className="glass-card p-6">
              <h2 className="mb-2 text-lg font-semibold text-dabur-900">The objective</h2>
              <p className="leading-relaxed text-muted-foreground">{campaign.objective}</p>
              {Object.keys(kpis).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(kpis).map(([metric, target]) => (
                    <span
                      key={metric}
                      className="rounded-lg bg-dabur-50 px-3 py-1.5 text-sm font-medium text-dabur-700 ring-1 ring-dabur-100"
                    >
                      {metric}: <strong>{target}</strong>
                    </span>
                  ))}
                </div>
              )}
            </section>
          </FadeUp>

          {deliverables.length > 0 && (
            <FadeUp delay={0.15}>
              <section className="glass-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-dabur-900">Deliverables</h2>
                <Stagger className="space-y-3">
                  {deliverables.map((d, i) => (
                    <StaggerItem key={i}>
                      <div className="flex items-start gap-4 rounded-xl border border-dabur-100 bg-white p-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dabur-600 text-sm font-bold text-white">
                          {d.qty}×
                        </span>
                        <div>
                          <p className="font-semibold text-dabur-900">
                            {ASSET_TYPE_LABELS[d.type as AssetType] ?? d.type}
                          </p>
                          {d.notes && <p className="mt-0.5 text-sm text-muted-foreground">{d.notes}</p>}
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </Stagger>
              </section>
            </FadeUp>
          )}

          {(dos.length > 0 || donts.length > 0) && (
            <FadeUp delay={0.2}>
              <section className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
                  <h3 className="mb-3 font-semibold text-emerald-900">Do</h3>
                  <ul className="space-y-2.5">
                    {dos.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-emerald-900/90">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-red-200 bg-red-50/60 p-6">
                  <h3 className="mb-3 font-semibold text-red-900">Don&apos;t</h3>
                  <ul className="space-y-2.5">
                    {donts.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-red-900/90">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </FadeUp>
          )}
        </div>

        {/* Compensation + points sidebar */}
        <div className="space-y-6">
          <FadeUp delay={0.15}>
            <section className="tier-shine rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-dabur-900">
                <Wallet className="h-5 w-5 text-amber-600" /> Compensation
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {campaign.compensation ?? "Compensation is agreed per creator after approval."}
              </p>
              <div className="mt-4 space-y-2 border-t border-amber-200/70 pt-4 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Per approved asset</span>
                  <strong className="text-dabur-800">+{formatPoints(campaign.basePoints)} pts</strong>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">When it goes live</span>
                  <strong className="text-dabur-800">+50 pts</strong>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Joining the launch</span>
                  <strong className="text-dabur-800">+40 pts</strong>
                </p>
              </div>
            </section>
          </FadeUp>

          <FadeUp delay={0.2}>
            <section className="glass-card p-6 text-sm">
              <h2 className="mb-3 text-lg font-semibold text-dabur-900">How review works</h2>
              <ol className="space-y-3">
                {[
                  "Submit against the deliverables above",
                  "Regional team reviews — Tulsi tier and up within 48h",
                  "Approved: points land instantly. Rejected: you get a written reason and resubmit",
                  "Post it, we verify, live bonus lands",
                ].map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dabur-100 text-xs font-bold text-dabur-700">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </FadeUp>
        </div>
      </div>
    </Shell>
  );
}
