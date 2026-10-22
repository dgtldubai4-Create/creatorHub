import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import {
  Package, CalendarCheck, SunHorizon, UsersThree, Star, Ticket, GraduationCap, PaperPlaneTilt, Leaf, Plant, Flower, Tree,
  VideoCamera, ChartLineUp, Briefcase, Stamp, HeartHalf, ChatsCircle, Sparkle, type Icon,
} from "@phosphor-icons/react";
import { cn } from "./cn";

/**
 * Designed graphics built in code. Every slot in src/art/manifest.ts resolves to one of
 * these compositions until a generated file replaces it. No external images.
 */

type Pattern = "dots" | "stripes" | "waves" | "grid" | "checks";

interface Spec { icon: Icon; pattern: Pattern; word?: string; tone: "forest" | "marigold" | "leaf" | "lime" | "ink" | "sky" | "rose"; tilt?: number }

const MISSION: Record<string, Spec> = {
  starter: { icon: Package, pattern: "dots", word: "START", tone: "leaf", tilt: -6 },
  routine: { icon: CalendarCheck, pattern: "grid", word: "30 DAYS", tone: "sky", tilt: 4 },
  monthly: { icon: SunHorizon, pattern: "waves", word: "THIS MONTH", tone: "marigold", tilt: -4 },
  team: { icon: UsersThree, pattern: "checks", word: "SQUAD", tone: "rose", tilt: 5 },
  review: { icon: Star, pattern: "dots", word: "5 STARS", tone: "ink", tilt: -3 },
  event: { icon: Ticket, pattern: "stripes", word: "LIVE", tone: "forest", tilt: 6 },
  academy: { icon: GraduationCap, pattern: "grid", word: "LEARN", tone: "lime", tilt: -5 },
  referral: { icon: PaperPlaneTilt, pattern: "waves", word: "INVITE", tone: "sky", tilt: 3 },
};
const TRACK: Record<string, Spec> = {
  craft: { icon: VideoCamera, pattern: "grid", tone: "forest", tilt: -4 },
  growth: { icon: ChartLineUp, pattern: "dots", tone: "leaf", tilt: 3 },
  business: { icon: Briefcase, pattern: "stripes", tone: "marigold", tilt: -3 },
  licensing: { icon: Stamp, pattern: "checks", tone: "sky", tilt: 4 },
  wellbeing: { icon: HeartHalf, pattern: "waves", tone: "rose", tilt: -5 },
  mentorship: { icon: ChatsCircle, pattern: "dots", tone: "lime", tilt: 5 },
};
const LEVEL: Record<string, Spec> = {
  member: { icon: Leaf, pattern: "dots", tone: "leaf" },
  insider: { icon: Plant, pattern: "grid", tone: "sky" },
  pro: { icon: Flower, pattern: "waves", tone: "marigold" },
  ambassador: { icon: Tree, pattern: "stripes", tone: "forest" },
};

const TONE: Record<Spec["tone"], { bg: string; fg: string; pat: string; badge: string; badgeFg: string }> = {
  forest: { bg: "bg-forest", fg: "text-lime", pat: "text-lime/25", badge: "bg-lime", badgeFg: "text-lime-ink" },
  leaf: { bg: "bg-leaf", fg: "text-white", pat: "text-white/30", badge: "bg-lime", badgeFg: "text-lime-ink" },
  marigold: { bg: "bg-marigold", fg: "text-marigold-ink", pat: "text-marigold-ink/20", badge: "bg-forest", badgeFg: "text-lime" },
  lime: { bg: "bg-lime", fg: "text-lime-ink", pat: "text-lime-ink/18", badge: "bg-forest", badgeFg: "text-lime" },
  ink: { bg: "bg-forest-2", fg: "text-marigold", pat: "text-marigold/25", badge: "bg-marigold", badgeFg: "text-marigold-ink" },
  sky: { bg: "bg-sky", fg: "text-white", pat: "text-white/30", badge: "bg-marigold", badgeFg: "text-marigold-ink" },
  rose: { bg: "bg-rose", fg: "text-white", pat: "text-white/30", badge: "bg-marigold", badgeFg: "text-marigold-ink" },
};
const PAT: Record<Pattern, string> = { dots: "pattern-dots", stripes: "pattern-stripes", waves: "pattern-waves", grid: "pattern-grid", checks: "pattern-checks" };

function StickerGraphic({ spec, className, compact }: { spec: Spec; className?: string; compact?: boolean }) {
  const t = TONE[spec.tone];
  const I = spec.icon;
  return (
    <div className={cn("group relative h-full w-full overflow-hidden", t.bg, className)}>
      <div className={cn("absolute inset-0 transition-transform duration-700 group-hover:translate-x-2 group-hover:translate-y-1", PAT[spec.pattern], t.pat)} />
      <span className="absolute -end-10 -top-12 h-40 w-40 rounded-full bg-white/15 transition-transform duration-700 group-hover:scale-125" />
      <span className="absolute -bottom-14 -start-8 h-36 w-36 rounded-full bg-black/10" />
      <span
        className={cn("absolute flex items-center justify-center rounded-[28%] shadow-[0_14px_30px_-12px_rgb(0_0_0/0.45)] transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105", t.badge, t.badgeFg, compact ? "start-1/2 top-1/2 h-[58%] w-[42%]" : "end-[7%] top-[22%] h-[56%] w-[30%] min-w-16")}
        style={{ transform: compact ? `translate(-50%, -50%) rotate(${spec.tilt ?? -4}deg)` : `rotate(${spec.tilt ?? -4}deg)` }}
      >
        <I weight="duotone" className="h-[62%] w-[62%]" />
      </span>
      {spec.word && !compact && (
        <span className={cn("pointer-events-none absolute -bottom-1 start-3 select-none text-[clamp(28px,8vw,56px)] font-extrabold leading-none tracking-tighter opacity-40", t.fg)}>{spec.word}</span>
      )}
    </div>
  );
}

