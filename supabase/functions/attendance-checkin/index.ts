import { corsHeaders } from "../_shared/cors.ts";
import { getActorContext, logAudit } from "../_shared/security.ts";
import { getAuthorizationJwt, getSupabaseAdminClient } from "../_shared/supabase.ts";

type Body = {
  token: string; // qr_tokens.jti
  device_id?: string;
  location?: {
    lat: number;
    lon: number;
    accuracy_m?: number | null;
  };
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

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function resolveStatus(now: Date, session: { starts_at: string; grace_present_until: string | null; grace_late_until: string | null }) {
  const t = now.getTime();
  const startsAt = new Date(session.starts_at).getTime();
  const presentUntil = session.grace_present_until ? new Date(session.grace_present_until).getTime() : startsAt;
  const lateUntil = session.grace_late_until ? new Date(session.grace_late_until).getTime() : presentUntil;
  if (t <= presentUntil) return "present";
  if (t <= lateUntil) return "late";
  return "absent";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const jwt = getAuthorizationJwt(req);
  if (!jwt) return json(401, { error: "missing_auth" });

  const supabase = getSupabaseAdminClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !authData?.user) return json(401, { error: "invalid_auth" });
  const studentId = authData.user.id;
  const actor = await getActorContext(supabase, studentId);
  if (!actor) return json(403, { error: "forbidden" });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.token) return json(400, { error: "missing_token" });

  const now = new Date();
  const tokenHash = await sha256Hex(body.token);

  // 1) Read token first. Do not consume until every authorization check passes.
  const { data: tokenRow } = await supabase
    .from("qr_tokens")
    .select("id, tenant_id, school_id, session_id, expires_at, used_at")
    .eq("jti", tokenHash)
    .maybeSingle();

  if (!tokenRow) {
    await logAudit(supabase, {
      userId: studentId,
      tenantId: actor.tenant_id,
      schoolId: actor.school_id,
      action: "invalid_token_attempt",
      resourceType: "qr_token",
      reason: "invalid_token",
      metadata: { checkin_method: "student_scan" },
    });
    return json(404, { error: "token_not_found" });
  }

  if (tokenRow.used_at) {
    await logAudit(supabase, {
      userId: studentId,
      tenantId: tokenRow.tenant_id,
      schoolId: tokenRow.school_id,
      action: "reused_token_attempt",
      resourceType: "qr_token",
      resourceId: tokenRow.id,
      reason: "token_reused",
      metadata: { session_id: tokenRow.session_id },
    });
    return json(409, { error: "token_already_used" });
  }

  if (new Date(tokenRow.expires_at).getTime() <= now.getTime()) {
    await logAudit(supabase, {
      userId: studentId,
      tenantId: tokenRow.tenant_id,
      schoolId: tokenRow.school_id,
      action: "expired_token_attempt",
      resourceType: "qr_token",
      resourceId: tokenRow.id,
      reason: "token_expired",
      metadata: { session_id: tokenRow.session_id },
    });
    return json(410, { error: "token_expired" });
  }

  const { data: session, error: sErr } = await supabase
    .from("attendance_sessions")
    .select("id, tenant_id, school_id, course_id, campus_id, starts_at, ends_at, grace_present_until, grace_late_until, status")
    .eq("id", tokenRow.session_id)
    .single();

  if (sErr || !session) return json(404, { error: "session_not_found" });
  if (!["active", "grace"].includes(session.status)) {
    await logAudit(supabase, {
      userId: studentId,
      tenantId: session.tenant_id,
      schoolId: session.school_id,
      action: "checkin_denied",
      resourceType: "attendance_session",
      resourceId: session.id,
      reason: "session_not_active",
      metadata: { status: session.status },
    });
    return json(409, { error: "session_not_active" });
  }
  if (new Date(session.ends_at).getTime() < now.getTime()) {
    await logAudit(supabase, {
      userId: studentId,
      tenantId: session.tenant_id,
      schoolId: session.school_id,
      action: "checkin_denied",
      resourceType: "attendance_session",
      resourceId: session.id,
      reason: "session_ended",
    });
    return json(409, { error: "session_ended" });
  }
  if (actor.tenant_id !== session.tenant_id || actor.school_id !== session.school_id) {
    await logAudit(supabase, {
      userId: studentId,
      tenantId: session.tenant_id,
      schoolId: session.school_id,
      action: "checkin_denied",
      resourceType: "attendance_session",
      resourceId: session.id,
      reason: "cross_tenant_forbidden",
    });
    return json(403, { error: "forbidden" });
  }

  // 2) Enrollment check (student must be enrolled)
  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("course_id", session.course_id)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!enrollment) {
    await logAudit(supabase, {
      userId: studentId,
      tenantId: session.tenant_id,
      schoolId: session.school_id,
      action: "checkin_denied",
      resourceType: "attendance_session",
      resourceId: session.id,
      reason: "not_enrolled",
    });
    return json(403, { error: "not_enrolled" });
  }

  // 3) Location check. A session with a campus that has coordinates requires location.
  let locationResult: Record<string, unknown> = { required: false };
  let status = resolveStatus(now, session);
  if (session.campus_id) {
    const { data: campus } = await supabase
      .from("campuses")
      .select("latitude, longitude, geofence_radius_m")
      .eq("id", session.campus_id)
      .maybeSingle();

    if (campus?.latitude != null && campus?.longitude != null) {
      if (!body.location) {
        locationResult = { required: true, ok: false, reason: "missing_location" };
        await logAudit(supabase, {
          userId: studentId,
          tenantId: session.tenant_id,
          schoolId: session.school_id,
          action: "missing_location_attempt",
          resourceType: "attendance_session",
          resourceId: session.id,
          reason: "missing_location",
        });
        return json(400, { error: "missing_location" });
      }
      const dist = distanceMeters(body.location.lat, body.location.lon, campus.latitude, campus.longitude);
      const radius = campus.geofence_radius_m ?? 250;
      const ok = dist <= radius;
      locationResult = { required: true, ok, distance_m: Math.round(dist), radius_m: radius };
      if (!ok) {
        await logAudit(supabase, {
          userId: studentId,
          tenantId: session.tenant_id,
          schoolId: session.school_id,
          action: "outside_location_attempt",
          resourceType: "attendance_session",
          resourceId: session.id,
          reason: "outside_location",
          metadata: locationResult,
        });
        return json(403, { error: "outside_location" });
      }
    }
  }

  // 4) Atomically consume token and write attendance in one DB transaction.
  const { data: record, error: consumeErr } = await supabase.rpc(
    "consume_qr_token_for_checkin",
    {
      p_token_id: tokenRow.id,
      p_student_id: studentId,
      p_device_id: body.device_id ?? null,
      p_status: status,
      p_location_lat: body.location?.lat ?? null,
      p_location_lon: body.location?.lon ?? null,
      p_location_accuracy_m: body.location?.accuracy_m ?? null,
      p_location_result: locationResult,
    }
  );
  if (consumeErr || !record) {
    const { data: latestToken } = await supabase
      .from("qr_tokens")
      .select("used_at, expires_at")
      .eq("id", tokenRow.id)
      .maybeSingle();
    if (latestToken?.used_at) return json(409, { error: "token_already_used" });
    if (latestToken && new Date(latestToken.expires_at).getTime() <= Date.now()) {
      return json(410, { error: "token_expired" });
    }
    return json(409, { error: "token_not_usable" });
  }
  await logAudit(supabase, {
    userId: studentId,
    tenantId: session.tenant_id,
    schoolId: session.school_id,
    action: "checkin_success",
    resourceType: "attendance_record",
    resourceId: record.id,
    metadata: { session_id: session.id, status },
  });

  return json(200, { record });
});

