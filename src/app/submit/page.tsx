import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp } from "@/components/motion";
import { SubmitAssetForm } from "@/components/submit-asset-form";
import { BRAND_LABELS, type Brand } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CREATOR" || !session.user.creatorId) return null;

  // Only campaigns with an APPROVED join request are submittable.
  const approvedRequests = await prisma.joinRequest.findMany({
    where: { creatorId: session.user.creatorId, status: "APPROVED" },
    include: { campaign: true },
    orderBy: { createdAt: "desc" },
  });

  const campaigns = approvedRequests
    .filter((r) => r.campaign.status !== "CLOSED")
    .map((r) => ({
      id: r.campaign.id,
      label: `${r.campaign.name} · ${BRAND_LABELS[r.campaign.brand as Brand] ?? r.campaign.brand}`,
    }));

  return (
    <Shell>
      <FadeUp>
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-dabur-900">
            Submit an <span className="text-gradient-green">Asset</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Share your content for review — you can submit to campaigns you&apos;ve been approved
            for.
          </p>
        </div>
      </FadeUp>

      <FadeUp delay={0.1}>
        {campaigns.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-lg font-medium text-dabur-900">No approved campaigns yet</p>
            <p className="mt-2 text-muted-foreground">
              Once the team approves one of your join requests, you can submit content here. Browse
              the{" "}
              <Link href="/launches" className="font-medium text-dabur-600 hover:underline">
                open launches
              </Link>{" "}
              to get started.
            </p>
          </div>
        ) : (
          <div className="glass-card max-w-2xl p-8">
            <SubmitAssetForm campaigns={campaigns} />
          </div>
        )}
      </FadeUp>
    </Shell>
  );
}
