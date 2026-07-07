"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  COLLAB_LABELS,
  COLLAB_TYPES,
  CREATOR_STATUSES,
  FOLLOWER_TIERS,
  REGIONS,
  TIER_LABELS,
} from "@/lib/constants";

export function CreatorFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/creators?${params.toString()}`);
  }

  return (
    <div className="glass-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
      <div className="relative sm:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search name, email, tag…"
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => setParam("q", e.target.value)}
        />
      </div>
      <Select value={searchParams.get("tier") ?? ""} onChange={(e) => setParam("tier", e.target.value)}>
        <option value="">All tiers</option>
        {FOLLOWER_TIERS.map((t) => (
          <option key={t} value={t}>
            {TIER_LABELS[t]}
          </option>
        ))}
      </Select>
      <Select value={searchParams.get("region") ?? ""} onChange={(e) => setParam("region", e.target.value)}>
        <option value="">All regions</option>
        {REGIONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </Select>
      <Select
        value={searchParams.get("category") ?? ""}
        onChange={(e) => setParam("category", e.target.value)}
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-3 lg:col-span-1 lg:grid-cols-1 xl:col-span-1">
        <Select
          value={searchParams.get("collab") ?? ""}
          onChange={(e) => setParam("collab", e.target.value)}
        >
          <option value="">Any collab</option>
          {COLLAB_TYPES.map((c) => (
            <option key={c} value={c}>
              {COLLAB_LABELS[c]}
            </option>
          ))}
        </Select>
        <Select
          value={searchParams.get("status") ?? ""}
          onChange={(e) => setParam("status", e.target.value)}
          className="lg:hidden"
        >
          <option value="">Any status</option>
          {CREATOR_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
