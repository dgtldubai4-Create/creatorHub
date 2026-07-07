import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { StatusBadge } from "@/components/status-badge";
import { AssetTracker } from "@/components/asset-tracker";
import { Badge } from "@/components/ui/badge";
import {
  ASSET_TYPE_LABELS,
  BRAND_LABELS,
  CATEGORY_LABELS,
  COLLAB_LABELS,
  PLATFORM_LABELS,
  REGION_FLAGS,
  TIER_LABELS,
  parseHandles,
  parseTags,
  type AssetType,
  type Brand,
  type Category,
  type CollabType,
  type FollowerTier,
  type Platform,
  type Region,
} from "@/lib/constants";
import { formatDate, initials, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CreatorDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role === "CREATOR") return null;

  const creator = await prisma.creator.findUnique({
    where: { id: params.id },
    include: {
      joinRequests: {
        include: { campaign: true, decidedBy: true },
        orderBy: { createdAt: "desc" },
      },
      assets: {
        include: { campaign: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!creator) notFound();

  const handles = parseHandles(creator.handles);
  const tags = parseTags(creator.tags);

  return (
    <Shell>
      <FadeUp>
        <Link
          href="/creators"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-dabur-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to directory
        </Link>

        {/* Profile hero */}
        <section className="hero-surface relative mb-8 overflow-hidden rounded-3xl p-8 shadow-xl shadow-dabur-950/20">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 animate-float-slow rounded-full bg-amber-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-300 to-amber-500 text-3xl font-bold text-amber-950 shadow-xl ring-4 ring-white/20">
              {initials(creator.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-bold text-white">{creator.name}</h1>
                <StatusBadge status={creator.status} />
                {creator.avgScore !== null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-amber-200 ring-1 ring-white/20">
                    <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                    {creator.avgScore.toFixed(1)} avg score
                  </span>
                )}
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-dabur-200">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {creator.email}
                </span>
                <span>
                  {REGION_FLAGS[creator.region as Region] ?? ""} {creator.region}
                </span>
                <span>Since {formatDate(creator.createdAt)}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="accent">
                  {TIER_LABELS[creator.followerTier as FollowerTier] ?? creator.followerTier}
                </Badge>
                <Badge className="bg-white/15 text-white ring-1 ring-white/20">
                  {CATEGORY_LABELS[creator.category as Category] ?? creator.category}
                </Badge>
                <Badge className="bg-white/15 text-white ring-1 ring-white/20">
                  {COLLAB_LABELS[creator.collabType as CollabType] ?? creator.collabType}
                </Badge>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-dabur-500/30 px-2.5 py-0.5 text-xs text-dabur-100 ring-1 ring-dabur-400/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {Object.entries(handles).map(([platform, handle]) => (
                  <span key={platform} className="text-dabur-100">
                    <span className="font-semibold text-white">
                      {PLATFORM_LABELS[platform as Platform] ?? platform}:
                    </span>{" "}
                    {handle}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </FadeUp>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Join history */}
        <FadeUp delay={0.1}>
          <section className="glass-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-dabur-900">
              Campaign requests ({creator.joinRequests.length})
            </h2>
            {creator.joinRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests yet.</p>
            ) : (
              <Stagger className="space-y-3">
                {creator.joinRequests.map((request) => (
                  <StaggerItem key={request.id}>
                    <div className="rounded-xl border border-dabur-100 bg-white p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-dabur-900">{request.campaign.name}</p>
                        <StatusBadge status={request.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {BRAND_LABELS[request.campaign.brand as Brand] ?? request.campaign.brand} ·{" "}
                        {request.type === "BARTER" ? "Barter" : "Join"} ·{" "}
                        {timeAgo(request.createdAt)}
                        {request.decidedBy ? ` · decided by ${request.decidedBy.name}` : ""}
                      </p>
                      {request.proposedTerms && (
                        <p className="mt-2 whitespace-pre-line rounded-lg bg-dabur-50 p-2.5 text-xs text-dabur-800">
                          {request.proposedTerms}
                        </p>
                      )}
                      {request.decisionReason && (
                        <p className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
                          {request.decisionReason}
                        </p>
                      )}
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </section>
        </FadeUp>

        {/* Asset history */}
        <FadeUp delay={0.15}>
          <section className="glass-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-dabur-900">
              Assets ({creator.assets.length})
            </h2>
            {creator.assets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assets submitted yet.</p>
            ) : (
              <Stagger className="space-y-3">
                {creator.assets.map((asset) => (
                  <StaggerItem key={asset.id}>
                    <div className="rounded-xl border border-dabur-100 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {ASSET_TYPE_LABELS[asset.type as AssetType] ?? asset.type}
                          </Badge>
                          <p className="text-sm font-medium text-dabur-900">
                            {asset.campaign.name}
                          </p>
                        </div>
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-dabur-600 hover:underline"
                        >
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs italic text-muted-foreground">
                        &ldquo;{asset.caption}&rdquo;
                      </p>
                      <div className="mt-3">
                        <AssetTracker status={asset.status} />
                      </div>
                      {asset.feedback && (
                        <p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700">
                          {asset.feedback}
                        </p>
                      )}
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </section>
        </FadeUp>
      </div>
    </Shell>
  );
}
