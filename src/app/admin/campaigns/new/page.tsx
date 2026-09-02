import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { Shell } from "@/components/shell";
import { FadeUp } from "@/components/motion";
import { CampaignForm } from "@/components/campaign-form";
import type { Region } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const session = await auth();
  if (!session?.user || session.user.role === "CREATOR") return null;

  const lockedRegion =
    session.user.role === "MARKETER" && session.user.region
      ? (session.user.region as Region)
      : null;

  return (
    <Shell>
      <FadeUp>
        <Link
          href="/admin/campaigns"
          className="mb-4 inline-flex items-center gap-1.5 font-game text-sm font-bold text-dabur-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Campaign Manager
        </Link>
        <h1 className="mb-6 font-game text-3xl font-extrabold text-dabur-900">
          New <span className="text-tang">campaign</span>
        </h1>
      </FadeUp>
      <FadeUp delay={0.08}>
        <div className="mx-auto max-w-3xl">
          <CampaignForm lockedRegion={lockedRegion} />
        </div>
      </FadeUp>
    </Shell>
  );
}
