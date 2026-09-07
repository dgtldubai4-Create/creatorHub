import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, animate, type Transition } from "motion/react";
import { useEffect, useRef, type ReactNode, type MouseEvent } from "react";
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
    confetti({ particleCount: 90, spread: 70, startVelocity: 38, gravity: 1.1, scalar: 0.9, ticks: 180, origin: origin ?? { y: 0.6 }, colors: ["#178a47", "#f2b33d", "#7fd6a2", "#fbe9bf", "#0f5a33"], disableForReducedMotion: true });
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
