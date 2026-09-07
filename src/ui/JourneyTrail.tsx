import { useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Leaf } from "@phosphor-icons/react";
import type { Participation, Stage } from "../domain/types";
import { PHASES, STAGES, phaseOf, stageOrder } from "../domain/stages";
import { useDir, useFormat, useT } from "../i18n";
import { cn } from "./cn";
import { spring } from "./motion";

const STEP = 88;
const PAD = 40;
const H = 150;
const MID = 74;
const AMP = 22;
const LOOP_STAGES = new Set<Stage>(["changes_requested", "revised_cut"]);

function pointFor(i: number, rtl: boolean, total: number) {
  const x = PAD + i * STEP;
  const y = MID + Math.sin(i * 0.9) * AMP;
  return { x: rtl ? PAD + (total - 1) * STEP - (x - PAD) : x, y };
}

function pathThrough(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

/**
 * The winding trail. Every stop is a stage in the one ordered list; the marker
 * sits on the participation's current stage and springs forward on change.
 */
export function JourneyTrail({ participation, className }: { participation: Participation; className?: string }) {
  const t = useT();
  const { date } = useFormat();
  const dir = useDir();
  const rtl = dir === "rtl";
  const reduce = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const total = STAGES.length;
  const width = PAD * 2 + (total - 1) * STEP;
  const pts = useMemo(() => STAGES.map((_, i) => pointFor(i, rtl, total)), [rtl, total]);
  const current = participation.stage;
  const declined = current === "declined";
  const curIdx = declined ? 0 : stageOrder(current);
  const reached = useMemo(() => {
    const m = new Map<Stage, string>();
    for (const e of participation.stageLog) m.set(e.stage, e.at);
    return m;
  }, [participation.stageLog]);
  const donePath = pathThrough(pts.slice(0, curIdx + 1));
  const fullPath = pathThrough(pts);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const p = pts[curIdx];
    const target = p.x - el.clientWidth / 2;
    el.scrollTo({ left: rtl ? -(width - p.x - el.clientWidth / 2) : target, behavior: reduce ? "auto" : "smooth" });
  }, [curIdx, pts, rtl, width, reduce]);

  return (
    <div className={cn("relative", className)}>
      <div ref={scroller} data-lenis-prevent className="hide-scrollbar overflow-x-auto" dir={dir}>
        <div className="relative" style={{ width, height: H }}>
          <svg width={width} height={H} className="absolute inset-0" aria-hidden>
            <path d={fullPath} fill="none" stroke="var(--line-2)" strokeWidth={3} strokeDasharray="1 9" strokeLinecap="round" />
            <motion.path d={donePath} fill="none" stroke={declined ? "var(--rose)" : "var(--leaf)"} strokeWidth={4} strokeLinecap="round" initial={false} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
          </svg>
          {STAGES.map((stage, i) => {
            const p = pts[i];
            const isDone = i < curIdx || (i === curIdx && current === "completed");
            const isCurrent = i === curIdx && !declined;
            const loop = LOOP_STAGES.has(stage);
            const visited = reached.has(stage);
            const at = reached.get(stage);
            const above = p.y > MID;
            return (
              <div key={stage} className="absolute" style={{ left: p.x, top: p.y, transform: "translate(-50%, -50%)" }}>
                <div className="group relative flex items-center justify-center">
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-full border-2 transition-colors",
                      loop ? "h-3.5 w-3.5" : "h-5 w-5",
                      isDone || (loop && visited) ? "border-leaf bg-leaf text-white" : isCurrent ? "border-leaf bg-surface" : "border-line-2 bg-surface",
                    )}
                  >
                    {isDone && !loop && <Check size={11} weight="bold" />}
                  </span>
                  {isCurrent && (
                    <motion.span layoutId={`marker-${participation.id}`} transition={spring} className="absolute -top-1 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-marigold text-marigold-ink shadow-float">
                      <Leaf size={15} weight="fill" />
                      {!reduce && <motion.span className="absolute inset-0 rounded-full bg-marigold" animate={{ scale: [1, 1.9], opacity: [0.5, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }} />}
                    </motion.span>
                  )}
                  <div className={cn("pointer-events-none absolute left-1/2 w-28 -translate-x-1/2 text-center text-[11.5px] leading-tight transition-opacity", above ? "top-7" : "bottom-7", isCurrent ? "font-semibold text-ink opacity-100" : "text-ink-3 opacity-0 group-hover:opacity-100", loop && !visited && "hidden")}>
                    <div>{t(`stage_${stage}` as const)}</div>
                    {at && <div className="mt-0.5 text-[10.5px] text-ink-3">{date(at)}</div>}
                    {isCurrent && <div className="mt-0.5 text-[10px] uppercase tracking-wide text-leaf">{t("youAreHere")}</div>}
                  </div>
                </div>
              </div>
            );
          })}
          {declined && (
            <div className="absolute" style={{ left: pts[0].x, top: pts[0].y - 46, transform: "translateX(-50%)" }}>
              <span className="whitespace-nowrap rounded-full bg-rose-soft px-2.5 py-1 text-[11.5px] font-medium text-rose">{t("stage_declined")}</span>
            </div>
          )}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 start-0 w-8 bg-gradient-to-r from-surface to-transparent rtl:bg-gradient-to-l" />
      <div className="pointer-events-none absolute inset-y-0 end-0 w-8 bg-gradient-to-l from-surface to-transparent rtl:bg-gradient-to-r" />
    </div>
  );
}

/** Six phases as a compact strip for cards and lists. */
export function PhaseTrail({ stage, className, size = "md" }: { stage: Stage; className?: string; size?: "sm" | "md" }) {
  const t = useT();
  const cur = stage === "declined" ? -1 : PHASES.indexOf(phaseOf(stage));
  const completed = stage === "completed";
  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={t(`stage_${stage}` as const)}>
      {PHASES.map((ph, i) => {
        const done = i < cur || completed;
        const active = i === cur && !completed;
        return (
          <div key={ph} className="flex items-center gap-1">
            <span className={cn("rounded-full transition-colors", size === "sm" ? "h-1.5" : "h-2", active ? "w-6 bg-marigold" : done ? "w-3 bg-leaf" : "w-3 bg-line-2", stage === "declined" && "bg-rose-soft")} />
          </div>
        );
      })}
    </div>
  );
}
