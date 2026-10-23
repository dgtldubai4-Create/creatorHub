/**
 * The Kit: the objects every screen is built from. Paper labels, stamps, tickets,
 * a membership card, a certificate, a stamp card, and the kit box itself.
 */
import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Leaf, Plant, Tooth, Tree, Orange, Pepper, Flower, Hexagon, Jar, Wind, Drop, Flame, Check, type Icon } from "@phosphor-icons/react";
import type { Brand, Level } from "../domain/types";
import { cn } from "./cn";

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
    <span aria-hidden className={cn("pointer-events-none absolute -bottom-3 -end-3 flex gap-1 text-leaf opacity-[0.09]", className)}>
      {Array.from({ length: count }, (_, i) => <I key={i} size={64 - i * 14} weight="duotone" className="self-end" />)}
    </span>
  );
}

// ---------- Label ----------

export function Label({ children, className, brandId, watermark = true, as: Tag = "div", ...rest }: { children: ReactNode; className?: string; brandId?: string | null; watermark?: boolean; as?: "div" | "article" | "section" } & Record<string, unknown>) {
  return (
    <Tag className={cn("label-card relative overflow-hidden", className)} {...rest}>
      {watermark && brandId !== undefined && <Watermark brandId={brandId} />}
      {children}
    </Tag>
  );
}

// ---------- Stamp ----------

/** A rubber stamp. Pressed stamps land with a press animation the first time they appear. */
export function Stamp({ pressed, children, size = 64, tone = "leaf", className, icon, animate = true }: { pressed: boolean; children?: ReactNode; size?: number; tone?: "leaf" | "marigold" | "rose" | "ink"; className?: string; icon?: ReactNode; animate?: boolean }) {
  const reduce = useReducedMotion();
  const color = { leaf: "border-leaf text-leaf", marigold: "border-marigold text-marigold-ink", rose: "border-rose text-rose", ink: "border-ink text-ink" }[tone];
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full border-2 border-dashed border-line-2" />
      {pressed && (
        <span
          className={cn("absolute inset-[6%] flex items-center justify-center rounded-full border-[3px] bg-transparent text-center font-bold uppercase leading-none", color)}
          style={{ transform: "rotate(-8deg)", animation: animate && !reduce ? "stamp-press 520ms cubic-bezier(0.22, 1, 0.36, 1) both" : undefined, fontSize: size * 0.16, letterSpacing: "0.04em", mixBlendMode: "multiply" }}
        >
          <span className={cn("absolute inset-[9%] rounded-full border", color.split(" ")[0])} />
          <span className="relative px-1">{icon ?? children ?? <Check weight="bold" size={size * 0.4} />}</span>
        </span>
      )}
    </span>
  );
}

// ---------- Ticket ----------

