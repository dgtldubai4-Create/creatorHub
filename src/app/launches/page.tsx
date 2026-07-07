import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { LaunchCard } from "@/components/launch-card";
import { LaunchFilters } from "@/components/launch-filters";
import { CATEGORIES, REGIONS, type Category, type Region } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function LaunchesPage({
  searchParams,
}: {
  searchParams: { region?: string; category?: string };
}) {
  const session = await auth();
  if (!session?.user) return null;

  const region = REGIONS.find((r) => r === searchParams.region);
  const category = CATEGORIES.find((c) => c === searchParams.category);

  const campaigns = await prisma.campaign.findMany({
    where: {
      openToCreators: true,
      status: { in: ["LIVE", "PLANNING"] },
      ...(region ? { region } : {}),
    },
    orderBy: [{ status: "asc" }, { startDate: "asc" }],
  });

  // Category filter matches campaigns to the creator category their brand serves.
  const BRAND_CATEGORY: Record<string, Category> = {
    DABUR_AMLA: "HAIR",
    VATIKA: "HAIR",
    HAJMOLA: "HEALTH_OTC",
    DABUR_HERBL: "ORAL",
    REAL: "HEALTH_OTC",
  };
  const filtered = category
    ? campaigns.filter((c) => BRAND_CATEGORY[c.brand] === category)
    : campaigns;

  // The creator's existing requests, to disable duplicate asks.
  const myRequests =
    session.user.role === "CREATOR" && session.user.creatorId
      ? await prisma.joinRequest.findMany({
          where: { creatorId: session.user.creatorId },
          select: { campaignId: true, status: true },
        })
      : [];
  const requestByCampaign = new Map(myRequests.map((r) => [r.campaignId, r.status]));

  return (
    <Shell>
      <FadeUp>
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-dabur-900">
            Open <span className="text-gradient-green">Launches</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Campaigns recruiting creators right now across the Middle East.
          </p>
        </div>
      </FadeUp>

      <FadeUp delay={0.1}>
        <LaunchFilters
          activeRegion={(region as Region | undefined) ?? null}
          activeCategory={(category as Category | undefined) ?? null}
        />
      </FadeUp>

      {filtered.length === 0 ? (
        <FadeUp delay={0.15}>
          <p className="mt-10 rounded-2xl border border-dashed border-dabur-200 p-12 text-center text-muted-foreground">
            No open launches match these filters — try widening your search.
          </p>
        </FadeUp>
      ) : (
        <Stagger className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" delayChildren={0.15}>
          {filtered.map((campaign) => (
            <StaggerItem key={campaign.id}>
              <LaunchCard
                campaign={{
                  id: campaign.id,
                  name: campaign.name,
                  brand: campaign.brand,
                  region: campaign.region,
                  objective: campaign.objective,
                  startDate: campaign.startDate.toISOString(),
                  endDate: campaign.endDate.toISOString(),
                  status: campaign.status,
                  kpis: campaign.kpis,
                }}
                isCreator={session.user.role === "CREATOR"}
                existingRequestStatus={requestByCampaign.get(campaign.id) ?? null}
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </Shell>
  );
}
