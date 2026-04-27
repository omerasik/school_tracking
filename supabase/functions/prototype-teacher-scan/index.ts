import { corsHeaders } from "../_shared/cors.ts";
import { getAuthorizationJwt, getSupabaseAdminClient } from "../_shared/supabase.ts";

type Body = {
  qr: string;
  location?: { lat: number; lon: number; accuracy_m?: number | null };
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function logAudit(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  params: {
    userId: string;
    action: string;
    resourceType: string;
    resourceId?: string | number | null;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await supabase.from("audit_logs").insert({
      actor_user_id: params.userId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId ? String(params.resourceId) : null,
      reason: params.reason ?? null,
      metadata: params.metadata ?? {},
    });
  } catch {
    // no-op
  }
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const jwt = getAuthorizationJwt(req);
  if (!jwt) return json(401, { error: "missing_auth" });

  const supabase = getSupabaseAdminClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !authData?.user) return json(401, { error: "invalid_auth" });
  const actorId = authData.user.id;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.qr) return json(400, { error: "missing_qr" });

  const qr = body.qr.trim();
  const parts = qr.split("_");
  const studentId = parts[0];
  const qrTimestamp = parts.length === 2 ? Number(parts[1]) : null;

  // Prototype expiry: 10 seconds
  if (qrTimestamp && Number.isFinite(qrTimestamp)) {
    const ageMs = Date.now() - qrTimestamp;
    if (ageMs > 10_000) return json(410, { error: "qr_expired" });
  }

  // Role guard: caller must be docent/teacher.
  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .eq("id", actorId)
    .maybeSingle();

  const legacyDocent = actorProfile?.role === "docent";
  let hasTeacherRole = false;
  const { data: roleRow, error: roleErr } = await supabase
    .from("user_roles")
    .select("role_key")
    .eq("user_id", actorId)
    .in("role_key", ["teacher", "admin", "school_manager", "super_admin"])
    .limit(1)
    .maybeSingle();
  if (!roleErr && roleRow) hasTeacherRole = true;
  // If user_roles table is absent in legacy environment, rely on profile.role.
  const isMissingUserRolesTable = (roleErr as any)?.code === "42P01";

  if (!legacyDocent && !hasTeacherRole && !isMissingUserRolesTable) {
    await logAudit(supabase, {
      userId: actorId,
      action: "unauthorized_scan_attempt",
      resourceType: "attendance_scan",
      reason: "role_forbidden",
    });
    return json(403, { error: "forbidden" });
  }
  if (!legacyDocent && !hasTeacherRole && isMissingUserRolesTable) {
    await logAudit(supabase, {
      userId: actorId,
      action: "unauthorized_scan_attempt",
      resourceType: "attendance_scan",
      reason: "legacy_role_forbidden",
    });
    return json(403, { error: "forbidden" });
  }

  // Validate student exists
  const { data: student, error: studentErr } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name")
    .eq("id", studentId)
    .eq("role", "student")
    .single();
  if (studentErr || !student) return json(404, { error: "student_not_found" });

  // Current course ownership guard: teacher can only scan in owned active course.
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().substring(0, 8);
  const { data: activeCourses } = await supabase
    .from("courses")
    .select("*")
    .eq("date", today)
    .lte("start_time", currentTime)
    .gte("end_time", currentTime)
    .limit(10);

  if (!activeCourses || activeCourses.length === 0) return json(409, { error: "no_active_course" });

  const actorFullName = `${actorProfile?.first_name ?? ""} ${actorProfile?.last_name ?? ""}`.trim().toLowerCase();
  const ownedCourses = activeCourses.filter((course: any) => {
    const names = Array.isArray(course.teacher_names)
      ? course.teacher_names.map((n: string) => n.toLowerCase())
      : [];
    return actorFullName.length > 0 && names.includes(actorFullName);
  });

  if (ownedCourses.length === 0) {
    await logAudit(supabase, {
      userId: actorId,
      action: "teacher_ownership_failure",
      resourceType: "course",
      reason: "not_assigned_to_active_course",
      metadata: { active_course_count: activeCourses.length },
    });
    return json(403, { error: "forbidden" });
  }
  if (ownedCourses.length > 1) {
    await logAudit(supabase, {
      userId: actorId,
      action: "teacher_ownership_failure",
      resourceType: "course",
      reason: "ambiguous_active_courses",
      metadata: { owned_active_course_count: ownedCourses.length },
    });
    return json(409, { error: "ambiguous_active_course" });
  }

  const course = ownedCourses[0];

  // Duplicate attendance
  const { data: existingAttendance } = await supabase
    .from("attendances")
    .select("id, is_present")
    .eq("user_id", studentId)
    .eq("date", today)
    .eq("course_id", course.id)
    .maybeSingle();
  if (existingAttendance?.is_present) return json(409, { error: "already_checked_in" });

  // QR hash reuse check (same day)
  const { data: existingHashUsage } = await supabase
    .from("attendances")
    .select("id")
    .eq("hash", qr)
    .eq("date", today)
    .maybeSingle();
  if (existingHashUsage) return json(409, { error: "qr_reused" });

  // Location check (prototype: within 1km of nearest campus)
  if (!body.location) return json(400, { error: "missing_location" });

  const { data: campuses } = await supabase
    .from("campuses")
    .select("id, latitude, longitude")
    .limit(50);
  if (!campuses || campuses.length === 0) return json(409, { error: "no_campuses" });

  let nearest: any = null;
  let best = Infinity;
  for (const c of campuses) {
    if (!c.latitude || !c.longitude) continue;
    const d = distanceMeters(body.location.lat, body.location.lon, c.latitude, c.longitude);
    if (d < best) {
      best = d;
      nearest = c;
    }
  }
  if (!nearest) return json(409, { error: "no_campus_coords" });
  if (best > 1000) {
    await logAudit(supabase, {
      userId: actorId,
      action: "outside_location_attempt",
      resourceType: "attendance_scan",
      reason: "outside_geofence",
      metadata: { distance_m: Math.round(best), course_id: course.id },
    });
    return json(403, { error: "outside_geofence", distance_m: Math.round(best) });
  }

  // Insert/update attendance
  if (existingAttendance && !existingAttendance.is_present) {
    const { data: updated, error: uErr } = await supabase
      .from("attendances")
      .update({
        is_present: true,
        check_in_time: now.toISOString(),
        hash: qr,
        latitude: body.location.lat,
        longitude: body.location.lon,
        location_accuracy: body.location.accuracy_m ?? null,
      })
      .eq("id", existingAttendance.id)
      .select("id")
      .single();
    if (uErr || !updated) return json(500, { error: "attendance_update_failed" });
    await logAudit(supabase, {
      userId: actorId,
      action: "checkin_success",
      resourceType: "attendance",
      resourceId: updated.id,
      metadata: { course_id: course.id, reused: true },
    });
    return json(200, {
      attendance_id: updated.id,
      student: { id: student.id, first_name: student.first_name, last_name: student.last_name },
      course: { id: course.id, course_name: course.course_name, classroom: course.classroom },
      reused: true,
    });
  }

  const { data: inserted, error: iErr } = await supabase.from("attendances").insert({
    user_id: studentId,
    date: today,
    campus_id: nearest.id,
    course_id: course.id,
    course_name: course.course_name,
    classroom: course.classroom,
    lesson_type: course.lesson_type ?? "live@campus",
    is_present: true,
    hash: qr,
    qr_code_expires_at: now.toISOString(),
    check_in_time: now.toISOString(),
    latitude: body.location.lat,
    longitude: body.location.lon,
    location_accuracy: body.location.accuracy_m ?? null,
  }).select("id").single();

  if (iErr || !inserted) return json(500, { error: "attendance_insert_failed" });
  await logAudit(supabase, {
    userId: actorId,
    action: "checkin_success",
    resourceType: "attendance",
    resourceId: inserted.id,
    metadata: { course_id: course.id, reused: false },
  });

  return json(200, {
    attendance_id: inserted.id,
    student: { id: student.id, first_name: student.first_name, last_name: student.last_name },
    course: { id: course.id, course_name: course.course_name, classroom: course.classroom },
    reused: false,
  });
});

