import type { AppRole } from "./rbac";

export type AccessRule =
  | { kind: "public" }
  | { kind: "authenticated" }
  | { kind: "roles"; anyOf: AppRole[] };

export function canAccess(
  rule: AccessRule,
  ctx: { isAuthenticated: boolean; roles?: AppRole[] }
) {
  if (rule.kind === "public") return true;
  if (!ctx.isAuthenticated) return false;
  if (rule.kind === "authenticated") return true;
  const roles = ctx.roles ?? [];
  return rule.anyOf.some((r) => roles.includes(r));
}

