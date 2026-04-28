import { getSupabaseAdminClient } from "./supabase.ts";

type SupabaseAdminClient = ReturnType<typeof getSupabaseAdminClient>;

export type AppRole =
  | "student"
  | "teacher"
  | "admin"
  | "school_manager"
  | "super_admin";

export type ActorContext = {
  id: string;
  tenant_id: string | null;
  school_id: string | null;
  legacy_role: string | null;
  roles: AppRole[];
};

export async function logAudit(
  supabase: SupabaseAdminClient,
  params: {
    userId: string;
    tenantId?: string | null;
    schoolId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await supabase.from("audit_logs").insert({
      tenant_id: params.tenantId ?? null,
      school_id: params.schoolId ?? null,
      actor_user_id: params.userId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId ?? null,
      reason: params.reason ?? null,
      metadata: params.metadata ?? {},
    });
  } catch {
    // Security decisions must not depend on audit availability.
  }
}

export async function getActorContext(
  supabase: SupabaseAdminClient,
  userId: string
): Promise<ActorContext | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, tenant_id, school_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) return null;

  let legacyRole: string | null = null;
  const { data: legacyProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  legacyRole = (legacyProfile as { role?: string } | null)?.role ?? null;

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role_key")
    .eq("user_id", userId);

  const roles = ((roleRows ?? []) as { role_key?: AppRole }[])
    .map((row) => row.role_key)
    .filter(Boolean) as AppRole[];

  return {
    id: userId,
    tenant_id: (profile as { tenant_id?: string | null }).tenant_id ?? null,
    school_id: (profile as { school_id?: string | null }).school_id ?? null,
    legacy_role: legacyRole,
    roles,
  };
}

export function hasAnyRole(actor: ActorContext, allowed: AppRole[]) {
  return allowed.some((role) => actor.roles.includes(role));
}

export function isTeacherLike(actor: ActorContext) {
  return actor.legacy_role === "docent" || hasAnyRole(actor, ["teacher"]);
}

export function isTenantAdminLike(actor: ActorContext) {
  return hasAnyRole(actor, ["admin", "school_manager"]);
}

export function isSuperAdmin(actor: ActorContext) {
  return hasAnyRole(actor, ["super_admin"]);
}

export function canManageTenant(actor: ActorContext, tenantId: string | null) {
  if (isSuperAdmin(actor)) return true;
  if (!tenantId || !actor.tenant_id) return false;
  return isTenantAdminLike(actor) && actor.tenant_id === tenantId;
}

export function canOwnOrManageSession(
  actor: ActorContext,
  session: { tenant_id: string | null; teacher_id: string | null }
) {
  if (canManageTenant(actor, session.tenant_id)) return true;
  return isTeacherLike(actor) && session.teacher_id === actor.id;
}
