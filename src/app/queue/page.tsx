import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp } from "@/components/motion";
import { DecisionButtons, MarkLiveButton } from "@/components/decision-buttons";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ASSET_TYPE_LABELS,
  BRAND_LABELS,
  REGION_FLAGS,
  type AssetType,
  type Brand,
  type Region,
} from "@/lib/constants";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const session = await auth();
  if (!session?.user || session.user.role === "CREATOR") return null;

  // MARKETER: region-scoped. BRAND_LEAD / ADMIN: everything.
  const regionFilter =
    session.user.role === "MARKETER" && session.user.region
      ? { campaign: { region: session.user.region } }
      : {};

  const [pendingRequests, submittedAssets, approvedAssets] = await Promise.all([
    prisma.joinRequest.findMany({
      where: { status: "PENDING", ...regionFilter },
      include: { creator: true, campaign: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.asset.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] }, ...regionFilter },
      include: { creator: true, campaign: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.asset.findMany({
      where: { status: "APPROVED", ...regionFilter },
      include: { creator: true, campaign: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const scopeLabel =
    session.user.role === "MARKETER" && session.user.region
      ? `${REGION_FLAGS[session.user.region]} ${session.user.region} region`
      : "all regions";

  return (
    <Shell>
      <FadeUp>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-dabur-900">
            Approval <span className="text-gradient-green">Queue</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Decisions pending for <strong>{scopeLabel}</strong>. Rejections always require a
            reason — it&apos;s sent straight to the creator.
          </p>
        </div>
      </FadeUp>

      {/* Join requests */}
      <FadeUp delay={0.05}>
        <section className="glass-card mb-8 overflow-hidden">
          <div className="flex items-center justify-between border-b bg-dabur-50/50 px-6 py-4">
            <h2 className="font-semibold text-dabur-900">Pending join requests</h2>
            <Badge variant="warning">{pendingRequests.length} waiting</Badge>
          </div>
          {pendingRequests.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Queue is clear — nothing pending. 🎉
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Proposal</TableHead>
                  <TableHead>Waiting</TableHead>
                  <TableHead className="text-right">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Link
                        href={`/creators/${request.creatorId}`}
                        className="font-medium text-dabur-800 hover:underline"
                      >
                        {request.creator.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {REGION_FLAGS[request.creator.region as Region] ?? ""}{" "}
                        {request.creator.region}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{request.campaign.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {BRAND_LABELS[request.campaign.brand as Brand] ?? request.campaign.brand}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={request.type === "BARTER" ? "accent" : "outline"}>
                        {request.type === "BARTER" ? "Barter" : "Join"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {request.proposedTerms ? (
                        <p className="line-clamp-3 whitespace-pre-line text-xs text-muted-foreground">
                          {request.proposedTerms}
                        </p>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {timeAgo(request.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <DecisionButtons
                          id={request.id}
                          kind="JOIN_REQUEST"
                          subject={`${request.creator.name} → ${request.campaign.name}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </FadeUp>

      {/* Submitted assets */}
      <FadeUp delay={0.1}>
        <section className="glass-card mb-8 overflow-hidden">
          <div className="flex items-center justify-between border-b bg-sky-50/50 px-6 py-4">
            <h2 className="font-semibold text-dabur-900">Assets awaiting review</h2>
            <Badge variant="info">{submittedAssets.length} to review</Badge>
          </div>
          {submittedAssets.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No submissions in review.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submittedAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Link
                        href={`/creators/${asset.creatorId}`}
                        className="font-medium text-dabur-800 hover:underline"
                      >
                        {asset.creator.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{asset.campaign.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {BRAND_LABELS[asset.campaign.brand as Brand] ?? asset.campaign.brand}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ASSET_TYPE_LABELS[asset.type as AssetType] ?? asset.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="line-clamp-2 text-xs italic text-muted-foreground">
                        &ldquo;{asset.caption}&rdquo;
                      </p>
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-dabur-600 hover:underline"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={asset.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <DecisionButtons
                          id={asset.id}
                          kind="ASSET"
                          subject={`${asset.creator.name} · ${asset.campaign.name}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </FadeUp>

      {/* Approved → mark live */}
      {approvedAssets.length > 0 && (
        <FadeUp delay={0.15}>
          <section className="glass-card overflow-hidden">
            <div className="flex items-center justify-between border-b bg-emerald-50/50 px-6 py-4">
              <h2 className="font-semibold text-dabur-900">Approved — ready to go live</h2>
              <Badge variant="success">{approvedAssets.length} approved</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium text-dabur-800">
                      {asset.creator.name}
                    </TableCell>
                    <TableCell>{asset.campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ASSET_TYPE_LABELS[asset.type as AssetType] ?? asset.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <MarkLiveButton id={asset.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </FadeUp>
      )}
    </Shell>
  );
}