/** Canvas-painted landscape: sun, layered hills, drifting sparks. Variant picks the sky. */
function SceneGraphic({ variant, className }: { variant: "golden" | "summer" | "winter" | "camp" | "welcome" | "academy"; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const palettes = {
      golden: { sky: ["#ffb224", "#ff7a3d", "#0f4d33"], sun: "#fff1b8", hills: ["#0d5a33", "#0b3b27", "#06281a"], spark: "#ffe7b0" },
      summer: { sky: ["#d9f55a", "#17994f", "#0d5a33"], sun: "#ffffff", hills: ["#0f4d33", "#0b3b27", "#06281a"], spark: "#ffffff" },
      winter: { sky: ["#bfe0ff", "#2b6fa3", "#0b3b27"], sun: "#fff8e1", hills: ["#0f4d33", "#0b3b27", "#06281a"], spark: "#ffffff" },
      camp: { sky: ["#2b1c3f", "#7a2d3a", "#ffb224"], sun: "#ffe7b0", hills: ["#0b3b27", "#06281a", "#031a10"], spark: "#ffd36b" },
      welcome: { sky: ["#d9f55a", "#ffb224", "#17994f"], sun: "#ffffff", hills: ["#0d5a33", "#0b3b27", "#06281a"], spark: "#ffffff" },
      academy: { sky: ["#17994f", "#0f4d33", "#0b3b27"], sun: "#d9f55a", hills: ["#0d5a33", "#0b3b27", "#06281a"], spark: "#d9f55a" },
    }[variant];
    let raf = 0;
    let t0 = performance.now();
    const sparks = Array.from({ length: 26 }, (_, i) => ({ x: (i * 97) % 1000 / 1000, y: 0.1 + ((i * 53) % 700) / 1000, r: 1 + ((i * 7) % 4), s: 0.4 + ((i * 13) % 10) / 10 }));
    const draw = (now: number) => {
      const w = (canvas.width = canvas.clientWidth * Math.min(2, window.devicePixelRatio || 1));
      const h = (canvas.height = canvas.clientHeight * Math.min(2, window.devicePixelRatio || 1));
      const time = reduce ? 0 : (now - t0) / 1000;
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, palettes.sky[0]);
      sky.addColorStop(0.55, palettes.sky[1]);
      sky.addColorStop(1, palettes.sky[2]);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      // sun
      const sx = w * 0.68;
      const sy = h * (0.42 + Math.sin(time * 0.3) * 0.01);
      const sr = Math.min(w, h) * 0.17;
      const glow = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 2.2);
      glow.addColorStop(0, "rgba(255,255,255,0.45)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = palettes.sun;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
      // hills
      palettes.hills.forEach((c, i) => {
        const base = h * (0.58 + i * 0.13);
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 8) {
          const y = base + Math.sin(x / (w * (0.18 + i * 0.07)) + i * 1.7 + time * (0.15 + i * 0.05)) * h * (0.045 + i * 0.01) + Math.sin(x / (w * 0.05) + i) * h * 0.008;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      });
      // sparks
      ctx.fillStyle = palettes.spark;
      for (const p of sparks) {
        const yy = ((p.y - time * 0.02 * p.s) % 1 + 1) % 1;
        const a = 0.35 + 0.65 * Math.abs(Math.sin(time * 1.3 * p.s + p.x * 9));
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(p.x * w, yy * h * 0.7, p.r * (w / 600), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        t0 = performance.now() - (reduce ? 0 : 0);
        raf = requestAnimationFrame(draw);
      } else cancelAnimationFrame(raf);
    });
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [variant, reduce]);
  return <canvas ref={ref} className={cn("block h-full w-full", className)} aria-hidden />;
}

const SCENES: Record<string, "golden" | "summer" | "winter" | "camp" | "welcome" | "academy"> = {
  "hero-golden-hour": "golden",
  "season-golden-hour": "golden",
  "season-summer-hair-rescue": "summer",
  "season-winter-glow": "winter",
  "circle-camp": "camp",
  "join-welcome": "welcome",
  "academy-hero": "academy",
};

export function Graphic({ id, className, compact }: { id: string; className?: string; compact?: boolean }) {
  const scene = SCENES[id];
  if (scene) return <SceneGraphic variant={scene} className={className} />;
  const [kind, ...rest] = id.split("-");
  const key = rest.join("-");
  const spec = kind === "mission" ? MISSION[key] : kind === "track" ? TRACK[key] : kind === "level" ? LEVEL[key] : undefined;
  if (spec) return <StickerGraphic spec={spec} className={className} compact={compact} />;
  return <StickerGraphic spec={{ icon: Sparkle, pattern: "dots", tone: "leaf" }} className={className} compact />;
}
