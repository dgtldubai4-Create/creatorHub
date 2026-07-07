import Link from "next/link";
import { Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { CreatorFilters } from "@/components/creator-filters";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_LABELS,
  COLLAB_LABELS,
  PLATFORM_LABELS,
  REGION_FLAGS,
  TIER_LABELS,
  parseHandles,
  parseTags,
  type Category,
  type CollabType,
  type FollowerTier,
  type Platform,
  type Region,
} from "@/lib/constants";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface CreatorSearchParams {
  q?: string;
  tier?: string;
  region?: string;
  category?: string;
  collab?: string;
  status?: string;
}

export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: CreatorSearchParams;
}) {
  const session = await auth();
  if (!session?.user || session.user.role === "CREATOR") return null;

  const creators = await prisma.creator.findMany({
    where: {
      ...(searchParams.tier ? { followerTier: searchParams.tier } : {}),
      ...(searchParams.region ? { region: searchParams.region } : {}),
      ...(searchParams.category ? { category: searchParams.category } : {}),
      ...(searchParams.collab ? { collabType: searchParams.collab } : {}),
      ...(searchParams.status ? { status: searchParams.status } : {}),
    },
    orderBy: [{ avgScore: "desc" }, { name: "asc" }],
    include: { _count: { select: { assets: true, joinRequests: true } } },
  });

  // Text search over name/email/tags (SQLite lacks case-insensitive contains).
  const query = searchParams.q?.toLowerCase().trim();
  const filtered = query
    ? creators.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          parseTags(c.tags).some((tag) => tag.toLowerCase().includes(query)),
      )
    : creators;

  return (
    <Shell>
      <FadeUp>
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-dabur-900">
            Creator <span className="text-gradient-green">Directory</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            {filtered.length} creator{filtered.length === 1 ? "" : "s"} on the regional bench.
          </p>
        </div>
      </FadeUp>

      <FadeUp delay={0.08}>
        <CreatorFilters />
      </FadeUp>

      <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" delayChildren={0.15}>
        {filtered.map((creator) => {
          const handles = parseHandles(creator.handles);
          const primaryHandle = handles[creator.primaryPlatform as Platform];
          return (
            <StaggerItem key={creator.id}>
              <Link
                href={`/creators/${creator.id}`}
                className="glass-card card-lift group block p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-dabur-400 to-dabur-700 text-sm font-bold text-white shadow-md transition-transform group-hover:scale-110">
                      {initials(creator.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-dabur-900">{creator.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {primaryHandle ?? PLATFORM_LABELS[creator.primaryPlatform as Platform]} ·{" "}
                        {REGION_FLAGS[creator.region as Region] ?? ""} {creator.region}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={creator.status} />
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">
                    {TIER_LABELS[creator.followerTier as FollowerTier] ?? creator.followerTier}
                  </Badge>
                  <Badge variant="outline">
                    {CATEGORY_LABELS[creator.category as Category] ?? creator.category}
                  </Badge>
                  <Badge variant="accent">
                    {COLLAB_LABELS[creator.collabType as CollabType] ?? creator.collabType}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
                  <span className="text-muted-foreground">
                    {creator._count.joinRequests} request
                    {creator._count.joinRequests === 1 ? "" : "s"} · {creator._count.assets} asset
                    {creator._count.assets === 1 ? "" : "s"}
                  </span>
                  {creator.avgScore !== null ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {creator.avgScore.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not scored yet</span>
                  )}
                </div>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>

      {filtered.length === 0 && (
        <p className="mt-10 rounded-2xl border border-dashed border-dabur-200 p-12 text-center text-muted-foreground">
          No creators match these filters.
        </p>
      )}
    </Shell>
  );
}
