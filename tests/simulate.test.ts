import { describe, expect, it } from "vitest";
import { autoCheck, fnv1a, trackingNumber } from "../src/domain/simulate";
import type { AcceptanceCriterion } from "../src/domain/types";

const criteria: AcceptanceCriterion[] = [
  { key: "hook", weight: 30, label: { en: "", ar: "" } },
  { key: "productVisibility", weight: 25, label: { en: "", ar: "" } },
  { key: "captions", weight: 20, label: { en: "", ar: "" } },
  { key: "loudness", weight: 15, label: { en: "", ar: "" } },
  { key: "duration", weight: 10, label: { en: "", ar: "" } },
];

describe("automated content check", () => {
  it("is deterministic for the same input", () => {
    const a = autoCheck("cut.mp4", 25_000_000, 1, criteria, 30, { min: 20, max: 40 });
    const b = autoCheck("cut.mp4", 25_000_000, 1, criteria, 30, { min: 20, max: 40 });
    expect(a).toEqual(b);
    expect(a.simulated).toBe(true);
    expect(a.results).toHaveLength(5);
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
  });

  it("changes with size or version", () => {
    const a = autoCheck("cut.mp4", 25_000_000, 1, criteria, 30, { min: 20, max: 40 });
    const b = autoCheck("cut.mp4", 25_000_001, 1, criteria, 30, { min: 20, max: 40 });
    expect(a.hash).not.toEqual(b.hash);
  });

  it("evaluates duration for real", () => {
    const short = autoCheck("cut.mp4", 25_000_000, 1, criteria, 5, { min: 20, max: 40 });
    expect(short.results.find((r) => r.key === "duration")?.passed).toBe(false);
  });

  it("biases later versions toward passing", () => {
    let improved = 0;
    for (let i = 0; i < 200; i++) {
      const v1 = autoCheck(`f${i}.mp4`, 10_000_000 + i * 7919, 1, criteria, 30, { min: 20, max: 40 });
      const v3 = autoCheck(`f${i}.mp4`, 10_000_000 + i * 7919, 3, criteria, 30, { min: 20, max: 40 });
      if (v3.score >= v1.score) improved += 1;
    }
    expect(improved / 200).toBeGreaterThan(0.9);
  });
});

describe("courier", () => {
  it("generates stable tracking numbers per courier", () => {
    expect(trackingNumber("Aramex", "x")).toBe(trackingNumber("Aramex", "x"));
    expect(trackingNumber("Aramex", "x")).toMatch(/^ARX\d{9}AE$/);
    expect(trackingNumber("SMSA", "x")).toMatch(/^SMS/);
  });
  it("hashes deterministically", () => {
    expect(fnv1a("dabur")).toBe(fnv1a("dabur"));
    expect(fnv1a("dabur")).not.toBe(fnv1a("Dabur"));
  });
});
