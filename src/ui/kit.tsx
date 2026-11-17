/**
 * The objects every screen is built from: labels, stamps, tickets, a membership
 * card, a certificate, a stamp card and the welcome box. All of them are drawn
 * from the same neutral material; the membership card and the box are the only
 * two that carry their own fixed card stock, because they are physical things.
 */
import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Leaf, Plant, Tooth, Tree, Orange, Pepper, Flower, Hexagon, Jar, Wind, Drop, Flame, Check, type Icon } from "@phosphor-icons/react";
import type { Brand, Level } from "../domain/types";
import { cn } from "./cn";
import { Face } from "./Face";

// ---------- Ingredient glyphs: one per brand, used as the brand's mark and watermark ----------

const GLYPH: Record<string, Icon> = {
  vatika: Leaf,
  "dabur-amla": Plant,
  "dabur-herbl": Flame,
  meswak: Tree,
  "dabur-red": Tooth,
  real: Orange,
  hajmola: Pepper,
  fem: Flower,
  "dabur-honey": Hexagon,
  chyawanprash: Jar,
  odonil: Wind,
  dermoviva: Drop,
};

export function brandGlyph(brandId: string | null | undefined): Icon {
  return (brandId && GLYPH[brandId]) || Leaf;
}

export function BrandGlyph({ brandId, size = 16, weight = "duotone", className }: { brandId: string | null | undefined; size?: number; weight?: "duotone" | "fill" | "regular" | "bold"; className?: string }) {
  const I = brandGlyph(brandId);
  return <I size={size} weight={weight} className={className} />;
}

/** Faint repeated glyph in a corner, the way a label carries its ingredient motif. */
export function Watermark({ brandId, className, count = 3 }: { brandId: string | null | undefined; className?: string; count?: number }) {
  const I = brandGlyph(brandId);
  return (
    <span aria-hidden className={cn("pointer-events-none absolute -bottom-3 -end-3 flex gap-1 text-ink opacity-[0.05]", className)}>
      {Array.from({ length: count }, (_, i) => <I key={i} size={64 - i * 14} weight="light" className="self-end" />)}
    </span>
  );
}

// ---------- Label ----------

export function Label({ children, className, brandId: _brandId, watermark: _watermark, as: Tag = "div", ...rest }: { children: ReactNode; className?: string; brandId?: string | null; watermark?: boolean; as?: "div" | "article" | "section" } & Record<string, unknown>) {
  return (
    <Tag className={cn("label-card relative overflow-hidden", className)} {...rest}>
            {children}
    </Tag>
  );
}

// ---------- Stamp ----------

/** A seal. Empty until earned; a pressed seal lands once, the first time it appears. */
export function Stamp({ pressed, children, size = 64, tone = "leaf", className, icon, animate = true, delay = 0 }: { pressed: boolean; children?: ReactNode; size?: number; tone?: "leaf" | "marigold" | "rose" | "ink"; className?: string; icon?: ReactNode; animate?: boolean; delay?: number }) {
  const reduce = useReducedMotion();
  const color = { leaf: "border-brand text-brand-text bg-brand-soft", marigold: "border-accent text-accent-text bg-accent-soft", rose: "border-rose text-rose bg-rose-soft", ink: "border-line-2 text-ink-2 bg-surface-2" }[tone];
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      {!pressed && <span className="absolute inset-0 rounded-full border border-dashed border-line-2" />}
      {pressed && (
        <span
          className={cn("absolute inset-0 flex items-center justify-center rounded-full border text-center font-medium uppercase leading-none", color)}
          style={{ animation: animate && !reduce ? "stamp-press 420ms cubic-bezier(0.22, 1, 0.36, 1) both" : undefined, fontSize: size * 0.15, letterSpacing: "0.06em", animationDelay: `${delay}ms` }}
        >
          <span className="relative px-1">{icon ?? children ?? <Check weight="bold" size={size * 0.36} />}</span>
        </span>
      )}
    </span>
  );
}

// ---------- Ticket ----------

