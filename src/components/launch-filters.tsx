"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  REGIONS,
  REGION_FLAGS,
  type Category,
  type Region,
} from "@/lib/constants";

export function LaunchFilters({
  activeRegion,
  activeCategory,
}: {
  activeRegion: Region | null;
  activeCategory: Category | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: "region" | "category", value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/launches?${params.toString()}`);
  }

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
      active
        ? "border-dabur-600 bg-dabur-600 text-white shadow-md shadow-dabur-600/25 scale-105"
        : "border-dabur-200 bg-white text-dabur-800 hover:border-dabur-400 hover:bg-dabur-50",
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Region
        </span>
        <button className={chip(!activeRegion)} onClick={() => setParam("region", null)}>
          All
        </button>
        {REGIONS.map((r) => (
          <button
            key={r}
            className={chip(activeRegion === r)}
            onClick={() => setParam("region", activeRegion === r ? null : r)}
          >
            {REGION_FLAGS[r]} {r}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Category
        </span>
        <button className={chip(!activeCategory)} onClick={() => setParam("category", null)}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={chip(activeCategory === c)}
            onClick={() => setParam("category", activeCategory === c ? null : c)}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
    </div>
  );
}
