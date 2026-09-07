import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useStore } from "../../app/store";
import { useL, useT } from "../../i18n";
import { Button, ChipButton, Field, Input, Select, Sheet, Textarea } from "../../ui/primitives";
import { useToast } from "../../ui/toast";
import { newId } from "../../domain/simulate";
import type { Campaign, FollowerTier, Market, Niche } from "../../domain/types";
import { ProductArt } from "../../ui/ProductArt";
import { cn } from "../../ui/cn";

const NICHES: Niche[] = ["haircare", "beauty", "family", "wellness", "food", "fitness", "lifestyle", "oralcare", "comedy"];
const TIERS: FollowerTier[] = ["nano", "micro", "macro", "mega"];
const MARKETS: Market[] = ["UAE", "KSA"];

const CRITERIA: Campaign["brief"]["acceptance"] = [
  { key: "hook", weight: 30, label: { en: "Product in frame within the first 3 seconds", ar: "المنتج يظهر في الإطار خلال أول 3 ثوانٍ" } },
  { key: "productVisibility", weight: 25, label: { en: "Pack readable for at least 4 seconds", ar: "العبوة مقروءة لمدة 4 ثوانٍ على الأقل" } },
  { key: "captions", weight: 20, label: { en: "Burned-in captions on every spoken line", ar: "ترجمات مدمجة على كل جملة منطوقة" } },
  { key: "loudness", weight: 15, label: { en: "Dialogue between -16 and -12 LUFS", ar: "الحوار بين -16 و-12 LUFS" } },
  { key: "duration", weight: 10, label: { en: "Runtime inside the brief window", ar: "المدة ضمن النطاق المحدد" } },
];

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean).map((x) => ({ en: x, ar: x }));

