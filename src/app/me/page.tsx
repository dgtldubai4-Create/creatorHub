import Link from "next/link";
import { ExternalLink, MessageSquareQuote } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { AssetTracker } from "@/components/asset-tracker";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  ASSET_TYPE_LABELS,
  BRAND_LABELS,
  type AssetType,
  type Brand,
} from "@/lib/constants";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyStatusPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CREATOR" || !session.user.creatorId) return null;

  const [requests, assets] = await Promise.all([
    prisma.joinRequest.findMany({
      where: { creatorId: session.user.creatorId },
      include: { campaign: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.asset.findMany({
      where: { creatorId: session.user.creatorId },
      include: { campaign: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <Shell>
      <FadeUp>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-dabur-900">
            My <span className="text-gradient-green">Status</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Every request and submission, tracked end to end.
          </p>
        </div>
      </FadeUp>

      {/* Join requests */}
      <FadeUp delay={0.05}>
        <h2 className="mb-4 text-lg font-semibold text-dabur-900">Join requests</h2>
      </FadeUp>
      {requests.length === 0 ? (
        <p className="mb-10 rounded-2xl border border-dashed border-dabur-200 p-8 text-center text-muted-foreground">
          Nothing here yet —{" "}
          <Link href="/launches" className="font-medium text-dabur-600 hover:underline">
            find a launch to join
          </Link>
          .
        </p>
      ) : (
        <Stagger className="mb-10 space-y-3">
          {requests.map((request) => (
            <StaggerItem key={request.id}>
              <div className="glass-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-dabur-900">{request.campaign.name}</p>
                    <Badge variant={request.type === "BARTER" ? "accent" : "outline"}>
                      {request.type === "BARTER" ? "Barter" : "Join"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {BRAND_LABELS[request.campaign.brand as Brand] ?? request.campaign.brand} ·
                    requested {timeAgo(request.createdAt)}
                  </p>
                  {request.proposedTerms && (
                    <p className="mt-2 whitespace-pre-line rounded-lg bg-dabur-50 p-3 text-sm text-dabur-800 ring-1 ring-dabur-100">
                      {request.proposedTerms}
                    </p>
                  )}
                  {request.decisionReason && (
                    <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-100">
                      <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0" />
                      {request.decisionReason}
                    </p>
                  )}
                </div>
                <StatusBadge status={request.status} />
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {/* Assets */}
      <FadeUp delay={0.1}>
        <h2 className="mb-4 text-lg font-semibold text-dabur-900">Submitted assets</h2>
      </FadeUp>
      {assets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-dabur-200 p-8 text-center text-muted-foreground">
          No submissions yet — once a request is approved, submit content from the{" "}
          <Link href="/submit" className="font-medium text-dabur-600 hover:underline">
            Submit Asset
          </Link>{" "}
          page.
        </p>
      ) : (
        <Stagger className="space-y-4">
          {assets.map((asset) => (
            <StaggerItem key={asset.id}>
              <div className="glass-card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {ASSET_TYPE_LABELS[asset.type as AssetType] ?? asset.type}
                      </Badge>
                      <p className="font-semibold text-dabur-900">{asset.campaign.name}</p>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm italic text-muted-foreground">
                      &ldquo;{asset.caption}&rdquo;
                    </p>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-dabur-600 hover:underline"
                    >
                      View content <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    {asset.feedback && (
                      <p
                        className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-sm ring-1 ${
                          asset.status === "REJECTED"
                            ? "bg-red-50 text-red-900 ring-red-100"
                            : "bg-emerald-50 text-emerald-900 ring-emerald-100"
                        }`}
                      >
                        <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0" />
                        {asset.feedback}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <AssetTracker status={asset.status} />
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </Shell>
  );
}
