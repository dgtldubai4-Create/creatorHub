// Program mechanics shared by several screens: the Sparks sum, the next-level
// checklist, level kits, the charter and the expiry line.
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Check, Lock, Package, Truck, Warning, X as Times, Equals, HourglassMedium } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, Chip, SimulatedTag } from "../../ui/primitives";
import { useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { ProductArt } from "../../ui/ProductArt";
import { KitBox } from "../../ui/kit";
import { kitsFor, level, levelTasks, sparksExpiry, type LevelTask } from "../../domain/selectors";
import { CHARTER, KIT_LEVELS, LEVEL_KITS, type KitLevel } from "../../domain/policy";
import { SHIPMENT_ORDER } from "../../domain/simulate";
import type { LevelKit, SparksQuote } from "../../domain/types";
import { LevelChip } from "./bits";
import { cn } from "../../ui/cn";

const LEVEL_BG: Record<KitLevel, string> = { insider: "bg-surface-2", pro: "bg-surface-2", ambassador: "bg-surface-2" };

// ---------- The Sparks sum ----------

function Factor({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <span className={cn("inline-flex flex-col items-center rounded-[12px] px-3 py-1.5 leading-none", tone)}>
      <span className="text-[15px] font-medium tabular">{value}</span>
      <span className="mt-1 text-[10px] font-medium opacity-60">{label}</span>
    </span>
  );
}

/** Shows an award as the sum it is: base, each multiplier, and the total. */
export function QuoteBreakdown({ quote, className }: { quote: SparksQuote; className?: string }) {
  const t = useT();
  const { num } = useFormat();
  const x = <Times size={12} weight="bold" className="shrink-0 text-ink-3" />;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} dir="ltr">
      <Factor label={t("sp_base")} value={num(quote.base)} tone="border border-line bg-surface text-ink" />
      {quote.flat ? (
        <Chip tone="neutral">{t("sp_flat")}</Chip>
      ) : (
        <>
          {x}<Factor label={t(`fmt_${quote.format}` as const)} value={`×${quote.formatMult}`} tone="border border-line bg-surface text-ink" />
          {x}<Factor label={t("sp_reach")} value={`×${quote.reachMult}`} tone="border border-line bg-surface text-ink" />
          {x}<Factor label={t("sp_engagement")} value={`×${quote.engagementMult}`} tone="border border-line bg-surface text-ink" />
          {quote.brandMult > 1 && <>{x}<Factor label={t("sp_brands")} value={`×${quote.brandMult}`} tone="border border-line bg-surface text-ink" /></>}
        </>
      )}
      {quote.double && <>{x}<Factor label={t("sp_double")} value="×2" tone="bg-accent-soft text-accent-text" /></>}
      <Equals size={14} weight="bold" className="shrink-0 text-ink-3" />
      <Factor label={t("sparks")} value={`+${num(quote.total)}`} tone="accent-fill" />
    </div>
  );
}

// ---------- Next-level checklist ----------

function TaskRow({ task }: { task: LevelTask }) {
  const t = useT();
  const L = useL();
  const { num } = useFormat();
  const s = useStore();
  const mission = task.missionId ? s.missions.find((m) => m.id === task.missionId) : undefined;
  const track = task.trackId ? s.academy.tracks.find((x) => x.id === task.trackId) : undefined;
  const named = mission ? L(mission.title) : track ? L(track.title) : "";
  const numeric = task.target !== undefined && task.current !== undefined;
  const body = (
    <div className={cn("flex items-center gap-3 px-4 py-3", !task.done && "transition-colors hover:bg-surface-2")}>
      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line", task.done ? "brand-fill border-transparent" : "bg-surface")}>{task.done && <Check size={14} weight="bold" />}</span>
      <div className="min-w-0 flex-1">
        <div className={cn("text-[14.5px] font-medium", task.done && "text-ink-3 line-through decoration-2")}>{t(`task_${task.key}` as const, { target: num(task.target ?? 0) })}</div>
        {!task.done && named && <div className="truncate text-[12.5px] font-medium text-accent-text">{named}</div>}
        {numeric && !task.done && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full border border-line bg-surface-2"><motion.div className="h-full bg-accent-soft" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (task.current! / task.target!) * 100)}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} /></div>
            <span className="text-[12px] font-semibold tabular text-ink-2" dir="ltr">{num(task.current!)}/{num(task.target!)}</span>
          </div>
        )}
      </div>
      {task.done ? <span className="meta shrink-0">{t("taskDone")}</span> : <ArrowRight size={16} weight="bold" className="shrink-0 text-ink-3 rtl:rotate-180" />}
    </div>
  );
  return <li>{task.done ? body : <Link to={task.link} className="block">{body}</Link>}</li>;
}

