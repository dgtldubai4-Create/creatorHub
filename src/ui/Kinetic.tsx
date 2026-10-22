import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sparkle } from "@phosphor-icons/react";
import { cn } from "./cn";

/** A word that cycles through a list with a rise-and-exit motion. Static under reduced motion. */
export function RotatingWord({ words, className, period = 2.4 }: { words: string[]; className?: string; period?: number }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce || words.length < 2) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % words.length), period * 1000);
    return () => window.clearInterval(id);
  }, [reduce, words.length, period]);
  if (reduce || words.length < 2) return <span className={className}>{words[0]}</span>;
  const longest = words.reduce((a, b) => (a.length >= b.length ? a : b));
  return (
    <span className={cn("relative inline-grid overflow-hidden align-baseline", className)} style={{ paddingBottom: "0.06em" }}>
      <span className="invisible col-start-1 row-start-1 whitespace-nowrap">{longest}</span>
      <AnimatePresence initial={false}>
        <motion.span
          key={words[i]}
          className="col-start-1 row-start-1 whitespace-nowrap"
          initial={{ y: "100%", rotate: 3, opacity: 0 }}
          animate={{ y: "0%", rotate: 0, opacity: 1 }}
          exit={{ y: "-100%", rotate: -3, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Small marigold sparks drifting upward. Purely decorative; hidden from assistive tech. */
export function Sparks({ count = 14, className }: { count?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {Array.from({ length: count }, (_, i) => {
        const left = (i * 61) % 100;
        const dur = 6 + ((i * 37) % 60) / 10;
        const delay = -((i * 23) % 70) / 10;
        const size = 10 + ((i * 17) % 14);
        return (
          <Sparkle
            key={i}
            weight="fill"
            className="absolute bottom-0 text-marigold"
            style={{ left: `${left}%`, width: size, height: size, animation: `drift ${dur}s linear ${delay}s infinite`, ["--dx" as string]: `${((i * 13) % 60) - 30}px`, ["--dr" as string]: `${((i * 29) % 90) - 45}deg` }}
          />
        );
      })}
    </div>
  );
}
