"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Animated tier-progress ring. `progress` is 0–1 from the current tier floor
 * to the next tier floor; the center renders the tier emoji.
 */
export function TierRing({
  progress,
  emoji,
  size = 120,
  stroke = 9,
}: {
  progress: number;
  emoji: string;
  size?: number;
  stroke?: number;
}) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0.02, Math.min(1, progress));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#tier-ring-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped) }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 1.1, delay: 0.3, ease: [0.23, 1, 0.32, 1] }
          }
        />
        <defs>
          <linearGradient id="tier-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{ fontSize: size * 0.32 }}
        aria-hidden
      >
        {emoji}
      </span>
    </div>
  );
}