/** Everything between a creator and their next level, as a list they can tick off. */
export function LevelChecklist({ creatorId, className }: { creatorId: string; className?: string }) {
  const t = useT();
  const s = useStore();
  const lv = level(s, creatorId);
  if (!lv.next) {
    return <div className={cn("label-card flex items-center gap-3 p-5", className)}><LevelChip level="ambassador" /><span className="font-medium">{t("atTopLevel")}</span></div>;
  }
  const next = lv.next as KitLevel;
  const tasks = levelTasks(s, creatorId, next);
  const done = tasks.filter((x) => x.done).length;
  const kit = LEVEL_KITS[next];
  return (
    <div className={cn("label-card overflow-hidden", className)}>
      <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3", LEVEL_BG[next])}>
        <div>
          <div className="text-xl font-semibold">{t("nextLevelTitle", { level: t(`lv_${next}` as const) })}</div>
          <div className="text-[13px] font-medium opacity-80">{next === "ambassador" ? t("nextLevelAmb", { done, total: tasks.length }) : t("nextLevelSub", { done, total: tasks.length, level: t(`lv_${next}` as const) })}</div>
        </div>
        <div className="flex -space-x-2 rtl:space-x-reverse" dir="ltr">
          {kit.items.slice(0, 4).map((it) => { const p = s.products.find((x) => x.id === it.productId); return p ? <ProductArt key={p.id} product={p} brand={s.brands.find((b) => b.id === p.brandId)} size="sm" className="h-11 w-11 rounded-[12px] border border-line" /> : null; })}
        </div>
      </div>
      <ul className="divide-y divide-line">{tasks.map((task) => <TaskRow key={task.key} task={task} />)}</ul>
    </div>
  );
}

// ---------- Level kits ----------

function KitProducts({ level: lvl, size = "sm", className }: { level: KitLevel; size?: "sm" | "md"; className?: string }) {
  const s = useStore();
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {LEVEL_KITS[lvl].items.map((it) => { const p = s.products.find((x) => x.id === it.productId); return p ? <ProductArt key={p.id} product={p} brand={s.brands.find((b) => b.id === p.brandId)} size={size} className={cn("rounded-[12px] border border-line", size === "sm" && "h-12 w-12")} /> : null; })}
    </div>
  );
}

