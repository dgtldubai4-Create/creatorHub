/**
 * Monogram portraits. Until a creator uploads a photo, they get a quiet tonal
 * disc with their initials: one of eight muted tones, picked from their name so
 * it never changes. No illustration, no characters.
 */
import { cn } from "./cn";

const TONES: [string, string][] = [
  ["#8f877b", "#5b554d"], // stone
  ["#7c8792", "#4c555e"], // slate
  ["#7f8c79", "#4e594a"], // sage
  ["#9a7f70", "#634e44"], // clay
  ["#857f96", "#534e62"], // dusk
  ["#99895c", "#62573a"], // sand
  ["#6f8a85", "#445754"], // sea
  ["#93737f", "#5d4750"], // mauve
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function toneFor(name: string, hue = 0): [string, string] {
  return TONES[hash(name + hue) % TONES.length];
}

export function Face({ name, hue = 0, size = 40, className, style }: { name: string; hue?: number; size?: number | string; className?: string; style?: React.CSSProperties }) {
  const [a, b] = toneFor(name, hue);
  const px = typeof size === "number" ? size : undefined;
  return (
    <span
      aria-hidden
      className={cn("relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-medium leading-none text-white/95", className)}
      style={{ width: size, height: size, containerType: "inline-size", background: `radial-gradient(120% 120% at 28% 18%, ${a} 0%, ${b} 72%)`, boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.14)", fontSize: px ? Math.max(10, px * 0.36) : undefined, letterSpacing: "0.02em", ...style }}
    >
      <span style={px ? undefined : { fontSize: "36cqw" }}>{initials(name)}</span>
    </span>
  );
}

/** A row of portraits, overlapping. */
export function FacePile({ people, size = 32, max = 5, className }: { people: { name: string; hue: number }[]; size?: number; max?: number; className?: string }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className={cn("inline-flex items-center", className)} dir="ltr">
      {shown.map((p, i) => <Face key={p.name + i} name={p.name} hue={p.hue} size={size} className="ring-2 ring-surface" style={{ marginLeft: i ? -size * 0.28 : 0 }} />)}
      {rest > 0 && <span className="ms-2 text-[12.5px] font-medium text-ink-2 tabular">+{rest}</span>}
    </span>
  );
}
