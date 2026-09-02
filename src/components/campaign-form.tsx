"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { saveCampaign } from "@/actions/admin";
import { campaignSchema, type CampaignInput } from "@/lib/validators";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { confettiBurst } from "@/lib/confetti";
import {
  ASSET_TYPES,
  ASSET_TYPE_LABELS,
  BRANDS,
  BRAND_LABELS,
  CAMPAIGN_STATUSES,
  REGIONS,
  REGION_FLAGS,
  type Region,
} from "@/lib/constants";

// The form keeps dos/donts as textarea strings; they're split into arrays
// (one rule per line) before hitting the zod schema.
type FormShape = Omit<CampaignInput, "dos" | "donts" | "startDate" | "endDate" | "submissionDeadline"> & {
  dosText: string;
  dontsText: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
};

const splitLines = (raw: string) =>
  raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 2)
    .slice(0, 10);

export function CampaignForm({
  initial,
  lockedRegion,
}: {
  initial?: Partial<FormShape> & { id?: string };
  lockedRegion: Region | null;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormShape>({
    defaultValues: {
      name: "",
      brand: "DABUR_AMLA",
      region: lockedRegion ?? "UAE",
      objective: "",
      tagline: "",
      startDate: "",
      endDate: "",
      submissionDeadline: "",
      status: "PLANNING",
      openToCreators: true,
      publicEntry: false,
      basePoints: 100,
      compensation: "",
      deliverables: [{ type: "REEL", qty: 1, notes: "" }],
      kpis: [{ metric: "reach", target: "" }],
      dosText: "",
      dontsText: "",
      ...initial,
    },
  });

  const deliverables = useFieldArray({ control, name: "deliverables" });
  const kpis = useFieldArray({ control, name: "kpis" });

  async function onSubmit(form: FormShape) {
    setServerError(null);
    const candidate = {
      id: initial?.id,
      ...form,
      startDate: form.startDate,
      endDate: form.endDate,
      submissionDeadline: form.submissionDeadline || undefined,
      dos: splitLines(form.dosText),
      donts: splitLines(form.dontsText),
      kpis: form.kpis.filter((k) => k.metric.trim() && k.target.trim()),
    };
    const parsed = campaignSchema.safeParse(candidate);
    if (!parsed.success) {
      setServerError(parsed.error.errors[0]?.message ?? "Check the highlighted fields");
      return;
    }
    const result = await saveCampaign(parsed.data);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    setSaved(true);
    confettiBurst(undefined, undefined, 60);
    setTimeout(() => {
      router.push("/admin/campaigns");
      router.refresh();
    }, 900);
  }

  const err = (msg?: string) =>
    msg ? (
      <p className="text-xs font-semibold text-stampred" role="alert">
        {msg}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Basics */}
      <section className="glass-card space-y-4 p-6">
        <h2 className="font-game text-lg font-bold text-dabur-900">The basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cf-name">Campaign name</Label>
            <Input id="cf-name" {...register("name")} placeholder="Amla Strong Roots Ramadan" />
            {err(errors.name?.message)}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-tagline">Tagline (creator-facing)</Label>
            <Input id="cf-tagline" {...register("tagline")} placeholder="Since 1940. Your turn to tell it." />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="cf-brand">Brand</Label>
            <Select id="cf-brand" {...register("brand")}>
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {BRAND_LABELS[b]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-region">Market</Label>
            <Select id="cf-region" {...register("region")} disabled={!!lockedRegion}>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {REGION_FLAGS[r]} {r}
                </option>
              ))}
            </Select>
            {lockedRegion && (
              <p className="font-mono text-[10px] uppercase text-muted-foreground">
                Locked to your market
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-status">Status</Label>
            <Select id="cf-status" {...register("status")}>
              {CAMPAIGN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "PLANNING" ? "Planning (hidden gates)" : s === "LIVE" ? "Live" : "Closed"}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-objective">Objective</Label>
          <Textarea
            id="cf-objective"
            {...register("objective")}
            placeholder="What this campaign needs to achieve, in the words a creator should read."
          />
          {err(errors.objective?.message)}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="cf-start">Starts</Label>
            <Input id="cf-start" type="date" {...register("startDate")} />
            {err(errors.startDate?.message as string)}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-end">Ends</Label>
            <Input id="cf-end" type="date" {...register("endDate")} />
            {err(errors.endDate?.message as string)}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-deadline">Submissions close</Label>
            <Input id="cf-deadline" type="date" {...register("submissionDeadline")} />
          </div>
        </div>
        <div className="flex flex-wrap gap-6 pt-1">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-dabur-900">
            <input type="checkbox" {...register("openToCreators")} className="h-4 w-4 accent-dabur-600" />
            Open to creator applications
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-dabur-900">
            <input type="checkbox" {...register("publicEntry")} className="h-4 w-4 accent-tang" />
            Public challenge — entry creates the account
          </label>
        </div>
      </section>

      {/* Economy */}
      <section className="glass-card space-y-4 p-6">
        <h2 className="font-game text-lg font-bold text-dabur-900">The economy</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cf-miles">Miles per stamped post</Label>
            <Input id="cf-miles" type="number" min={10} max={1000} {...register("basePoints")} />
            <p className="font-mono text-[10px] uppercase text-muted-foreground">
              Raises or cools creator demand for this brief
            </p>
            {err(errors.basePoints?.message)}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-comp">Compensation (shown on the brief)</Label>
            <Input id="cf-comp" {...register("compensation")} placeholder="AED 2,500–6,000 + product kit" />
          </div>
        </div>
      </section>

      {/* Deliverables */}
      <section className="glass-card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-game text-lg font-bold text-dabur-900">Deliverables</h2>
          <button
            type="button"
            onClick={() => deliverables.append({ type: "STORY", qty: 1, notes: "" })}
            disabled={deliverables.fields.length >= 8}
            className="press inline-flex items-center gap-1.5 rounded-lg border-2 border-dabur-300 px-3 py-1.5 font-game text-xs font-bold text-dabur-700 hover:border-dabur-500 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add
          </button>
        </div>
        {err(errors.deliverables?.message as string)}
        <div className="space-y-3">
          {deliverables.fields.map((field, i) => (
            <div key={field.id} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-paper/60 p-3">
              <div className="w-20 space-y-1">
                <Label htmlFor={`d-qty-${i}`} className="text-xs">Qty</Label>
                <Input id={`d-qty-${i}`} type="number" min={1} max={20} {...register(`deliverables.${i}.qty`)} />
              </div>
              <div className="w-32 space-y-1">
                <Label htmlFor={`d-type-${i}`} className="text-xs">Format</Label>
                <Select id={`d-type-${i}`} {...register(`deliverables.${i}.type`)}>
                  {ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {ASSET_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="min-w-[200px] flex-1 space-y-1">
                <Label htmlFor={`d-notes-${i}`} className="text-xs">Notes for the creator</Label>
                <Input id={`d-notes-${i}`} {...register(`deliverables.${i}.notes`)} placeholder="30–45s, Arabic VO, texture close-up" />
              </div>
              <button
                type="button"
                onClick={() => deliverables.remove(i)}
                disabled={deliverables.fields.length <= 1}
                aria-label="Remove deliverable"
                className="press rounded-lg p-2 text-muted-foreground hover:bg-stampred-soft hover:text-stampred disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Rules */}
      <section className="glass-card space-y-4 p-6">
        <h2 className="font-game text-lg font-bold text-dabur-900">The rules</h2>
        <p className="text-sm text-muted-foreground">One rule per line — they render as the DO / DON&apos;T lists on the brief.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cf-dos" className="text-dabur-700">DO</Label>
            <Textarea id="cf-dos" rows={5} {...register("dosText")} placeholder={"Show the oil texture close-up\nDisclose with #ad in line one"} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-donts" className="text-stampred">DON&apos;T</Label>
            <Textarea id="cf-donts" rows={5} {...register("dontsText")} placeholder={"No medical claims\nNo competitor products in frame"} />
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="glass-card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-game text-lg font-bold text-dabur-900">KPI targets</h2>
          <button
            type="button"
            onClick={() => kpis.append({ metric: "", target: "" })}
            disabled={kpis.fields.length >= 8}
            className="press inline-flex items-center gap-1.5 rounded-lg border-2 border-dabur-300 px-3 py-1.5 font-game text-xs font-bold text-dabur-700 hover:border-dabur-500 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add
          </button>
        </div>
        <div className="space-y-3">
          {kpis.fields.map((field, i) => (
            <div key={field.id} className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <Label htmlFor={`k-m-${i}`} className="text-xs">Metric</Label>
                <Input id={`k-m-${i}`} {...register(`kpis.${i}.metric`)} placeholder="reach" />
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor={`k-t-${i}`} className="text-xs">Target</Label>
                <Input id={`k-t-${i}`} {...register(`kpis.${i}.target`)} placeholder="2M" />
              </div>
              <button
                type="button"
                onClick={() => kpis.remove(i)}
                aria-label="Remove KPI"
                className="press rounded-lg p-2 text-muted-foreground hover:bg-stampred-soft hover:text-stampred"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      </section>

      {serverError && (
        <p className="rounded-xl bg-stampred-soft px-4 py-3 text-sm font-semibold text-stampred" role="alert">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || saved}
        className="btn-3d btn-3d-green flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base disabled:pointer-events-none disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tang"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {saved ? "Saved ✓" : initial?.id ? "Save changes" : "Create campaign"}
      </button>
    </form>
  );
}
