import { corsHeaders } from "../_shared/cors.ts";
import { randomToken } from "../_shared/crypto.ts";
import {
  canOwnOrManageSession,
  getActorContext,
  logAudit,
} from "../_shared/security.ts";
import { getAuthorizationJwt, getSupabaseAdminClient } from "../_shared/supabase.ts";

type Body = {
  session_id: string;
  ttl_seconds?: number; // default 60
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const jwt = getAuthorizationJwt(req);
  if (!jwt) return json(401, { error: "missing_auth" });

  const supabase = getSupabaseAdminClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !authData?.user) return json(401, { error: "invalid_auth" });
  const actorId = authData.user.id;

  const actor = await getActorContext(supabase, actorId);
  if (!actor) return json(403, { error: "forbidden" });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.session_id) return json(400, { error: "missing_session_id" });

  const ttl = Math.max(10, Math.min(body.ttl_seconds ?? 60, 300));
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl * 1000);
  const tokenRaw = randomToken(32);
  const tokenHash = await sha256Hex(tokenRaw);

  const { data: session, error: sErr } = await supabase
    .from("attendance_sessions")
    .select("id, tenant_id, school_id, teacher_id, status, ends_at")
    .eq("id", body.session_id)
    .single();

  if (sErr || !session) return json(404, { error: "session_not_found" });
  if (!canOwnOrManageSession(actor, session)) {
    await logAudit(supabase, {
      userId: actorId,
      tenantId: session.tenant_id,
      schoolId: session.school_id,
      action: "session_qr_denied",
      resourceType: "attendance_session",
      resourceId: session.id,
      reason: "role_or_ownership_forbidden",
    });
    return json(403, { error: "forbidden" });
  }
  if (!["active", "grace"].includes(session.status)) {
    await logAudit(supabase, {
      userId: actorId,
      tenantId: session.tenant_id,
      schoolId: session.school_id,
      action: "session_qr_denied",
      resourceType: "attendance_session",
      resourceId: session.id,
      reason: "session_not_active",
      metadata: { status: session.status },
    });
    return json(409, { error: "session_not_active" });
  }
  if (new Date(session.ends_at).getTime() <= now.getTime()) {
    await logAudit(supabase, {
      userId: actorId,
      tenantId: session.tenant_id,
      schoolId: session.school_id,
      action: "session_qr_denied",
      resourceType: "attendance_session",
      resourceId: session.id,
      reason: "session_ended",
    });
    return json(409, { error: "session_ended" });
  }

  const { error: iErr } = await supabase.from("qr_tokens").insert({
    tenant_id: session.tenant_id,
    school_id: session.school_id,
    session_id: session.id,
    // Store hashed token only to reduce leakage risk.
    jti: tokenHash,
    expires_at: expiresAt.toISOString(),
  });
  if (iErr) return json(500, { error: "token_create_failed" });
  await logAudit(supabase, {
    userId: actorId,
    tenantId: session.tenant_id,
    schoolId: session.school_id,
    action: "session_qr_created",
    resourceType: "attendance_session",
    resourceId: session.id,
    metadata: { ttl_seconds: ttl },
  });

  // QR payload intentionally contains no PII.
  return json(200, {
    token: tokenRaw,
    expires_at: expiresAt.toISOString(),
    ttl_seconds: ttl,
    session_id: session.id,
  });
});

