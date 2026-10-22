import { forwardRef, useEffect, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "react-router-dom";
import { X, Flask, CheckCircle, Warning, Info } from "@phosphor-icons/react";
import { cn } from "./cn";
import { spring, springSnappy } from "./motion";
import { useT } from "../i18n";

// ---------- Buttons ----------

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-leaf text-white hover:bg-leaf-deep shadow-[0_10px_24px_-10px_rgb(23_153_79/0.8)] font-bold",
  secondary: "bg-surface text-ink border border-line-2 hover:border-ink-3 hover:bg-surface-2",
  ghost: "bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink",
  accent: "bg-marigold text-marigold-ink hover:brightness-95 shadow-[0_10px_24px_-10px_rgb(255_178_36/0.9)] font-bold",
  danger: "bg-rose-soft text-rose hover:brightness-95",
};
const SIZE: Record<Size, string> = { sm: "h-9 px-3.5 text-[13px] gap-1.5", md: "h-11 px-5 text-[15px] gap-2", lg: "h-13 px-7 text-base gap-2.5" };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconEnd?: ReactNode;
  to?: string;
  full?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = "primary", size = "md", icon, iconEnd, className, children, to, full, disabled, ...rest }, ref) {
  const cls = cn("press inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium select-none disabled:opacity-45 disabled:pointer-events-none", VARIANT[variant], SIZE[size], full && "w-full", className);
  if (to) {
    return (
      <Link to={to} className={cls} aria-disabled={disabled}>
        {icon}
        {children}
        {iconEnd}
      </Link>
    );
  }
  return (
    <button ref={ref} className={cls} disabled={disabled} {...rest}>
      {icon}
      {children}
      {iconEnd}
    </button>
  );
});

export function IconButton({ label, className, children, active, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button aria-label={label} title={label} className={cn("press inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink", active && "bg-surface-2 text-ink", className)} {...rest}>
      {children}
    </button>
  );
}

// ---------- Chips & tags ----------

export type Tone = "neutral" | "leaf" | "marigold" | "rose" | "sky" | "ink";
const TONE: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-2",
  leaf: "bg-leaf-soft text-leaf-ink",
  marigold: "bg-marigold-soft text-marigold-ink",
  rose: "bg-rose-soft text-rose",
  sky: "bg-sky/12 text-sky",
  ink: "bg-ink text-canvas",
};

