import { cn } from "@/lib/utils";
import { tierForPoints, tierByKey, type ProgramTier } from "@/lib/program";

/** Small tier chip — pass either points or an explicit tier key. */
export function TierBadge({
  points,
  tierKey,
  size = "sm",
  className,
}: {
  points?: number;
  tierKey?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const tier: ProgramTier =
    tierKey !== undefined ? tierByKey(tierKey) : tierForPoints(points ?? 0);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r font-bold text-white shadow-sm",
        tier.gradient,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        className,
      )}
    >
      <span>{tier.emoji}</span>
      <span>{tier.label}</span>
    </span>
  );
}
