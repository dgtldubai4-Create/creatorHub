"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Candy-weight progress bar. Animates to `value` (0–1) on first view.
 * `tone` green = official progress, orange = miles/energy.
 */
export function ChunkyBar({
  value,
  tone = "orange",
  className,
  label,
}: {
  value: number;
  tone?: "orange" | "green";
  className?: string;
  label?: string;
}) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const clamped = Math.max(0, Math.min(1, value));

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setWidth(clamped * 100);
      return;
    }
    const id = requestAnimationFrame(() => setWidth(clamped * 100));
    return () => cancelAnimationFrame(id);
  }, [clamped]);

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-5 rounded-full bg-black/10 p-[3px]", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-1000 ease-out-strong",
          tone === "orange"
            ? "bg-gradient-to-b from-[#ffd794] to-tang shadow-[inset_0_-3px_0_rgba(0,0,0,0.18),inset_0_2px_0_rgba(255,255,255,0.45)]"
            : "bg-gradient-to-b from-[#6fe08e] to-dabur-600 shadow-[inset_0_-3px_0_rgba(0,0,0,0.18),inset_0_2px_0_rgba(255,255,255,0.45)]",
        )}
        style={{ width: `${Math.max(width, clamped > 0 ? 4 : 0)}%` }}
      />
    </div>
  );
}
