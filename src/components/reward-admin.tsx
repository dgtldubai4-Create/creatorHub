"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { saveReward } from "@/actions/admin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PROGRAM_TIERS, REWARD_CATEGORIES, REWARD_CATEGORY_LABELS } from "@/lib/program";
import { cn } from "@/lib/utils";

type RewardRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  emoji: string;
  pointsCost: number;
  minTier: string;
  stock: number;
  active: boolean;
};

/** Inline economy controls for one shop item. */
export function RewardAdminRow({ reward, redemptions }: { reward: RewardRow; redemptions: number }) {
  const router = useRouter();
  const [cost, setCost] = useState(reward.pointsCost);
  const [stock, setStock] = useState(reward.stock);
  const [minTier, setMinTier] = useState(reward.minTier);
  const [active, setActive] = useState(reward.active);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty =
    cost !== reward.pointsCost ||
    stock !== reward.stock ||
    minTier !== reward.minTier ||
    active !== reward.active;

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveReward({
        id: reward.id,
        title: reward.title,
        description: reward.description,
        category: reward.category as never,
        emoji: reward.emoji,
        pointsCost: cost,
        minTier: minTier as never,
        stock,
        active,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
      router.refresh();
    });
  }

  return (
    <li className={cn("glass-card flex flex-wrap items-center gap-3 p-4", !active && "opacity-60")}>
      <span className="text-3xl" aria-hidden>{reward.emoji}</span>
      <div className="min-w-[160px] flex-1">
        <p className="font-semibold text-dabur-900">{reward.title}</p>
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {REWARD_CATEGORY_LABELS[reward.category as never] ?? reward.category} · {redemptions} redeemed
        </p>
      </div>
      <div className="w-28">
        <Label htmlFor={`rc-${reward.id}`} className="font-mono text-[10px] uppercase">Miles</Label>
        <Input id={`rc-${reward.id}`} type="number" min={50} value={cost} onChange={(e) => setCost(Number(e.target.value))} />
      </div>
      <div className="w-24">
        <Label htmlFor={`rs-${reward.id}`} className="font-mono text-[10px] uppercase">Stock</Label>
        <Input id={`rs-${reward.id}`} type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} />
      </div>
      <div className="w-36">
        <Label htmlFor={`rt-${reward.id}`} className="font-mono text-[10px] uppercase">Min class</Label>
        <Select id={`rt-${reward.id}`} value={minTier} onChange={(e) => setMinTier(e.target.value)}>
          {PROGRAM_TIERS.map((t) => (
            <option key={t.key} value={t.key}>
              {t.emoji} {t.label}
            </option>
          ))}
        </Select>
      </div>
      <label className="flex cursor-pointer items-center gap-2 pt-4 text-sm font-semibold text-dabur-900">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-dabur-600" />
        Listed
      </label>
      <button
        onClick={save}
        disabled={!dirty || pending}
        className={cn(
          "press w-24 rounded-lg border-2 py-2 font-game text-xs font-bold transition-colors",
          savedFlash
            ? "border-dabur-600 bg-dabur-600 text-white"
            : dirty
              ? "border-tang text-tang-deep hover:bg-tang-soft"
              : "border-border text-muted-foreground opacity-50",
        )}
      >
        {pending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-hidden /> : savedFlash ? "Saved ✓" : "Save"}
      </button>
      {error && (
        <p className="w-full rounded-lg bg-stampred-soft px-3 py-1.5 text-xs font-semibold text-stampred" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

/** Collapsible "add a reward" form. */
export function NewRewardForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "PRODUCT",
    emoji: "🎁",
    pointsCost: 300,
    minTier: "SCOUT",
    stock: 20,
  });

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await saveReward({ ...form, category: form.category as never, minTier: form.minTier as never, active: true });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setForm({ title: "", description: "", category: "PRODUCT", emoji: "🎁", pointsCost: 300, minTier: "SCOUT", stock: 20 });
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-3d inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dabur-600"
      >
        <Plus className="h-4 w-4" aria-hidden /> Add a reward
      </button>
    );
  }

  return (
    <div className="glass-card w-full space-y-4 border-2 border-mango p-5">
      <h2 className="font-game text-lg font-bold text-dabur-900">New shop item</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nr-title">Title</Label>
          <Input id="nr-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Herbolene Winter Box" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nr-emoji">Emoji</Label>
          <Input id="nr-emoji" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nr-desc">Description (creator-facing)</Label>
        <Textarea id="nr-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's in it and why it's worth the miles." />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="nr-cat">Category</Label>
          <Select id="nr-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {REWARD_CATEGORIES.map((c) => (
              <option key={c} value={c}>{REWARD_CATEGORY_LABELS[c]}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nr-cost">Miles</Label>
          <Input id="nr-cost" type="number" min={50} value={form.pointsCost} onChange={(e) => setForm({ ...form, pointsCost: Number(e.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nr-stock">Stock</Label>
          <Input id="nr-stock" type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nr-tier">Min class</Label>
          <Select id="nr-tier" value={form.minTier} onChange={(e) => setForm({ ...form, minTier: e.target.value })}>
            {PROGRAM_TIERS.map((t) => (
              <option key={t.key} value={t.key}>{t.emoji} {t.label}</option>
            ))}
          </Select>
        </div>
      </div>
      {error && (
        <p className="rounded-lg bg-stampred-soft px-3 py-2 text-sm font-semibold text-stampred" role="alert">{error}</p>
      )}
      <div className="flex gap-3">
        <button onClick={submit} disabled={pending} className="btn-3d btn-3d-green rounded-xl px-5 py-2.5 text-sm disabled:opacity-60">
          {pending ? "Adding…" : "Add to shop"}
        </button>
        <button onClick={() => setOpen(false)} className="press rounded-xl border-2 border-border px-5 py-2.5 font-game text-sm font-bold text-muted-foreground">
          Cancel
        </button>
      </div>
    </div>
  );
}
