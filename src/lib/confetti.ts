// Lightweight confetti burst on a shared fixed canvas. Client-only.
// Respects prefers-reduced-motion (no-op).

const COLORS = ["#178a52", "#ff7a1a", "#ffc531", "#16a08c", "#ffb648", "#79d2a2"];

type Particle = {
  x: number; y: number; vx: number; vy: number; g: number;
  s: number; c: string; r: number; vr: number; life: number;
};

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let parts: Particle[] = [];
let running = false;

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");
  const size = () => {
    if (!canvas) return;
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  };
  size();
  addEventListener("resize", size);
}

function tick() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  parts = parts.filter((p) => p.life > 0);
  for (const p of parts) {
    p.x += p.vx; p.y += p.vy; p.vy += p.g; p.r += p.vr; p.life--;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);
    ctx.globalAlpha = Math.min(1, p.life / 40);
    ctx.fillStyle = p.c;
    ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
    ctx.restore();
  }
  if (parts.length > 0) requestAnimationFrame(tick);
  else running = false;
}

/** Fire a confetti burst at viewport coordinates (defaults to center-top third). */
export function confettiBurst(x?: number, y?: number, count = 90) {
  if (typeof window === "undefined") return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  ensureCanvas();
  const px = x ?? innerWidth / 2;
  const py = y ?? innerHeight / 3;
  for (let i = 0; i < count; i++) {
    parts.push({
      x: px, y: py,
      vx: (Math.random() - 0.5) * 11,
      vy: -Math.random() * 11 - 3,
      g: 0.32,
      s: 5 + Math.random() * 6,
      c: COLORS[i % COLORS.length],
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 90 + Math.random() * 40,
    });
  }
  if (!running) {
    running = true;
    requestAnimationFrame(tick);
  }
}

/** Burst from the center of a DOM element (e.g. the button just pressed). */
export function confettiFrom(el: HTMLElement, count = 90) {
  const r = el.getBoundingClientRect();
  confettiBurst(r.left + r.width / 2, r.top + r.height / 2, count);
}
