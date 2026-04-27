export type AppRole =
  | "student"
  | "teacher"
  | "admin"
  | "school_manager"
  | "super_admin";

export type LegacyRole = "student" | "docent";

export function mapLegacyRoleToAppRoles(role: LegacyRole): AppRole[] {
  if (role === "docent") return ["teacher"];
  return ["student"];
}

export function pickPrimaryRole(roles: AppRole[]): AppRole {
  // Highest privilege first; stable and explicit.
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("school_manager")) return "school_manager";
  if (roles.includes("teacher")) return "teacher";
  return "student";
}

export function hasAnyRole(userRoles: AppRole[] | undefined, allowed: AppRole[]) {
  if (!userRoles || userRoles.length === 0) return false;
  return allowed.some((r) => userRoles.includes(r));
}

