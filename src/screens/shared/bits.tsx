import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Package, SealCheck, Clock, WarningCircle } from "@phosphor-icons/react";
import type { Brand, Campaign, CampaignStatus, Creator, Product, Stage, VerificationState } from "../../domain/types";
import { phaseOf } from "../../domain/stages";
import { useStore } from "../../app/store";
import { useL, useT } from "../../i18n";
import { Chip, type Tone } from "../../ui/primitives";
import { ProductArt } from "../../ui/ProductArt";
import { cn } from "../../ui/cn";
import { BrandGlyph } from "../../ui/kit";

export function useCurrentCreator(): Creator {
  const s = useStore();
  return s.creators.find((c) => c.id === s.session.creatorId) ?? s.creators[0];
}

export function useBrand(id: string | null | undefined): Brand | undefined {
  const s = useStore();
  return s.brands.find((b) => b.id === id);
}

export function stageTone(stage: Stage): Tone {
  if (stage === "declined") return "rose";
  if (stage === "completed" || stage === "points_released") return "leaf";
  switch (phaseOf(stage)) {
    case "invite": return "marigold";
    case "kit": return "sky";
    case "create": return "leaf";
    case "review": return stage === "changes_requested" ? "rose" : "marigold";
    case "publish": return "leaf";
    default: return "neutral";
  }
}

export function StageChip({ stage, className }: { stage: Stage; className?: string }) {
  const t = useT();
  return <Chip tone={stageTone(stage)} className={className}>{t(`stage_${stage}` as const)}</Chip>;
}

const CS_TONE: Record<CampaignStatus, Tone> = { draft: "neutral", inviting: "marigold", active: "leaf", review: "sky", publishing: "leaf", completed: "ink" };
export function CampaignStatusChip({ status }: { status: CampaignStatus }) {
  const t = useT();
  return <Chip tone={CS_TONE[status]}>{t(`cs_${status}` as const)}</Chip>;
}

export function VerificationChip({ state, label }: { state: VerificationState; label: string }) {
  const t = useT();
  const tone: Tone = state === "verified" ? "leaf" : state === "action" ? "rose" : "neutral";
  const icon = state === "verified" ? <SealCheck size={14} weight="fill" /> : state === "action" ? <WarningCircle size={14} weight="fill" /> : <Clock size={14} weight="bold" />;
  return <Chip tone={tone} icon={icon}>{label}: {t(`vs_${state}` as const)}</Chip>;
}

/** Brand mark: the brand's ingredient glyph and name in its colour. Real logos come with the catalogue sync. */
export function BrandMark({ brand, className, size = "md" }: { brand: Brand; className?: string; size?: "sm" | "md" | "lg" }) {
  const L = useL();
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap font-semibold tracking-tight", size === "sm" ? "text-[12.5px]" : size === "lg" ? "text-xl" : "text-[14px]", className)} style={{ color: brand.hue }}>
      <BrandGlyph brandId={brand.id} size={size === "lg" ? 20 : size === "sm" ? 13 : 15} weight="fill" />
      {L(brand.localisedName)}
    </span>
  );
}

export function KitList({ campaign, compact }: { campaign: Campaign; compact?: boolean }) {
  const s = useStore();
  const L = useL();
  const t = useT();
  const items = campaign.kit.map((k) => ({ ...k, product: s.products.find((p) => p.id === k.productId) })).filter((k): k is typeof k & { product: Product } => !!k.product);
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2 rtl:space-x-reverse">
          {items.slice(0, 4).map((k) => (
            <ProductArt key={k.productId} product={k.product} brand={s.brands.find((b) => b.id === k.product.brandId)} size="sm" className="h-10 w-10 rounded-xl ring-2 ring-surface" />
          ))}
        </div>
        <span className="text-[13px] text-ink-2">{items.reduce((n, k) => n + k.qty, 0)} {t("kit").toLowerCase()}</span>
      </div>
    );
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((k) => (
        <li key={k.productId} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-2 pe-4">
          <ProductArt product={k.product} brand={s.brands.find((b) => b.id === k.product.brandId)} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-medium">{L(k.product.names)}</div>
            <div className="text-[12.5px] text-ink-3">{k.product.type}</div>
          </div>
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold tabular"><Package size={14} />{k.qty}</span>
        </li>
      ))}
    </ul>
  );
}

export function Points({ value, className, sign }: { value: number; className?: string; sign?: boolean }) {
  const t = useT();
  return (
    <span className={cn("inline-flex items-baseline gap-1 tabular", className)}>
      <span className="font-semibold">{sign && value > 0 ? "+" : ""}{value.toLocaleString()}</span>
      <span className="text-[0.8em] text-ink-3">{t("pts")}</span>
    </span>
  );
}

export function CardLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={cn("card press block hover:border-ink-3", className)}>
      {children}
    </Link>
  );
}

// ---------- Program chips ----------

import type { EntryState, Level, MissionType } from "../../domain/types";
import { LevelSeal } from "../../ui/kit";
import { Leaf, Plant, Flower, Tree } from "@phosphor-icons/react";

const LEVEL_TONE: Record<Level, Tone> = { member: "sky", insider: "lime", pro: "grape", ambassador: "tangerine" };
export function LevelChip({ level, className }: { level: Level; className?: string }) {
  const t = useT();
  const Icon = { member: Leaf, insider: Plant, pro: Flower, ambassador: Tree }[level];
  return <Chip tone={LEVEL_TONE[level]} className={className} icon={<Icon size={14} weight="fill" />}>{t(`lv_${level}` as const)}</Chip>;
}

/** Level emblem: a pressed seal. */
export function LevelEmblem({ level, size = 56, className }: { level: Level; size?: number; className?: string }) {
  return <LevelSeal level={level} size={size} className={className} />;
}

const MT_TONE: Record<MissionType, Tone> = { starter: "lime", routine: "sky", monthly: "lemon", team: "bubblegum", review: "neutral", event: "tangerine", academy: "leaf", referral: "sky" };
export function MissionTypeChip({ type, className }: { type: MissionType; className?: string }) {
  const t = useT();
  return <Chip tone={MT_TONE[type]} className={className}>{t(`mt_${type}` as const)}</Chip>;
}

const ES_TONE: Record<EntryState, Tone> = { joined: "marigold", submitted: "sky", approved: "leaf", changes: "rose", completed: "leaf" };
export function EntryChip({ state, className }: { state: EntryState; className?: string }) {
  const t = useT();
  return <Chip tone={ES_TONE[state]} className={className}>{t(`es_${state}` as const)}</Chip>;
}
