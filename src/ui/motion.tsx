import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, animate, type Transition } from "motion/react";
import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";
import confetti from "canvas-confetti";
import { cn } from "./cn";

export const spring: Transition = { type: "spring", stiffness: 260, damping: 26, mass: 0.9 };
export const springSoft: Transition = { type: "spring", stiffness: 140, damping: 20 };
export const springSnappy: Transition = { type: "spring", stiffness: 500, damping: 32 };
export const easeOut: Transition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] };

/** Fade-and-rise on mount or on entering the viewport. */
export function Reveal({ children, className, delay = 0, once = true, y = 18, inView = true }: { children: ReactNode; className?: string; delay?: number; once?: boolean; y?: number; inView?: boolean }) {
  const reduce = useReducedMotion();
  const initial = reduce ? false : { opacity: 0, y };
  const shown = { opacity: 1, y: 0 };
  return inView ? (
    <motion.div className={className} initial={initial} whileInView={shown} viewport={{ once, amount: 0.2 }} transition={{ ...easeOut, delay }}>
      {children}
    </motion.div>
  ) : (
    <motion.div className={className} initial={initial} animate={shown} transition={{ ...easeOut, delay }}>
      {children}
    </motion.div>
  );
}

/** Children stagger in with a spring. Wrap items in <Item>. */
export function Stagger({ children, className, gap = 0.06, delay = 0 }: { children: ReactNode; className?: string; gap?: number; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? false : "hidden"} animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}>
      {children}
    </motion.div>
  );
}
export function Item({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={{ hidden: { opacity: 0, y: 14, scale: 0.985 }, show: { opacity: 1, y: 0, scale: 1, transition: spring } }}>
      {children}
    </motion.div>
  );
}

/** Pointer-tracked tilt for invitation and reward cards. Motion values only, no React state. */
export function Tilt({ children, className, max = 7 }: { children: ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rx = useSpring(useTransform(y, [0, 1], [max, -max]), { stiffness: 220, damping: 22 });
  const ry = useSpring(useTransform(x, [0, 1], [-max, max]), { stiffness: 220, damping: 22 });
  const glow = useTransform([x, y], ([px, py]) => `radial-gradient(360px circle at ${(px as number) * 100}% ${(py as number) * 100}%, rgb(255 255 255 / 0.18), transparent 60%)`);
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width);
    y.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={cn("relative [transform-style:preserve-3d]", className)} style={{ rotateX: rx, rotateY: ry, perspective: 900 }} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: glow }} />
    </motion.div>
  );
}

/** Buttons that lean toward the cursor. */
export function Magnetic({ children, className, strength = 0.35 }: { children: ReactNode; className?: string; strength?: number }) {
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 300, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 300, damping: 18 });
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };
  if (reduce) return <div className={cn("inline-block", className)}>{children}</div>;
  return (
    <motion.div className={cn("inline-block", className)} style={{ x, y }} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </motion.div>
  );
}

/** A number that counts up to its value. */
export function Counter({ value, className, format = (n: number) => Math.round(n).toLocaleString() }: { value: number; className?: string; format?: (n: number) => string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(reduce ? value : 0);
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, mv, reduce]);
  useEffect(() => mv.on("change", (v) => { if (ref.current) ref.current.textContent = format(v); }), [mv, format]);
  return <span ref={ref} className={cn("tabular", className)}>{format(reduce ? value : 0)}</span>;
}

/** Celebration burst in brand colours. Skips under reduced motion. */
export function useCelebrate() {
  const reduce = useReducedMotion();
  return (origin?: { x: number; y: number }) => {
    if (reduce) return;
    confetti({ particleCount: 90, spread: 70, startVelocity: 38, gravity: 1.1, scalar: 0.9, ticks: 180, origin: origin ?? { y: 0.6 }, colors: ["#c9f24a", "#ff7a3d", "#ff7bc8", "#3fa9ff", "#ffd43b", "#7b5bff"], disableForReducedMotion: true });
  };
}

/** Gentle bob for floating stickers. */
export function Float({ children, className, delay = 0, amplitude = 8, duration = 4.5 }: { children: ReactNode; className?: string; delay?: number; amplitude?: number; duration?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} animate={{ y: [0, -amplitude, 0], rotate: [0, 1.5, 0] }} transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}>
      {children}
    </motion.div>
  );
}

/** Continuous horizontal marquee. Children are duplicated so the loop is seamless. */
export function Marquee({ children, className, duration = 40, reverse }: { children: ReactNode; className?: string; duration?: number; reverse?: boolean }) {
  return (
    <div className={cn("overflow-hidden", className)} dir="ltr">
      <div className="marquee-track" style={{ animationDuration: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}>
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>{children}</div>
      </div>
    </div>
  );
}

/** Soft candy blobs drifting behind a section. */
export function Blobs({ colors = ["var(--lime)", "var(--bubblegum)", "var(--sky)"], className }: { colors?: string[]; className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {colors.map((c, i) => (
        <span key={i} className="blob" style={{ background: c, width: `${42 + i * 8}%`, paddingBottom: `${42 + i * 8}%`, left: `${[-8, 55, 25][i % 3]}%`, top: `${[-20, 10, 55][i % 3]}%`, animationDelay: `${i * -5}s`, animationDuration: `${16 + i * 4}s` }} />
      ))}
    </div>
  );
}

/** Follows the cursor with a soft candy glow. Mount once inside a `relative` section. */
export function CursorGlow({ color = "var(--lemon)", size = 420 }: { color?: string; size?: number }) {
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(-1000), { stiffness: 120, damping: 20 });
  const y = useSpring(useMotionValue(-1000), { stiffness: 120, damping: 20 });
  useEffect(() => {
    if (reduce) return;
    const move = (e: PointerEvent) => { x.set(e.clientX - size / 2); y.set(e.clientY - size / 2); };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [x, y, size, reduce]);
  if (reduce) return null;
  return <motion.span aria-hidden className="pointer-events-none fixed left-0 top-0 z-0 rounded-full opacity-40 mix-blend-multiply dark:mix-blend-screen" style={{ x, y, width: size, height: size, background: `radial-gradient(circle, ${color} 0%, transparent 65%)` }} />;
}

/** Scroll-linked vertical drift for decorative layers. */
export function Parallax({ children, className, speed = 0.2 }: { children: ReactNode; className?: string; speed?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 160, -speed * 160]);
  return <motion.div ref={ref} className={className} style={reduce ? undefined : { y }}>{children}</motion.div>;
}

/** Hover squish and a little tilt, for faces and candy tiles. */
export function Squish({ children, className, rotate = -3 }: { children: ReactNode; className?: string; rotate?: number }) {
  return (
    <motion.div className={cn("inline-block", className)} whileHover={{ scale: 1.08, rotate }} whileTap={{ scale: 0.94 }} transition={springSnappy}>
      {children}
    </motion.div>
  );
}

/** Cycles through words with a spring flip. */
export function RotatingWord({ words, className, interval = 2200 }: { words: string[]; className?: string; interval?: number }) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [words.length, interval, reduce]);
  return (
    <span className={cn("relative inline-grid overflow-visible align-baseline", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={words[i]} className="col-start-1 row-start-1 inline-block whitespace-nowrap" initial={{ y: "100%", opacity: 0, rotate: 6 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: "-100%", opacity: 0, rotate: -6 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}>
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