/** A ticket with a tear-off stub. `stub` sits past the perforation. */
export function Ticket({ children, stub, className, torn, tone = "paper", onClick, to }: { children: ReactNode; stub?: ReactNode; className?: string; torn?: boolean; tone?: "paper" | "marigold" | "forest"; onClick?: () => void; to?: string }) {
  const bg = tone === "marigold" ? "bg-marigold text-marigold-ink" : tone === "forest" ? "bg-forest text-white" : "bg-surface text-ink";
  const Comp = to ? motion.a : motion.div;
  return (
    <Comp
      href={to}
      onClick={onClick}
      className={cn("relative block overflow-visible rounded-[12px] border border-line-2 shadow-card", bg, (onClick || to) && "lift cursor-pointer", className)}
      initial={false}
      animate={torn ? { x: 8, rotate: 1.5, opacity: 0.6 } : { x: 0, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
    >
      <div className="p-5">{children}</div>
      {stub && (
        <div className={cn("perf-x px-5 py-3", tone === "paper" ? "bg-surface-2/60" : "bg-black/10")}>{stub}</div>
      )}
    </Comp>
  );
}

// ---------- Membership card ----------

const LEVEL_LABEL: Record<Level, string> = { member: "MEMBER", insider: "INSIDER", pro: "PRO", ambassador: "AMBASSADOR" };

export function MembershipCard({ name, handle, level, since, sparks, className, compact, id }: { name: string; handle: string; level: Level; since: string; sparks: number; className?: string; compact?: boolean; id: string }) {
  const face = level === "ambassador" ? "bg-marigold text-marigold-ink" : level === "pro" ? "bg-forest text-white" : level === "insider" ? "bg-forest-2 text-white" : "bg-surface text-ink border border-line-2";
  // A deterministic dot matrix stands in for the card's code.
  const dots = Array.from({ length: 36 }, (_, i) => ((id.charCodeAt(i % id.length) * (i + 7)) % 5) > 1);
  return (
    <div className={cn("relative overflow-hidden rounded-[14px] shadow-float", face, compact ? "aspect-[1.6] w-64" : "aspect-[1.586] w-full max-w-md", className)}>
      <span aria-hidden className="absolute -end-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20"><Leaf size={14} weight="fill" /></span><span className="text-[12px] font-semibold tracking-wide">DABUR SQUAD</span></div>
          <span className="meta !text-current opacity-80">{LEVEL_LABEL[level]}</span>
        </div>
        <div className="grid grid-cols-6 gap-1 self-start" aria-hidden>
          {dots.map((on, i) => <span key={i} className={cn("h-1.5 w-1.5 rounded-[2px]", on ? "bg-current opacity-70" : "bg-current opacity-15")} />)}
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className={cn("truncate font-semibold", compact ? "text-[15px]" : "text-lg")}>{name}</div>
            <div className="truncate text-[12px] opacity-75">@{handle} · {since}</div>
          </div>
          <div className="text-end"><div className={cn("font-semibold tabular", compact ? "text-lg" : "text-2xl")}>{sparks.toLocaleString()}</div><div className="meta !text-current opacity-75">Sparks</div></div>
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
      <div className="mt-3 text-xl font-semibold">{title}</div>
      <div className="mt-1 text-[13px] text-ink-2">{meta}</div>
      <div className="mt-5 text-[13px] text-ink-3">awarded to</div>
      <div className="text-lg font-semibold">{name}</div>
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
        {Array.from({ length: total }, (_, i) => <Stamp key={i} pressed={i < filled} size={size} animate={i === filled - 1} />)}
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
            const r = [-8, 4, -3, 7, -5][i % 5];
            return (
              <motion.div
                key={i}
                className="absolute w-[30%]"
                style={{ left: `${x}%`, top: `${y}%`, translateX: "-50%", zIndex: 10 + i }}
                initial={{ y: 160, opacity: 0, rotate: 0, scale: 0.8 }}
                animate={open ? { y: 0, opacity: 1, rotate: r, scale: 1 } : { y: 160, opacity: 0, rotate: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.25 + i * 0.1 }}
              >
                <motion.div animate={reduce ? {} : { y: [0, -6, 0] }} transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}>{child}</motion.div>
              </motion.div>
            );
          })}
        </div>
        {/* box body */}
        <div className="absolute inset-x-[6%] bottom-[6%] h-[40%] rounded-b-[14px] rounded-t-[6px] bg-forest shadow-float" style={{ zIndex: 20 }}>
          <div className="absolute inset-x-0 top-0 h-[14%] bg-black/25" />
          <div className="absolute inset-x-[8%] top-[34%] flex items-center justify-between text-white/85">
            <span className="flex items-center gap-2 text-[13px] font-semibold tracking-wide"><Leaf size={16} weight="fill" className="text-marigold" />DABUR SQUAD</span>
            <span className="meta !text-white/60">Welcome kit</span>
          </div>
          <div className="absolute inset-x-[8%] bottom-[14%] h-px bg-white/15" />
        </div>
        {/* lid */}
        <div className="absolute inset-x-[6%] bottom-[46%] h-[10%] rounded-[6px] bg-forest-2 shadow-[0_10px_30px_-10px_rgb(0_0_0/0.5)]" style={{ zIndex: 30, transformOrigin: "50% 100%", transformStyle: "preserve-3d", transform: open ? "rotateX(-112deg)" : "rotateX(0deg)", transition: reduce ? "none" : "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
          <div className="absolute inset-x-[8%] top-1/2 h-px -translate-y-1/2 bg-white/15" />
        </div>
        {/* shadow on the table */}
        <div className="absolute inset-x-[10%] bottom-[2%] h-[6%] rounded-[50%] bg-black/20 blur-md" />
      </div>
    </div>
  );
}

// ---------- Level badge on paper ----------

export function LevelSeal({ level, size = 44, className }: { level: Level; size?: number; className?: string }) {
  const tone = level === "ambassador" ? "marigold" : level === "member" ? "ink" : "leaf";
  return <Stamp pressed size={size} tone={tone} animate={false} className={className}><span style={{ fontSize: size * 0.17 }}>{LEVEL_LABEL[level]}</span></Stamp>;
}

export function brandOf(brands: Brand[], id: string | null | undefined): Brand | undefined {
  return brands.find((b) => b.id === id);
}
