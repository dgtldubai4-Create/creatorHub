import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp } from "@/components/motion";
import { CampaignForm } from "@/components/campaign-form";
import { parseJson, parseKpis, parseStringList, type Region } from "@/lib/constants";
import type { Deliverable } from "@/lib/program";

export const dynamic = "force-dynamic";

const toDateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function EditCampaignPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role === "CREATOR") return null;

  const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });
  if (!campaign) notFound();

  const lockedRegion =
    session.user.role === "MARKETER" && session.user.region
      ? (session.user.region as Region)
      : null;
  if (lockedRegion && campaign.region !== lockedRegion) {
    return (
      <Shell>
        <p className="mx-auto max-w-md rounded-2xl bg-stampred-soft p-6 text-center font-semibold text-stampred">
          This campaign runs in {campaign.region} — outside your market.
        </p>
      </Shell>
    );
  }

  const deliverables = parseJson<Deliverable[]>(campaign.deliverables, []);
  const kpis = Object.entries(parseKpis(campaign.kpis)).map(([metric, target]) => ({ metric, target }));

  return (
    <Shell>
      <FadeUp>
        <Link
          href="/admin/campaigns"
          className="mb-4 inline-flex items-center gap-1.5 font-game text-sm font-bold text-dabur-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Campaign Manager
        </Link>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-game text-3xl font-extrabold text-dabur-900">
            Edit: <span className="text-tang">{campaign.name}</span>
          </h1>
          <Link
            href={`/launches/${campaign.id}`}
            className="press inline-flex items-center gap-1.5 rounded-lg border-2 border-border px-3 py-2 font-game text-xs font-bold text-muted-foreground hover:border-dabur-400 hover:text-dabur-700"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden /> View as creators see it
          </Link>
        </div>
      </FadeUp>
      <FadeUp delay={0.08}>
        <div className="mx-auto max-w-3xl">
          <CampaignForm
            lockedRegion={lockedRegion}
            initial={{
              id: campaign.id,
              name: campaign.name,
              brand: campaign.brand as never,
              region: campaign.region as never,
              objective: campaign.objective,
              tagline: campaign.tagline ?? "",
              startDate: toDateInput(campaign.startDate),
              endDate: toDateInput(campaign.endDate),
              submissionDeadline: toDateInput(campaign.submissionDeadline),
              status: campaign.status as never,
              openToCreators: campaign.openToCreators,
              publicEntry: campaign.publicEntry,
              basePoints: campaign.basePoints,
              compensation: campaign.compensation ?? "",
              deliverables: deliverables.length
                ? deliverables.map((d) => ({ type: d.type as never, qty: d.qty, notes: d.notes ?? "" }))
                : [{ type: "REEL" as never, qty: 1, notes: "" }],
              kpis: kpis.length ? kpis : [{ metric: "", target: "" }],
              dosText: parseStringList(campaign.dos).join("\n"),
              dontsText: parseStringList(campaign.donts).join("\n"),
            }}
          />
        </div>
      </FadeUp>
    </Shell>
  );
}
