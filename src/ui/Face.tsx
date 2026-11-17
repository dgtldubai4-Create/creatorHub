/**
 * Monogram portraits. Until a creator uploads a photo, they get a lit disc
 * with their initials in one of eight colours from the Dabur family, picked
 * from their name so it never changes. No illustration, no characters.
 */
import { cn } from "./cn";
import { portraitId } from "../art/manifest";

// Portraits written by scripts/generate-art.ts. Vite inlines or hashes them at build time.
const PORTRAITS = import.meta.glob("../art/generated/portrait-*.{png,webp,jpg,jpeg}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
export function portraitFor(name: string): string | undefined {
  const id = portraitId(name);
  const key = Object.keys(PORTRAITS).find((k) => k.includes(`/${id}.`));
  return key ? PORTRAITS[key] : undefined;
}

const TONES: [string, string][] = [
  ["#2fd07a", "#067a3a"], // Dabur green
  ["#ffb83d", "#e07a00"], // saffron
  ["#ff7a5c", "#c2301e"], // red
  ["#f56bb0", "#a81f66"], // pink
  ["#5cc0f5", "#1f63ad"], // blue
  ["#24cdb8", "#0b6e66"], // teal
  ["#ff9a4a", "#c9480c"], // orange
  ["#9b8cf2", "#4c3fb0"], // violet
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
  const h = hash(name + hue);
  return TONES[((h >>> 11) ^ (h >>> 3)) % TONES.length];
}

export function Face({ name, hue = 0, size = 40, className, style }: { name: string; hue?: number; size?: number | string; className?: string; style?: React.CSSProperties }) {
  const [a, b] = toneFor(name, hue);
  const px = typeof size === "number" ? size : undefined;
  const src = portraitFor(name);
  if (src) return <img src={src} alt="" aria-hidden loading="lazy" className={cn("inline-block shrink-0 select-none rounded-full object-cover", className)} style={{ width: size, height: size, boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.2)", ...style }} />;
  return (
    <span
      aria-hidden
      className={cn("relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-medium leading-none text-white/95", className)}
      style={{ width: size, height: size, containerType: "inline-size", background: `radial-gradient(120% 120% at 28% 18%, ${a} 0%, ${b} 72%)`, boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.22), inset 0 -6px 12px rgb(0 0 0 / 0.12)", fontSize: px ? Math.max(10, px * 0.36) : undefined, letterSpacing: "0.02em", ...style }}
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