export function CampaignEditor({ open, onClose, campaign }: { open: boolean; onClose: () => void; campaign?: Campaign }) {
  const t = useT();
  const L = useL();
  const s = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const nav = useNavigate();
  const blank = () => ({
    brandId: s.brands[0].id, titleEn: "", titleAr: "", hookEn: "", hookAr: "", deliverable: "", shots: "", dos: "", donts: "", min: "20", max: "40", points: "500",
    start: new Date().toISOString().slice(0, 10), end: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
    niches: ["haircare"] as Niche[], markets: ["UAE", "KSA"] as Market[], tiers: ["micro", "macro"] as FollowerTier[], kit: {} as Record<string, number>,
  });
  const [f, setF] = useState(blank);
  useEffect(() => {
    if (!open) return;
    if (!campaign) {
      setF(blank());
      return;
    }
    setF({
      brandId: campaign.brandId, titleEn: campaign.title.en, titleAr: campaign.title.ar, hookEn: campaign.hook.en, hookAr: campaign.hook.ar,
      deliverable: campaign.brief.deliverable.en, shots: campaign.brief.shotList.map((x) => x.en).join("\n"), dos: campaign.brief.dos.map((x) => x.en).join("\n"), donts: campaign.brief.donts.map((x) => x.en).join("\n"),
      min: String(campaign.brief.durationSec.min), max: String(campaign.brief.durationSec.max), points: String(campaign.points), start: campaign.window.start, end: campaign.window.end,
      niches: campaign.targetNiches, markets: campaign.targetMarkets, tiers: campaign.targetTiers, kit: Object.fromEntries(campaign.kit.map((k) => [k.productId, k.qty])),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, campaign?.id]);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const toggle = <T extends string>(k: "niches" | "markets" | "tiers", v: T) => setF((x) => ({ ...x, [k]: (x[k] as T[]).includes(v) ? (x[k] as T[]).filter((y) => y !== v) : [...(x[k] as T[]), v] }));
  const products = s.products.filter((p) => p.brandId === f.brandId);
  const valid = f.titleEn.trim() && f.hookEn.trim() && f.deliverable.trim() && Number(f.points) > 0 && Object.keys(f.kit).length > 0;

  const save = () => {
    if (!valid) return;
    const c: Campaign = {
      id: campaign?.id ?? newId("cp", f.titleEn),
      brandId: f.brandId,
      title: { en: f.titleEn.trim(), ar: f.titleAr.trim() || f.titleEn.trim() },
      hook: { en: f.hookEn.trim(), ar: f.hookAr.trim() || f.hookEn.trim() },
      status: campaign?.status ?? "draft",
      brief: { deliverable: { en: f.deliverable, ar: f.deliverable }, shotList: lines(f.shots), dos: lines(f.dos), donts: lines(f.donts), acceptance: campaign?.brief.acceptance ?? CRITERIA, durationSec: { min: Number(f.min) || 10, max: Number(f.max) || 60 } },
      kit: Object.entries(f.kit).map(([productId, qty]) => ({ productId, qty })),
      points: Number(f.points),
      window: { start: f.start, end: f.end },
      targetNiches: f.niches,
      targetMarkets: f.markets,
      targetTiers: f.tiers,
      createdAt: campaign?.createdAt ?? new Date().toISOString(),
    };
    dispatch({ type: "saveCampaign", campaign: c });
    toast(t("campaignSaved"), "success");
    onClose();
    if (!campaign) nav(`/admin/campaigns/${c.id}`);
  };

  return (
    <Sheet open={open} onClose={onClose} title={campaign ? t("editCampaign") : t("newCampaign")} wide>
      <div className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("brand")}><Select value={f.brandId} onChange={(e) => { set("brandId", e.target.value); set("kit", {}); }}>{s.brands.map((b) => <option key={b.id} value={b.id}>{L(b.localisedName)}</option>)}</Select></Field>
          <Field label={t("pointsValue")} required><Input inputMode="numeric" value={f.points} onChange={(e) => set("points", e.target.value.replace(/\D/g, ""))} /></Field>
          <Field label={`${t("campaignTitle")} (EN)`} required><Input value={f.titleEn} onChange={(e) => set("titleEn", e.target.value)} /></Field>
          <Field label={`${t("campaignTitle")} (AR)`}><Input dir="rtl" value={f.titleAr} onChange={(e) => set("titleAr", e.target.value)} /></Field>
          <Field label={`${t("campaignHook")} (EN)`} required><Textarea value={f.hookEn} onChange={(e) => set("hookEn", e.target.value)} className="min-h-16" /></Field>
          <Field label={`${t("campaignHook")} (AR)`}><Textarea dir="rtl" value={f.hookAr} onChange={(e) => set("hookAr", e.target.value)} className="min-h-16" /></Field>
        </div>
        <Field label={t("deliverable")} required><Input value={f.deliverable} onChange={(e) => set("deliverable", e.target.value)} placeholder="One vertical video, 25 to 45 seconds." /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("shotList")} hint="One per line"><Textarea value={f.shots} onChange={(e) => set("shots", e.target.value)} /></Field>
          <Field label={t("dos")} hint="One per line"><Textarea value={f.dos} onChange={(e) => set("dos", e.target.value)} /></Field>
          <Field label={t("donts")} hint="One per line"><Textarea value={f.donts} onChange={(e) => set("donts", e.target.value)} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label={`${t("duration")} min`}><Input inputMode="numeric" value={f.min} onChange={(e) => set("min", e.target.value.replace(/\D/g, ""))} /></Field>
          <Field label={`${t("duration")} max`}><Input inputMode="numeric" value={f.max} onChange={(e) => set("max", e.target.value.replace(/\D/g, ""))} /></Field>
          <Field label={t("windowStart")}><Input type="date" value={f.start} onChange={(e) => set("start", e.target.value)} /></Field>
          <Field label={t("windowEnd")}><Input type="date" value={f.end} onChange={(e) => set("end", e.target.value)} /></Field>
        </div>
        <Field label={t("kit")} required>
          <div className="grid gap-2 sm:grid-cols-2">
            {products.map((p) => {
              const qty = f.kit[p.id] ?? 0;
              return (
                <div key={p.id} className={cn("flex items-center gap-3 rounded-2xl border p-2 pe-3", qty > 0 ? "border-leaf bg-leaf-soft/40" : "border-line")}>
                  <ProductArt product={p} brand={s.brands.find((b) => b.id === p.brandId)} size="sm" className="h-12 w-12" />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{L(p.names)}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" className="h-7 w-7 rounded-full bg-surface-2 font-bold" onClick={() => set("kit", { ...f.kit, [p.id]: Math.max(0, qty - 1) })}>-</button>
                    <span className="w-5 text-center text-[13px] font-semibold tabular">{qty}</span>
                    <button type="button" className="h-7 w-7 rounded-full bg-surface-2 font-bold" onClick={() => set("kit", { ...f.kit, [p.id]: qty + 1 })}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </Field>
        <Field label={t("targets")}>
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">{NICHES.map((n) => <ChipButton key={n} type="button" selected={f.niches.includes(n)} onClick={() => toggle("niches", n)}>{t(`niche_${n}` as const)}</ChipButton>)}</div>
            <div className="flex flex-wrap gap-2">{MARKETS.map((n) => <ChipButton key={n} type="button" selected={f.markets.includes(n)} onClick={() => toggle("markets", n)}>{t(`market_${n}` as const)}</ChipButton>)}{TIERS.map((n) => <ChipButton key={n} type="button" selected={f.tiers.includes(n)} onClick={() => toggle("tiers", n)}>{t(`tier_${n}` as const)}</ChipButton>)}</div>
          </div>
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t("cancel")}</Button>
          <Button disabled={!valid} onClick={save}>{t("saveCampaign")}</Button>
        </div>
      </div>
    </Sheet>
  );
}
