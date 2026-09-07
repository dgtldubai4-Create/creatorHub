import type { Permission, Role } from "./types";

export const ALL_PERMISSIONS: readonly Permission[] = ["campaigns", "invite", "review", "logistics", "loyalty", "products"];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  brand_manager: ["campaigns", "invite", "review", "products"],
  campaign_manager: ["campaigns", "invite", "review"],
  content_reviewer: ["review"],
  logistics: ["logistics"],
  finance: ["loyalty"],
};

export const ROLES: readonly Role[] = ["super_admin", "brand_manager", "campaign_manager", "content_reviewer", "logistics", "finance"];

/** The single predicate every brand-team route and mutation checks. */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export class PermissionError extends Error {
  constructor(public role: Role, public permission: Permission) {
    super(`Role ${role} lacks permission ${permission}`);
  }
}

export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) throw new PermissionError(role, permission);
}

/** Maps an admin route prefix to the permission that unlocks it. */
export const ROUTE_PERMISSION: Record<string, Permission | null> = {
  "/admin": null,
  "/admin/campaigns": "campaigns",
  "/admin/creators": "invite",
  "/admin/review": "review",
  "/admin/logistics": "logistics",
  "/admin/loyalty": "loyalty",
  "/admin/products": "products",
};
