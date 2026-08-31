"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gift, Loader2, Rocket, Send } from "lucide-react";
import { requestToJoin, proposeBarter } from "@/actions/join-requests";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";

/** Join / barter CTA block for a single campaign (used on the brief page). */
export function LaunchActions({
  campaignId,
  campaignName,
  brandLabel,
  existingRequestStatus,
}: {
  campaignId: string;
  campaignName: string;
  brandLabel: string;
  existingRequestStatus: string | null;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"join" | "barter" | null>(null);
  const [deliverables, setDeliverables] = useState("");
  const [requestedPerk, setRequestedPerk] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (existingRequestStatus === "APPROVED") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-dabur-50 px-4 py-2.5 ring-1 ring-dabur-100">
          <span className="text-sm font-medium text-dabur-800">You&apos;re on this launch</span>
          <StatusBadge status="APPROVED" />
        </div>
        <Button variant="accent" onClick={() => router.push("/submit")}>
          <Send className="h-4 w-4" /> Submit content
        </Button>
      </div>
    );
  }

  if (existingRequestStatus) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-dabur-50 px-4 py-2.5 ring-1 ring-dabur-100">
        <span className="text-sm font-medium text-dabur-800">Your request</span>
        <StatusBadge status={existingRequestStatus} />
      </div>
    );
  }

  function submitJoin() {
    setError(null);
    startTransition(async () => {
      const result = await requestToJoin({ campaignId, type: "JOIN" });
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
      const result = await proposeBarter({ campaignId, deliverables, requestedPerk });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDialog(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={() => setDialog("join")}>
          <Rocket className="h-4 w-4" /> Request to join
        </Button>
        <Button size="lg" variant="outline" onClick={() => setDialog("barter")}>
          <Gift className="h-4 w-4" /> Propose a barter
        </Button>
      </div>

      <Dialog
        open={dialog === "join"}
        onClose={() => setDialog(null)}
        title={`Join "${campaignName}"?`}
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

      <Dialog
        open={dialog === "barter"}
        onClose={() => setDialog(null)}
        title="Propose a barter collab"
        description={`Pitch your deliverables for ${brandLabel} and the product or perk you'd like in return.`}
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
    </>
  );
}

/** Small "view brief" link used from list cards. */
export function ViewBriefLink({ campaignId }: { campaignId: string }) {
  return (
    <Link
      href={`/launches/${campaignId}`}
      className="text-sm font-semibold text-dabur-600 hover:underline"
    >
      Read the full brief →
    </Link>
  );
}
