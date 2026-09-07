import { describe, expect, it } from "vitest";
import { ALL_PERMISSIONS, ROLES, can } from "../src/domain/permissions";

describe("permissions", () => {
  it("matches the role table", () => {
    expect(ALL_PERMISSIONS.every((p) => can("super_admin", p))).toBe(true);
    expect(can("brand_manager", "logistics")).toBe(false);
    expect(can("brand_manager", "products")).toBe(true);
    expect(can("campaign_manager", "products")).toBe(false);
    expect(can("content_reviewer", "review")).toBe(true);
    expect(can("content_reviewer", "invite")).toBe(false);
    expect(can("logistics", "logistics")).toBe(true);
    expect(can("finance", "loyalty")).toBe(true);
    expect(can("finance", "review")).toBe(false);
  });
  it("covers every role", () => {
    for (const r of ROLES) expect(ALL_PERMISSIONS.some((p) => can(r, p))).toBe(true);
  });
});
