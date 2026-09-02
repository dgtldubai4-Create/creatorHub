import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp } from "@/components/motion";
import { StatusBadge } from "@/components/status-badge";
import { ProductImage } from "@/components/product-image";
import { MilesValue } from "@/components/game/miles-chip";
import { BRAND_LABELS, REGION_FLAGS, type Brand, type Region } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  const session = await auth();
  if (!session?.user || session.user.role === "CREATOR") return null;

  const regionScope =
    session.user.role === "MARKETER" && session.user.region ? session.user.region : null;

  const campaigns = await prisma.campaign.findMany({
    where: regionScope ? { region: regionScope } : {},
    include: { _count: { select: { joinRequests: true, assets: true } } },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
  });

  return (
    <Shell>
      <FadeUp>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-game text-3xl font-extrabold text-dabur-900">
              Campaign <span className="text-tang">Manager</span>
            </h1>
            <p className="mt-1 max-w-xl text-muted-foreground">
              Every brief creators see is written here
              {regionScope ? ` — scoped to your ${regionScope} market` : " — all markets"}. Planning
              campaigns stay hidden from the launches board until you flip them live.
            </p>
          </div>
          <Link
            href="/admin/campaigns/new"
            className="btn-3d inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dabur-600"
          >
            <Plus className="h-4 w-4" aria-hidden /> New campaign
          </Link>
        </div>
      </FadeUp>

      <FadeUp delay={0.1}>
        <ul className="space-y-3">
          {campaigns.map((c) => (
            <li key={c.id} className="glass-card flex flex-wrap items-center gap-4 p-4 sm:p-5">
              <ProductImage brand={c.brand as Brand} height={52} />
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
                  {c.region} · {formatDate(c.startDate)} – {formatDate(c.endDate)}
                </p>
              </div>
              <div className="hidden text-center md:block">
                <p className="font-game text-lg font-bold text-dabur-800 tabular-nums">{c._count.joinRequests}</p>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">requests</p>
              </div>
              <div className="hidden text-center md:block">
                <p className="font-game text-lg font-bold text-dabur-800 tabular-nums">{c._count.assets}</p>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">posts</p>
              </div>
              <MilesValue miles={c.basePoints} className="hidden text-sm sm:block" />
              <StatusBadge status={c.status} />
              <Link
                href={`/admin/campaigns/${c.id}/edit`}
                className="press inline-flex items-center gap-1.5 rounded-lg border-2 border-dabur-300 px-3 py-2 font-game text-xs font-bold text-dabur-700 transition-colors hover:border-dabur-600"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
              </Link>
            </li>
          ))}
        </ul>
      </FadeUp>
    </Shell>
  );
}
