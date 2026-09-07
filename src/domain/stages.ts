import type { Stage, StageLogEntry } from "./types";

/**
 * The one ordered stage list that drives the whole product.
 * `declined` is terminal and sits outside the order.
 */
export const STAGES: readonly Stage[] = [
  "invited",
  "accepted",
  "profile_confirmed",
  "preparing",
  "dispatched",
  "out_for_delivery",
  "delivered",
  "shoot",
  "first_cut",
  "auto_check",
  "manual_review",
  "changes_requested",
  "revised_cut",
  "approved_to_publish",
  "link_submitted",
  "post_verified",
  "points_released",
  "completed",
] as const;

/** Explicit forward edges. The revise loop is the only edge that goes "back". */
const NEXT: Record<Stage, readonly Stage[]> = {
  invited: ["accepted", "declined"],
  accepted: ["profile_confirmed"],
  profile_confirmed: ["preparing"],
  preparing: ["dispatched"],
  dispatched: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: ["shoot"],
  shoot: ["first_cut"],
  first_cut: ["auto_check"],
  auto_check: ["manual_review"],
  manual_review: ["changes_requested", "approved_to_publish"],
  changes_requested: ["revised_cut"],
  revised_cut: ["manual_review"],
  approved_to_publish: ["link_submitted"],
  link_submitted: ["post_verified"],
  post_verified: ["points_released"],
  points_released: ["completed"],
  completed: [],
  declined: [],
};

/** Position of a stage in the journey. `declined` maps to -1. */
export function stageOrder(stage: Stage): number {
  return STAGES.indexOf(stage);
}

/** Progress 0..1 for progress rings and the journey trail. */
export function stageProgress(stage: Stage): number {
  if (stage === "declined") return 0;
  // The loop stages sit "inside" manual review for display purposes.
  const display = stage === "changes_requested" || stage === "revised_cut" ? "manual_review" : stage;
  return stageOrder(display) / (STAGES.length - 1);
}

export function canTransition(from: Stage, to: Stage): boolean {
  return NEXT[from].includes(to);
}

export function nextStages(from: Stage): readonly Stage[] {
  return NEXT[from];
}

export function isTerminal(stage: Stage): boolean {
  return NEXT[stage].length === 0;
}

export class StageError extends Error {
  constructor(public from: Stage, public to: Stage) {
    super(`Illegal stage transition ${from} -> ${to}`);
  }
}

/** Throws if the transition would skip or regress. */
export function assertTransition(from: Stage, to: Stage): void {
  if (!canTransition(from, to)) throw new StageError(from, to);
}

export function appendStage(log: StageLogEntry[], stage: Stage, at: string, extra?: Partial<StageLogEntry>): StageLogEntry[] {
  return [...log, { stage, at, ...extra }];
}

/** Groups of stages used by the UI to summarise where a creator is. */
export type Phase = "invite" | "kit" | "create" | "review" | "publish" | "done";

export function phaseOf(stage: Stage): Phase {
  switch (stage) {
    case "invited":
    case "accepted":
    case "profile_confirmed":
    case "declined":
      return "invite";
    case "preparing":
    case "dispatched":
    case "out_for_delivery":
    case "delivered":
      return "kit";
    case "shoot":
    case "first_cut":
    case "revised_cut":
      return "create";
    case "auto_check":
    case "manual_review":
    case "changes_requested":
      return "review";
    case "approved_to_publish":
    case "link_submitted":
    case "post_verified":
      return "publish";
    case "points_released":
    case "completed":
      return "done";
  }
}

export const PHASES: readonly Phase[] = ["invite", "kit", "create", "review", "publish", "done"];

/** Which seat is expected to act at a given stage. */
export function actorFor(stage: Stage): "creator" | "brand" | "none" {
  switch (stage) {
    case "invited":
    case "accepted":
    case "delivered":
    case "shoot":
    case "changes_requested":
    case "approved_to_publish":
      return "creator";
    case "profile_confirmed":
    case "preparing":
    case "dispatched":
    case "out_for_delivery":
    case "first_cut":
    case "revised_cut":
    case "auto_check":
    case "manual_review":
    case "link_submitted":
    case "post_verified":
    case "points_released":
      return "brand";
    default:
      return "none";
  }
}
