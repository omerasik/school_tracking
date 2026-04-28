import { corsHeaders } from "../_shared/cors.ts";
import {
  canManageTenant,
  getActorContext,
  isTeacherLike,
  logAudit,
} from "../_shared/security.ts";
import { getAuthorizationJwt, getSupabaseAdminClient } from "../_shared/supabase.ts";

type Body = {
  timetable_entry_id?: string;
  course_id?: string;
  starts_at?: string; // ISO
  ends_at?: string; // ISO
  present_grace_minutes?: number; // default 10
  late_grace_minutes?: number; // default 15
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
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
  if (!isTeacherLike(actor) && !canManageTenant(actor, actor.tenant_id)) {
    await logAudit(supabase, {
      userId: actorId,
      tenantId: actor.tenant_id,
      schoolId: actor.school_id,
      action: "session_start_denied",
      resourceType: "attendance_session",
      reason: "role_forbidden",
    });
    return json(403, { error: "forbidden" });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return json(400, { error: "invalid_json" });

  const presentGrace = body.present_grace_minutes ?? 10;
  const lateGrace = body.late_grace_minutes ?? 15;

  // Resolve timetable entry -> defaults
  let startsAt: Date | null = body.starts_at ? new Date(body.starts_at) : null;
  let endsAt: Date | null = body.ends_at ? new Date(body.ends_at) : null;
  let courseId = body.course_id ?? null;
  let timetableEntryId = body.timetable_entry_id ?? null;
  let tenantId: string | null = null;
  let schoolId: string | null = null;
  let campusId: string | null = null;
  let roomId: string | null = null;

  if (timetableEntryId) {
    const { data: te, error: teError } = await supabase
      .from("timetable_entries")
      .select("id, tenant_id, school_id, course_id, campus_id, room_id, starts_at, ends_at, teacher_id")
      .eq("id", timetableEntryId)
      .single();
    if (teError || !te) return json(404, { error: "timetable_entry_not_found" });
    const canStartEntry =
      (isTeacherLike(actor) && te.teacher_id === actorId) ||
      canManageTenant(actor, te.tenant_id);
    if (!canStartEntry) {
      await logAudit(supabase, {
        userId: actorId,
        tenantId: te.tenant_id,
        schoolId: te.school_id,
        action: "session_start_denied",
        resourceType: "timetable_entry",
        resourceId: te.id,
        reason: "ownership_forbidden",
      });
      return json(403, { error: "forbidden" });
    }
    tenantId = te.tenant_id;
    schoolId = te.school_id;
    campusId = te.campus_id;
    roomId = te.room_id;
    courseId = te.course_id;
    startsAt = startsAt ?? new Date(te.starts_at);
    endsAt = endsAt ?? new Date(te.ends_at);
  }

  if (!startsAt || isNaN(startsAt.getTime())) startsAt = new Date();
  if (!endsAt || isNaN(endsAt.getTime())) endsAt = addMinutes(startsAt, presentGrace + lateGrace + 60);
  if (!courseId) return json(400, { error: "missing_course_id" });

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, tenant_id, school_id")
    .eq("id", courseId)
    .single();
  if (courseError || !course) return json(404, { error: "course_not_found" });

  if (!tenantId) tenantId = course.tenant_id;
  if (!schoolId) schoolId = course.school_id;

  if (tenantId !== course.tenant_id || schoolId !== course.school_id) {
    await logAudit(supabase, {
      userId: actorId,
      tenantId,
      schoolId,
      action: "session_start_denied",
      resourceType: "course",
      resourceId: course.id,
      reason: "tenant_mismatch",
      metadata: { course_tenant_id: course.tenant_id },
    });
    return json(403, { error: "forbidden" });
  }

  if (isTeacherLike(actor) && !canManageTenant(actor, tenantId)) {
    const { data: entries } = await supabase
      .from("timetable_entries")
      .select("id, campus_id, room_id, starts_at, ends_at")
      .eq("course_id", courseId)
      .eq("teacher_id", actorId)
      .eq("tenant_id", tenantId)
      .lte("starts_at", endsAt.toISOString())
      .gte("ends_at", startsAt.toISOString())
      .limit(2);

    if (!entries || entries.length === 0) {
      await logAudit(supabase, {
        userId: actorId,
        tenantId,
        schoolId,
        action: "session_start_denied",
        resourceType: "course",
        resourceId: courseId,
        reason: "teacher_course_ownership_forbidden",
      });
      return json(403, { error: "forbidden" });
    }
    if (!timetableEntryId && entries.length > 1) {
      await logAudit(supabase, {
        userId: actorId,
        tenantId,
        schoolId,
        action: "session_start_denied",
        resourceType: "course",
        resourceId: courseId,
        reason: "ambiguous_timetable_entry",
      });
      return json(409, { error: "ambiguous_timetable_entry" });
    }
    const entry = entries[0];
    timetableEntryId = timetableEntryId ?? entry.id;
    campusId = campusId ?? entry.campus_id;
    roomId = roomId ?? entry.room_id;
    startsAt = body.starts_at ? startsAt : new Date(entry.starts_at);
    endsAt = body.ends_at ? endsAt : new Date(entry.ends_at);
  }

  if (!canManageTenant(actor, tenantId) && !(isTeacherLike(actor) && actor.tenant_id === tenantId)) {
    await logAudit(supabase, {
      userId: actorId,
      tenantId,
      schoolId,
      action: "session_start_denied",
      resourceType: "course",
      resourceId: courseId,
      reason: "cross_tenant_forbidden",
    });
    return json(403, { error: "forbidden" });
  }

  // Resolve tenant/school from teacher profile when not given by timetable
  if (!tenantId || !schoolId) {
    if (!actor.tenant_id || !actor.school_id) {
      return json(400, { error: "teacher_profile_missing_tenant" });
    }
    tenantId = tenantId ?? actor.tenant_id;
    schoolId = schoolId ?? actor.school_id;
  }

  if (!startsAt || isNaN(startsAt.getTime()) || !endsAt || isNaN(endsAt.getTime())) {
    return json(400, { error: "invalid_session_time" });
  }
  if (endsAt.getTime() <= startsAt.getTime()) return json(400, { error: "invalid_session_time" });

  const gracePresentUntil = addMinutes(startsAt, presentGrace);
  const graceLateUntil = addMinutes(gracePresentUntil, lateGrace);

  // Ensure only one active session per teacher+course overlapping time window
  const { data: existingSessions } = await supabase
    .from("attendance_sessions")
    .select("id, status")
    .eq("teacher_id", actorId)
    .eq("course_id", courseId)
    .in("status", ["draft", "active", "grace"])
    .gte("ends_at", startsAt.toISOString())
    .lte("starts_at", endsAt.toISOString())
    .limit(2);

  if (existingSessions && existingSessions.length > 1) {
    await logAudit(supabase, {
      userId: actorId,
      tenantId,
      schoolId,
      action: "session_start_denied",
      resourceType: "attendance_session",
      reason: "ambiguous_existing_session",
      metadata: { course_id: courseId },
    });
    return json(409, { error: "ambiguous_existing_session" });
  }

  const existing = existingSessions?.[0] ?? null;
  if (existing?.id) {
    const { data: updated, error: uError } = await supabase
      .from("attendance_sessions")
      .update({
        status: "active",
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        grace_present_until: gracePresentUntil.toISOString(),
        grace_late_until: graceLateUntil.toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (uError || !updated) return json(500, { error: "session_update_failed" });
    return json(200, { session: updated, reused: true });
  }

  const { data: created, error: cError } = await supabase
    .from("attendance_sessions")
    .insert({
      tenant_id: tenantId,
      school_id: schoolId,
      timetable_entry_id: timetableEntryId,
      course_id: courseId,
      teacher_id: actorId,
      campus_id: campusId,
      room_id: roomId,
      status: "active",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      grace_present_until: gracePresentUntil.toISOString(),
      grace_late_until: graceLateUntil.toISOString(),
      policy_snapshot: {
        present_grace_minutes: presentGrace,
        late_grace_minutes: lateGrace,
      },
    })
    .select("*")
    .single();

  if (cError || !created) return json(500, { error: "session_create_failed" });
  await logAudit(supabase, {
    userId: actorId,
    tenantId,
    schoolId,
    action: "session_start_success",
    resourceType: "attendance_session",
    resourceId: created.id,
    metadata: { course_id: courseId, timetable_entry_id: timetableEntryId },
  });
  return json(200, { session: created, reused: false });
});