/** A ticket with a tear-off stub. `stub` sits past the perforation. */
export function Ticket({ children, stub, className, torn, tone = "paper", onClick, to }: { children: ReactNode; stub?: ReactNode; className?: string; torn?: boolean; tone?: "paper" | "marigold" | "forest"; onClick?: () => void; to?: string }) {
  const bg = tone === "marigold" ? "bg-accent-soft text-ink" : tone === "forest" ? "inverse-fill" : "bg-surface text-ink";
  const Comp = to ? motion.a : motion.div;
  return (
    <Comp
      href={to}
      onClick={onClick}
      className={cn("relative flex flex-col overflow-visible rounded-[20px] border border-line shadow-card", bg, (onClick || to) && "lift cursor-pointer", className)}
      initial={false}
      animate={torn ? { opacity: 0.75 } : { opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
    >
      <div className="flex-1 p-5">{children}</div>
      {stub && (
        <div className={cn("perf-x rounded-b-[19px] px-5 py-3", tone === "paper" ? "bg-surface-2/60" : "bg-black/5")}>{stub}</div>
      )}
    </Comp>
  );
}

// ---------- Membership card ----------

const LEVEL_LABEL: Record<Level, string> = { member: "MEMBER", insider: "INSIDER", pro: "PRO", ambassador: "AMBASSADOR" };

/** Card stock per level. Fixed colours: a card looks the same in a light or a dark room. */
const STOCK: Record<Level, { bg: string; fg: string; edge: string; mark: string }> = {
  member: { bg: "linear-gradient(140deg, #f1f1f3 0%, #dcdce2 100%)", fg: "#111114", edge: "rgb(17 17 20 / 0.1)", mark: "#111114" },
  insider: { bg: "linear-gradient(140deg, #1fc46b 0%, #00642f 100%)", fg: "#ffffff", edge: "rgb(255 255 255 / 0.18)", mark: "#ffffff" },
  pro: { bg: "radial-gradient(120% 140% at 100% 0%, #0f5a33 0%, #101013 55%, #0a0a0c 100%)", fg: "#f4f4f5", edge: "rgb(255 255 255 / 0.12)", mark: "#ffb22e" },
  ambassador: { bg: "linear-gradient(140deg, #ffc94f 0%, #f58a07 100%)", fg: "#1c1303", edge: "rgb(28 19 3 / 0.16)", mark: "#1c1303" },
};

export function MembershipCard({ name, handle, level, since, sparks, className, compact, id, hue = 0 }: { name: string; handle: string; level: Level; since: string; sparks: number; className?: string; compact?: boolean; id: string; hue?: number }) {
  const stock = STOCK[level];
  // A deterministic dot matrix stands in for the card's code.
  const dots = Array.from({ length: 36 }, (_, i) => ((id.charCodeAt(i % id.length) * (i + 7)) % 5) > 1);
  return (
    <div className={cn("sheen relative overflow-hidden rounded-[20px] shadow-float", compact ? "aspect-[1.6] w-64" : "aspect-[1.586] w-full max-w-md", className)} style={{ background: stock.bg, color: stock.fg, boxShadow: `inset 0 0 0 1px ${stock.edge}, var(--shadow-float)` }}>
      <div className="flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2"><Leaf size={16} weight="fill" style={{ color: stock.mark }} /><span className="text-[11.5px] font-medium tracking-[0.14em]">DABUR SQUAD</span></div>
          <span className="text-[11px] font-medium tracking-[0.14em] opacity-70">{LEVEL_LABEL[level]}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-6 gap-1" aria-hidden>
            {dots.map((on, i) => <span key={i} className={cn("h-1 w-1 rounded-full bg-current", on ? "opacity-60" : "opacity-15")} />)}
          </div>
          <Face name={name} hue={hue} size={compact ? 44 : 64} />
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className={cn("truncate font-medium tracking-tight", compact ? "text-[15px]" : "text-xl")}>{name}</div>
            <div className="truncate text-[12px] opacity-65">@{handle} / {since}</div>
          </div>
          <div className="text-end"><div className={cn("font-medium tabular tracking-tight", compact ? "text-lg" : "text-3xl")}>{sparks.toLocaleString()}</div><div className="text-[11px] font-medium uppercase tracking-[0.1em] opacity-65">Sparks</div></div>
        </div>
      </div>
    </div>
  );
}

// ---------- Certificate ----------

export function Certificate({ title, name, date, className, sealed, meta }: { title: string; name: string; date: string; className?: string; sealed?: boolean; meta?: string }) {
  return (
    <div className={cn("label-card relative p-6 text-center", className)}>
      <div className="meta">Dabur Squad Academy</div>
      <div className="mt-3 text-xl font-medium tracking-tight">{title}</div>
      <div className="mt-1 text-[13px] text-ink-2">{meta}</div>
      <div className="mt-5 text-[13px] text-ink-3">awarded to</div>
      <div className="text-lg font-medium">{name}</div>
      <div className="mt-4 flex items-center justify-center gap-4">
        <span className="h-px flex-1 bg-line" />
        <Stamp pressed={!!sealed} size={64} tone="leaf"><span className="text-[9px]">PASSED</span></Stamp>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="mt-2 text-[12px] text-ink-3">{date}</div>
    </div>
  );
}

// ---------- Stamp card ----------

/** A loyalty stamp card: N circles, the first `filled` pressed. */
export function StampCard({ total, filled, className, label, size = 44 }: { total: number; filled: number; className?: string; label?: ReactNode; size?: number }) {
  return (
    <div className={cn("label-card p-4", className)}>
      {label && <div className="mb-3 flex items-center justify-between gap-3 text-[13px]">{label}</div>}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: total }, (_, i) => <Stamp key={i} pressed={i < filled} size={size} tone="marigold" delay={200 + i * 90} />)}
      </div>
    </div>
  );
}

