"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Radio, X } from "lucide-react";
import { decide, markAssetLive } from "@/actions/decisions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DecisionButtons({
  id,
  kind,
  subject,
}: {
  id: string;
  kind: "JOIN_REQUEST" | "ASSET";
  subject: string;
}) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function approve() {
    setError(null);
    startTransition(async () => {
      const result = await decide({ id, kind, decision: "APPROVED" });
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  function reject() {
    setError(null);
    startTransition(async () => {
      const result = await decide({ id, kind, decision: "REJECTED", reason });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRejectOpen(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={approve} disabled={pending}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Approve
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)} disabled={pending}>
        <X className="h-3.5 w-3.5" /> Reject
      </Button>
      {error && !rejectOpen && <span className="text-xs text-red-600">{error}</span>}

      <Dialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={`Reject ${kind === "ASSET" ? "asset" : "request"}`}
        description={`${subject} — a clear reason is required and will be shown to the creator.`}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Reason (required)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                kind === "ASSET"
                  ? "e.g. Packshot uses old packaging — please reshoot with the 2026 design and add #ad."
                  : "e.g. Campaign targets hair creators; this profile skews oral care."
              }
              rows={3}
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={reject} disabled={pending || reason.trim().length < 5}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Reject with reason
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export function MarkLiveButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="accent"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await markAssetLive(id);
          if (result.ok) router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
      Mark Live
    </Button>
  );
}
