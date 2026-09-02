"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { updateCreatorAdmin } from "@/actions/admin";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CREATOR_STATUSES, FOLLOWER_TIERS, TIER_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  PROSPECT: "Prospect — not yet activated",
  ACTIVE: "Active — can be cast",
  PAUSED: "Paused — hidden from casting",
};

/** Brand-side controls: activation status + audience classification. */
export function CreatorAdminControls({
  creatorId,
  status,
  followerTier,
}: {
  creatorId: string;
  status: string;
  followerTier: string;
}) {
  const router = useRouter();
  const [s, setS] = useState(status);
  const [t, setT] = useState(followerTier);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [pending, startTransition] = useTransition();
  const dirty = s !== status || t !== followerTier;

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateCreatorAdmin({
        creatorId,
        status: s as never,
        followerTier: t as never,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setFlash(true);
      setTimeout(() => setFlash(false), 1500);
      router.refresh();
    });
  }

  return (
    <section className="glass-card border-2 border-dabur-200 p-5">
      <h2 className="mb-3 flex items-center gap-2 font-game text-[15px] font-bold text-dabur-900">
        <ShieldCheck className="h-4 w-4 text-dabur-600" aria-hidden /> Brand controls
      </h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1 space-y-1.5">
          <Label htmlFor="ca-status" className="font-mono text-[10px] uppercase">Program status</Label>
          <Select id="ca-status" value={s} onChange={(e) => setS(e.target.value)}>
            {CREATOR_STATUSES.map((v) => (
              <option key={v} value={v}>
                {STATUS_LABELS[v] ?? v}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[200px] flex-1 space-y-1.5">
          <Label htmlFor="ca-tier" className="font-mono text-[10px] uppercase">Audience class</Label>
          <Select id="ca-tier" value={t} onChange={(e) => setT(e.target.value)}>
            {FOLLOWER_TIERS.map((v) => (
              <option key={v} value={v}>
                {TIER_LABELS[v]}
              </option>
            ))}
          </Select>
        </div>
        <button
          onClick={save}
          disabled={!dirty || pending}
          className={cn(
            "press w-28 rounded-lg border-2 py-2.5 font-game text-xs font-bold transition-colors",
            flash
              ? "border-dabur-600 bg-dabur-600 text-white"
              : dirty
                ? "border-tang text-tang-deep hover:bg-tang-soft"
                : "border-border text-muted-foreground opacity-50",
          )}
        >
          {pending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-hidden /> : flash ? "Saved ✓" : "Save"}
        </button>
      </div>
      {error && (
        <p className="mt-2 rounded-lg bg-stampred-soft px-3 py-1.5 text-xs font-semibold text-stampred" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