// ---------- Kit box ----------

/** The welcome box. The lid opens on mount and the children rise out of it. */
export function KitBox({ children, className, open: openProp }: { children: ReactNode[]; className?: string; open?: boolean }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(!!reduce);
  useEffect(() => {
    if (openProp !== undefined) {
      setOpen(openProp);
      return;
    }
    const id = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(id);
  }, [openProp]);
  return (
    <div className={cn("relative mx-auto w-full max-w-[560px]", className)} style={{ perspective: 1200 }}>
      <div className="relative aspect-[5/4]">
        {/* items rising from the box */}
        <div className="absolute inset-x-[8%] bottom-[34%] top-0">
          {children.map((child, i) => {
            const n = children.length;
            const x = n === 1 ? 50 : 14 + (72 * i) / (n - 1);
            const y = [8, 0, 10, 2, 12][i % 5];
            const r = [-4, 2, -2, 3, -3][i % 5];
            return (
              <motion.div
                key={i}
                className="absolute w-[30%]"
                style={{ left: `${x}%`, top: `${y}%`, translateX: "-50%", zIndex: 10 + i }}
                initial={{ y: 160, opacity: 0, rotate: 0, scale: 0.8 }}
                animate={open ? { y: 0, opacity: 1, rotate: r, scale: 1 } : { y: 160, opacity: 0, rotate: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 130, damping: 20, delay: 0.25 + i * 0.1 }}
              >
                {child}
              </motion.div>
            );
          })}
        </div>
        {/* box body */}
        <div className="absolute inset-x-[6%] bottom-[6%] h-[40%] rounded-b-[18px] rounded-t-[6px] shadow-float" style={{ zIndex: 20, background: "linear-gradient(180deg, #0f7a3f 0%, #05431f 100%)", boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.08), var(--shadow-float)" }}>
          <div className="absolute inset-x-0 top-0 h-[14%] bg-black/30" />
          <div className="absolute inset-x-[8%] top-[34%] flex items-center justify-between text-white/85">
            <span className="flex items-center gap-2 text-[12px] font-medium tracking-[0.14em]"><Leaf size={15} weight="fill" style={{ color: "#3fe08a" }} />DABUR SQUAD</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/50">Welcome kit</span>
          </div>
          <div className="absolute inset-x-[8%] bottom-[14%] h-px bg-white/10" />
        </div>
        {/* lid */}
        <div className="absolute inset-x-[6%] bottom-[46%] h-[10%] rounded-[6px]" style={{ zIndex: 30, background: "linear-gradient(180deg, #1fc46b 0%, #0f8a47 100%)", boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.1), 0 10px 30px -12px rgb(0 0 0 / 0.5)", transformOrigin: "50% 100%", transformStyle: "preserve-3d", transform: open ? "rotateX(-112deg)" : "rotateX(0deg)", transition: reduce ? "none" : "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
          <div className="absolute inset-x-[8%] top-1/2 h-px -translate-y-1/2 bg-white/10" />
        </div>
        {/* shadow on the table */}
        <div className="absolute inset-x-[10%] bottom-[2%] h-[6%] rounded-[50%] bg-black/20 blur-md" />
      </div>
    </div>
  );
}

// ---------- Level badge on paper ----------

export function LevelSeal({ level, size = 44, className }: { level: Level; size?: number; className?: string }) {
  const tone = level === "ambassador" || level === "pro" ? "marigold" : level === "insider" ? "leaf" : "ink";
  return <Stamp pressed size={size} tone={tone} animate={false} className={className}><span style={{ fontSize: size * 0.17 }}>{LEVEL_LABEL[level]}</span></Stamp>;
}

export function brandOf(brands: Brand[], id: string | null | undefined): Brand | undefined {
  return brands.find((b) => b.id === id);
}
