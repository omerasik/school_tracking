import { corsHeaders } from "../_shared/cors.ts";
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
  const teacherId = authData.user.id;

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
    if (te.teacher_id !== teacherId) return json(403, { error: "not_teacher_of_entry" });
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

  // Resolve tenant/school from teacher profile when not given by timetable
  if (!tenantId || !schoolId) {
    const { data: profile, error: pError } = await supabase
      .from("profiles")
      .select("tenant_id, school_id")
      .eq("id", teacherId)
      .single();
    if (pError || !profile?.tenant_id || !profile?.school_id) {
      return json(400, { error: "teacher_profile_missing_tenant" });
    }
    tenantId = tenantId ?? profile.tenant_id;
    schoolId = schoolId ?? profile.school_id;
  }

  const gracePresentUntil = addMinutes(startsAt, presentGrace);
  const graceLateUntil = addMinutes(gracePresentUntil, lateGrace);

  // Ensure only one active session per teacher+course overlapping time window
  const { data: existing } = await supabase
    .from("attendance_sessions")
    .select("id, status")
    .eq("teacher_id", teacherId)
    .eq("course_id", courseId)
    .in("status", ["draft", "active", "grace"])
    .gte("ends_at", startsAt.toISOString())
    .lte("starts_at", endsAt.toISOString())
    .maybeSingle();

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
      teacher_id: teacherId,
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
  return json(200, { session: created, reused: false });
});