export function Chip({ tone = "neutral", className, children, icon }: { tone?: Tone; className?: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <span className={cn("inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12.5px] font-medium", TONE[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export function ChipButton({ selected, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button className={cn("press h-9 whitespace-nowrap rounded-full border px-3.5 text-[13.5px] font-medium", selected ? "border-ink bg-ink text-canvas" : "border-line-2 bg-surface text-ink-2 hover:border-ink-3 hover:text-ink", className)} {...rest}>
      {children}
    </button>
  );
}

/** Marks a simulated service. Required wherever a simulation shows up in the UI. */
export function SimulatedTag({ className }: { className?: string }) {
  const t = useT();
  return (
    <span title={t("simulatedHint")} className={cn("inline-flex h-6 items-center gap-1 rounded-full border border-dashed border-line-2 px-2 text-[11.5px] font-medium text-ink-3", className)}>
      <Flask size={12} weight="bold" />
      {t("simulated")}
    </span>
  );
}

// ---------- Avatar ----------

export function Avatar({ name, hue, size = 40, className, ring }: { name: string; hue: number; size?: number; className?: string; ring?: boolean }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  return (
    <span
      className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white", ring && "ring-4 ring-surface", className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, oklch(0.72 0.14 ${hue}), oklch(0.5 0.16 ${(hue + 40) % 360}))` }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

// ---------- Fields ----------

export function Field({ label, hint, error, children, required }: { label: string; hint?: string; error?: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink">
        {label}
        {required && <span className="ms-1 text-rose">*</span>}
      </span>
      {children}
      {error ? <span className="text-[12.5px] text-rose">{error}</span> : hint ? <span className="text-[12.5px] text-ink-3">{hint}</span> : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn("field", className)} {...rest} />;
});

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("field min-h-24 resize-y", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("field appearance-none bg-[length:16px] bg-[position:right_0.9rem_center] bg-no-repeat pe-9 rtl:bg-[position:left_0.9rem_center]", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237d9284' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...rest}>
      {children}
    </select>
  );
}

// ---------- Layout bits ----------

export function PageHeader({ title, sub, actions, eyebrow, className }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-[60ch]">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">{title}</h1>
        {sub && <p className="mt-2 text-[15px] text-ink-2">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Section({ title, sub, action, children, className }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-4">
          <div>
            {title && <h2 className="text-xl md:text-2xl">{title}</h2>}
            {sub && <p className="mt-1 text-[14px] text-ink-2">{sub}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ icon, title, body, action, className }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("card-soft flex flex-col items-center gap-3 px-6 py-12 text-center", className)}>
      {icon && <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-leaf shadow-card">{icon}</div>}
      <h3 className="text-lg">{title}</h3>
      {body && <p className="max-w-[40ch] text-[14px] text-ink-2">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-surface-3", className)} />;
}

export function Stat({ label, value, hint, tone = "neutral", to }: { label: string; value: ReactNode; hint?: string; tone?: "neutral" | "leaf" | "marigold"; to?: string }) {
  const body = (
    <div className={cn("card flex h-full flex-col justify-between gap-3 p-5", to && "press hover:border-ink-3", tone === "leaf" && "bg-leaf-soft border-transparent", tone === "marigold" && "bg-marigold-soft border-transparent")}>
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      <span className="text-3xl font-semibold tabular leading-none">{value}</span>
      {hint && <span className="text-[12.5px] text-ink-3">{hint}</span>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  const id = useId();
  return (
    <div className={cn("relative inline-flex rounded-full bg-surface-2 p-1", className)} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)} className={cn("relative z-10 h-9 whitespace-nowrap rounded-full px-4 text-[13.5px] font-medium transition-colors", value === o.value ? "text-ink" : "text-ink-2 hover:text-ink")}>
          {value === o.value && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 -z-10 rounded-full bg-surface shadow-card" transition={springSnappy} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressRing({ value, size = 56, stroke = 6, className, children }: { value: number; size?: number; stroke?: number; className?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--leaf)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(1, value))) }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// ---------- Sheet (modal) ----------

export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean }) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div role="dialog" aria-modal className={cn("card relative max-h-[92dvh] w-full overflow-y-auto rounded-b-none p-6 sm:rounded-b-[var(--radius-card)]", wide ? "sm:max-w-3xl" : "sm:max-w-lg")} data-lenis-prevent initial={{ y: 40, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 24, scale: 0.98, opacity: 0 }} transition={spring}>
            <div className="mb-4 flex items-start justify-between gap-4">
              {title ? <h2 className="text-xl">{title}</h2> : <span />}
              <IconButton label={t("close")} onClick={onClose} className="-me-2 -mt-2">
                <X size={18} weight="bold" />
              </IconButton>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- Toasts ----------

export type ToastKind = "success" | "error" | "info";
export interface ToastItem { id: number; kind: ToastKind; text: string }

export function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      <AnimatePresence>
        {items.map((tst) => (
          <motion.button key={tst.id} onClick={() => onDismiss(tst.id)} layout initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={spring} className={cn("pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full px-4 py-2.5 text-[14px] font-medium shadow-float", tst.kind === "error" ? "bg-rose text-white" : tst.kind === "success" ? "bg-leaf text-white" : "bg-ink text-canvas")}>
            {tst.kind === "error" ? <Warning size={18} weight="fill" /> : tst.kind === "success" ? <CheckCircle size={18} weight="fill" /> : <Info size={18} weight="fill" />}
            <span className="text-start">{tst.text}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
