"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Gift, Loader2, Rocket, Target } from "lucide-react";
import { requestToJoin, proposeBarter } from "@/actions/join-requests";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import {
  BRAND_GRADIENTS,
  BRAND_LABELS,
  REGION_FLAGS,
  parseKpis,
  type Brand,
  type Region,
} from "@/lib/constants";

interface LaunchCardCampaign {
  id: string;
  name: string;
  brand: string;
  region: string;
  objective: string;
  startDate: string;
  endDate: string;
  status: string;
  kpis: string;
}

export function LaunchCard({
  campaign,
  isCreator,
  existingRequestStatus,
}: {
  campaign: LaunchCardCampaign;
  isCreator: boolean;
  existingRequestStatus: string | null;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"join" | "barter" | null>(null);
  const [deliverables, setDeliverables] = useState("");
  const [requestedPerk, setRequestedPerk] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const brand = campaign.brand as Brand;
  const gradient = BRAND_GRADIENTS[brand] ?? "from-dabur-600 to-dabur-800";
  const kpis = parseKpis(campaign.kpis);
  const dateRange = `${new Date(campaign.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(campaign.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  function submitJoin() {
    setError(null);
    startTransition(async () => {
      const result = await requestToJoin({ campaignId: campaign.id, type: "JOIN" });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDialog(null);
      router.refresh();
    });
  }

  function submitBarter() {
    setError(null);
    startTransition(async () => {
      const result = await proposeBarter({
        campaignId: campaign.id,
        deliverables,
        requestedPerk,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDialog(null);
      router.refresh();
    });
  }

  return (
    <article className="glass-card card-lift group flex h-full flex-col overflow-hidden">
      {/* Brand banner */}
      <div
        className={`relative h-28 bg-gradient-to-br ${gradient} p-5 transition-all duration-500 group-hover:h-32`}
      >
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_80%_20%,white,transparent_50%)]" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
              {BRAND_LABELS[brand] ?? campaign.brand}
            </p>
            <h3 className="mt-1 text-lg font-bold leading-snug text-white">{campaign.name}</h3>
          </div>
          <StatusBadge status={campaign.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">{campaign.objective}</p>

        <div className="mt-auto space-y-2 text-sm">
          <p className="flex items-center gap-2 text-dabur-800">
            <Calendar className="h-4 w-4 text-dabur-500" /> {dateRange}
          </p>
          <p className="flex items-center gap-2 text-dabur-800">
            <Target className="h-4 w-4 text-dabur-500" />
            {REGION_FLAGS[campaign.region as Region] ?? ""} {campaign.region}
          </p>
          {Object.keys(kpis).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {Object.entries(kpis).map(([metric, target]) => (
                <span
                  key={metric}
                  className="rounded-md bg-dabur-50 px-2 py-0.5 text-xs font-medium text-dabur-700 ring-1 ring-dabur-100"
                >
                  {metric}: {target}
                </span>
              ))}
            </div>
          )}
        </div>

        {isCreator &&
          (existingRequestStatus ? (
            <div className="flex items-center justify-between rounded-xl bg-dabur-50 px-4 py-2.5 ring-1 ring-dabur-100">
              <span className="text-sm font-medium text-dabur-800">Your request</span>
              <StatusBadge status={existingRequestStatus} />
            </div>
          ) : (
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setDialog("join")}>
                <Rocket className="h-4 w-4" /> Request to Join
              </Button>
              <Button variant="outline" onClick={() => setDialog("barter")}>
                <Gift className="h-4 w-4" /> Barter
              </Button>
            </div>
          ))}
      </div>

      {/* Join confirmation */}
      <Dialog
        open={dialog === "join"}
        onClose={() => setDialog(null)}
        title={`Join "${campaign.name}"?`}
        description="The regional marketing team will review your profile and get back to you."
      >
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDialog(null)}>
            Cancel
          </Button>
          <Button onClick={submitJoin} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send request
          </Button>
        </div>
      </Dialog>

      {/* Barter proposal */}
      <Dialog
        open={dialog === "barter"}
        onClose={() => setDialog(null)}
        title="Propose a barter collab"
        description={`Pitch your deliverables for ${BRAND_LABELS[brand] ?? campaign.brand} and the product or perk you'd like in return.`}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Deliverables</Label>
            <Textarea
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="e.g. 2 Reels + 3 Stories over 4 weeks, Arabic voiceover, usage rights for paid boosting"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Requested product / perk</Label>
            <Input
              value={requestedPerk}
              onChange={(e) => setRequestedPerk(e.target.value)}
              placeholder="e.g. Full Vatika range + giveaway kit for followers"
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={submitBarter} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Gift className="h-4 w-4" /> Send proposal
            </Button>
          </div>
        </div>
      </Dialog>
    </article>
  );
}
