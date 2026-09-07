import { describe, expect, it } from "vitest";
import { STAGES, canTransition, stageOrder, stageProgress, phaseOf, nextStages } from "../src/domain/stages";

describe("stage machine", () => {
  it("orders every stage once", () => {
    expect(new Set(STAGES).size).toBe(STAGES.length);
    expect(stageOrder("invited")).toBe(0);
    expect(stageOrder("completed")).toBe(STAGES.length - 1);
    expect(stageOrder("declined")).toBe(-1);
  });

  it("only allows the next edge", () => {
    expect(canTransition("invited", "accepted")).toBe(true);
    expect(canTransition("invited", "declined")).toBe(true);
    expect(canTransition("invited", "profile_confirmed")).toBe(false);
    expect(canTransition("accepted", "invited")).toBe(false);
    expect(canTransition("delivered", "first_cut")).toBe(false);
  });

  it("models the revise loop explicitly", () => {
    expect(canTransition("manual_review", "changes_requested")).toBe(true);
    expect(canTransition("changes_requested", "revised_cut")).toBe(true);
    expect(canTransition("revised_cut", "manual_review")).toBe(true);
    expect(canTransition("revised_cut", "approved_to_publish")).toBe(false);
  });

  it("never lets points release before verification", () => {
    expect(nextStages("link_submitted")).toEqual(["post_verified"]);
    expect(canTransition("link_submitted", "points_released")).toBe(false);
  });

  it("gives every stage a phase and monotone progress", () => {
    let last = -1;
    for (const s of STAGES) {
      expect(phaseOf(s)).toBeTruthy();
      const p = stageProgress(s);
      if (s !== "changes_requested" && s !== "revised_cut") {
        expect(p).toBeGreaterThan(last);
        last = p;
      }
    }
  });
});