/** One level kit in whatever state it is in: locked, unlocked, on its way, or delivered. */
export function LevelKitCard({ level: lvl, kit, creatorId, hero }: { level: KitLevel; kit?: LevelKit; creatorId: string; hero?: boolean }) {
  const t = useT();
  const s = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const celebrate = useCelebrate();
  const me = s.creators.find((c) => c.id === creatorId)!;
  const name = t(`lv_${lvl}` as const);
  const count = LEVEL_KITS[lvl].items.reduce((n, it) => n + it.qty, 0);
  const mission = s.missions.find((m) => m.id === LEVEL_KITS[lvl].missionId);
  const entry = mission?.entries[creatorId];
  const sh = kit?.shipment;
  const idx = sh ? SHIPMENT_ORDER.indexOf(sh.status) : -1;
  const hasAddress = !!me.address.line1 && !!me.address.phone;
  const claim = () => {
    dispatch({ type: "claimLevelKit", kitId: kit!.id });
    celebrate();
    toast(t("kitClaimed"), "success");
  };

  if (!kit) {
    return (
      <div className="label-card flex flex-col gap-3 bg-surface-2 p-4 opacity-80">
        <div className="flex items-center justify-between gap-2"><span className="text-lg font-semibold">{t("kitTitle", { level: name })}</span><Chip icon={<Lock size={12} weight="bold" />}>{t("kitItems", { n: count })}</Chip></div>
        <KitProducts level={lvl} className="grayscale" />
        <p className="text-[13px] font-medium text-ink-2">{t("kitLocked", { level: name })}</p>
      </div>
    );
  }

  if (!sh) {
    return (
      <div className={cn("slab relative overflow-hidden p-5", !hero && "!shadow-card")}>
        <div className={cn("relative grid grid-cols-1 items-center gap-4", hero && "sm:grid-cols-2")}>
          {hero && <KitBox className="max-w-[300px]">{LEVEL_KITS[lvl].items.slice(0, 3).map((it) => { const p = s.products.find((x) => x.id === it.productId)!; return <ProductArt key={p.id} product={p} brand={s.brands.find((b) => b.id === p.brandId)} size="lg" className="rounded-[12px] shadow-card" />; })}</KitBox>}
          <div>
            <div className="meta">{t("kitItems", { n: count })}</div>
            <div className="mt-1 text-2xl font-semibold md:text-3xl">{t("kitYours", { level: name })}</div>
            <p className="mt-2 text-[14.5px] font-medium opacity-85">{t("kitUnlocked")}</p>
            {!hero && <KitProducts level={lvl} className="mt-3" />}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {hasAddress ? <Button variant="accent" onClick={claim} icon={<Package size={16} weight="bold" />}>{t("claimKit")}</Button> : <Button variant="secondary" to="/creator/profile">{t("address")}</Button>}
              {hasAddress && <span className="text-[12.5px] font-medium opacity-80">{t("kitShipsTo", { city: me.address.city })}</span>}
            </div>
            {!hasAddress && <p className="mt-2 text-[12.5px] font-medium opacity-80">{t("addressMissing")}</p>}
          </div>
        </div>
      </div>
    );
  }

  const delivered = sh.status === "delivered";
  return (
    <div className="label-card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-lg font-semibold"><span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-ink-2", LEVEL_BG[lvl])}>{delivered ? <Check size={15} weight="bold" /> : <Truck size={15} weight="bold" />}</span>{t("kitTitle", { level: name })}</span>
        <Chip tone={delivered ? "lime" : "lemon"}>{t(`sh_${sh.status}` as const)}</Chip>
      </div>
      <KitProducts level={lvl} />
      {!delivered && (
        <>
          <div className="flex items-center gap-1.5" dir="ltr">{SHIPMENT_ORDER.map((st, i) => <span key={st} className={cn("h-2.5 flex-1 rounded-full border border-line", i < idx ? "bg-brand" : i === idx ? "bg-accent" : "bg-surface-2")} title={t(`sh_${st}` as const)} />)}</div>
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] font-medium text-ink-2"><span dir="ltr">{sh.courier} · {sh.trackingNumber}</span><SimulatedTag /></div>
        </>
      )}
      {delivered && (entry?.state === "completed" ? <p className="text-[13px] font-medium text-ink-2">{t("kitUnboxed")}</p> : mission && <div className="flex flex-wrap items-center gap-2"><Button size="sm" to={`/creator/missions/${mission.id}`} iconEnd={<ArrowRight size={14} weight="bold" className="rtl:rotate-180" />}>{t("kitUnboxOpen")}</Button><span className="text-[12.5px] font-semibold">+{LEVEL_KITS[lvl].unboxSparks} {t("sparks")}</span></div>)}
    </div>
  );
}

/** All three level kits for a creator. */
export function LevelKitShelf({ creatorId, className }: { creatorId: string; className?: string }) {
  const s = useStore();
  const mine = kitsFor(s, creatorId);
  return <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-3", className)}>{KIT_LEVELS.map((l) => <LevelKitCard key={l} level={l} kit={mine.find((k) => k.level === l)} creatorId={creatorId} />)}</div>;
}

// ---------- Charter ----------

export function CharterList({ className }: { className?: string }) {
  const L = useL();
  return (
    <ol className={cn("grid grid-cols-1 gap-3", className)}>
      {CHARTER.map((c, i) => (
        <li key={c.key} className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-accent-soft text-[12.5px] font-semibold text-on">{i + 1}</span>
          <div><div className="text-[14.5px] font-semibold">{L(c.title)}</div><p className="text-[13.5px] text-ink-2">{L(c.body)}</p></div>
        </li>
      ))}
    </ol>
  );
}

// ---------- Expiry ----------

export function ExpiryNote({ creatorId, className }: { creatorId: string; className?: string }) {
  const t = useT();
  const { num, date } = useFormat();
  const s = useStore();
  const x = sparksExpiry(s, creatorId);
  if (!x.expiresAt || x.balance <= 0) return null;
  if (x.atRisk || x.expired) {
    return <div className={cn("flex items-start gap-2 rounded-[14px] border border-line bg-rose-soft p-3 text-[13.5px] font-medium text-rose", className)}><Warning size={18} weight="fill" className="mt-0.5 shrink-0" />{t("expiryRisk", { n: num(x.balance), days: Math.max(0, x.daysLeft ?? 0) })}</div>;
  }
  return <p className={cn("flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3", className)}><HourglassMedium size={14} weight="bold" />{t("expiryNote", { date: date(x.expiresAt, { day: "numeric", month: "short", year: "numeric" }) })}</p>;
}
