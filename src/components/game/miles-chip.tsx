import { cn } from "@/lib/utils";
import { formatMiles } from "@/lib/program";

/** The gold mile-coin. */
export function Coin({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid flex-none place-items-center rounded-full border-2 border-[#b96f0a] font-game font-bold text-[#7c4a00]",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        background: "radial-gradient(circle at 35% 30%, #ffe9a8, #f0a626 70%, #b96f0a)",
      }}
    >
      M
    </span>
  );
}

/** Pill showing a miles amount with the coin. */
export function MilesChip({
  miles,
  suffix,
  className,
}: {
  miles: number;
  suffix?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-[#e0891f] bg-gradient-to-b from-[#ffd794] to-mango py-0.5 pl-1 pr-3 font-game text-sm font-bold text-[#6b3300]",
        className,
      )}
    >
      <Coin />
      <span className="tabular-nums">{formatMiles(miles)}</span>
      {suffix && <span aria-hidden>{suffix}</span>}
    </span>
  );
}

/** Inline miles value, e.g. "+120 MI", tang-colored. */
export function MilesValue({
  miles,
  signed = true,
  className,
}: {
  miles: number;
  signed?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "whitespace-nowrap font-game font-bold tabular-nums",
        miles < 0 ? "text-stampred" : "text-tang-deep",
        className,
      )}
    >
      {signed && miles >= 0 ? "+" : ""}
      {formatMiles(miles)} MI
    </span>
  );
}
