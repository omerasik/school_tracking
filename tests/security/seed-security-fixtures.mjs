import {
  TEST_PREFIX,
  adminClient,
  clockTime,
  maybeHasColumn,
  maybeHasTable,
  must,
  nowIso,
  readEnv,
  saveFixtures,
  todayIsoDate,
} from "./security-test-utils.mjs";

const USERS = {
  studentA: {
    email: "school-tracking.security.student.a@example.com",
    firstName: "Security",
    lastName: "Student A",
    legacyRole: "student",
    roles: ["student"],
    tenant: "a",
  },
  teacherA: {
    email: "school-tracking.security.teacher.a@example.com",
    firstName: "Security",
    lastName: "Teacher A",
    legacyRole: "docent",
    roles: ["teacher"],
    tenant: "a",
  },
  teacherB: {
    email: "school-tracking.security.teacher.b@example.com",
    firstName: "Security",
    lastName: "Teacher B",
    legacyRole: "docent",
    roles: ["teacher"],
    tenant: "b",
  },
  adminA: {
    email: "school-tracking.security.admin.a@example.com",
    firstName: "Security",
    lastName: "Admin A",
    legacyRole: "student",
    roles: ["admin"],
    tenant: "a",
  },
  adminB: {
    email: "school-tracking.security.admin.b@example.com",
    firstName: "Security",
    lastName: "Admin B",
    legacyRole: "student",
    roles: ["admin"],
    tenant: "b",
  },
  superAdmin: {
    email: "school-tracking.security.super.admin@example.com",
    firstName: "Security",
    lastName: "Super Admin",
    legacyRole: "student",
    roles: ["super_admin"],
    tenant: "a",
  },
};

async function getOrCreateAuthUser(supabase, env, spec) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const found = data.users.find((user) => user.email?.toLowerCase() === spec.email.toLowerCase());
    if (found) {
      await supabase.auth.admin.updateUserById(found.id, {
        password: env.password,
        user_metadata: {
          first_name: spec.firstName,
          last_name: spec.lastName,
          role: spec.legacyRole,
        },
      });
      return found;
    }
    if (data.users.length < 1000) break;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: spec.email,
    password: env.password,
    email_confirm: true,
    user_metadata: {
      first_name: spec.firstName,
      last_name: spec.lastName,
      role: spec.legacyRole,
    },
  });
  if (error) throw new Error(`createUser ${spec.email} failed: ${error.message}`);
  return data.user;
}

async function upsertProfile(supabase, user, spec, tenant, school, schema) {
  const row = {
    id: user.id,
    first_name: spec.firstName,
    last_name: spec.lastName,
  };
  if (schema.hasProfileRole) row.role = spec.legacyRole;
  if (schema.hasTenantId) row.tenant_id = tenant?.id ?? null;
  if (schema.hasSchoolId) row.school_id = school?.id ?? null;
  await must(
    `upsert profile ${spec.email}`,
    supabase.from("profiles").upsert(row, { onConflict: "id" })
  );
}

async function seedSaas(supabase, usersByKey) {
  const hasTenants = await maybeHasTable(supabase, "tenants");
  const hasSessions = await maybeHasTable(supabase, "attendance_sessions");
  if (!hasTenants || !hasSessions) return { supported: false };

  await supabase.from("tenants").delete().in("slug", [`${TEST_PREFIX}-a`, `${TEST_PREFIX}-b`]);

  const tenantA = await must(
    "tenant A",
    supabase
      .from("tenants")
      .upsert({ name: "School Tracking Security Tenant A", slug: `${TEST_PREFIX}-a`, status: "active" }, { onConflict: "slug" })
      .select("*")
      .single()
  );
  const tenantB = await must(
    "tenant B",
    supabase
      .from("tenants")
      .upsert({ name: "School Tracking Security Tenant B", slug: `${TEST_PREFIX}-b`, status: "active" }, { onConflict: "slug" })
      .select("*")
      .single()
  );

  const schoolA = await must(
    "school A",
    supabase.from("schools").insert({ tenant_id: tenantA.id, name: "School Tracking Security School A", status: "active" }).select("*").single()
  );
  const schoolB = await must(
    "school B",
    supabase.from("schools").insert({ tenant_id: tenantB.id, name: "School Tracking Security School B", status: "active" }).select("*").single()
  );

  const campusA = await must(
    "campus A",
    supabase
      .from("campuses")
      .insert({
        tenant_id: tenantA.id,
        school_id: schoolA.id,
        name: "School Tracking Security Campus A",
        address: "Security Test",
        latitude: 51.03889,
        longitude: 3.69167,
        geofence_radius_m: 500,
      })
      .select("*")
      .single()
  );
  const campusB = await must(
    "campus B",
    supabase
      .from("campuses")
      .insert({
        tenant_id: tenantB.id,
        school_id: schoolB.id,
        name: "School Tracking Security Campus B",
        address: "Security Test",
        latitude: 51.05455,
        longitude: 3.71891,
        geofence_radius_m: 500,
      })
      .select("*")
      .single()
  );

  const profileMap = {
    studentA: [tenantA, schoolA],
    teacherA: [tenantA, schoolA],
    adminA: [tenantA, schoolA],
    superAdmin: [tenantA, schoolA],
    teacherB: [tenantB, schoolB],
    adminB: [tenantB, schoolB],
  };
  for (const [key, user] of Object.entries(usersByKey)) {
    const spec = USERS[key];
    const [tenant, school] = profileMap[key];
    await upsertProfile(
      supabase,
      user,
      spec,
      tenant,
      school,
      { hasProfileRole: await maybeHasColumn(supabase, "profiles", "role"), hasTenantId: true, hasSchoolId: true }
    );
    await supabase.from("user_roles").delete().eq("user_id", user.id);
    for (const role of spec.roles) {
      await must(
        `role ${role} for ${key}`,
        supabase.from("user_roles").upsert({ user_id: user.id, role_key: role }, { onConflict: "user_id,role_key" })
      );
    }
  }

  const courseA = await must(
    "course A",
    supabase
      .from("courses")
      .insert({ tenant_id: tenantA.id, school_id: schoolA.id, code: "SEC-A", name: "Security Patch Course A" })
      .select("*")
      .single()
  );
  const courseB = await must(
    "course B",
    supabase
      .from("courses")
      .insert({ tenant_id: tenantB.id, school_id: schoolB.id, code: "SEC-B", name: "Security Patch Course B" })
      .select("*")
      .single()
  );

  await must(
    "student enrollment",
    supabase.from("course_enrollments").insert({
      tenant_id: tenantA.id,
      school_id: schoolA.id,
      course_id: courseA.id,
      student_id: usersByKey.studentA.id,
    })
  );

  const activeSession = await must(
    "active session",
    supabase
      .from("attendance_sessions")
      .insert({
        tenant_id: tenantA.id,
        school_id: schoolA.id,
        course_id: courseA.id,
        teacher_id: usersByKey.teacherA.id,
        campus_id: campusA.id,
        status: "active",
        starts_at: nowIso(-5 * 60_000),
        ends_at: nowIso(60 * 60_000),
        grace_present_until: nowIso(15 * 60_000),
        grace_late_until: nowIso(45 * 60_000),
        policy_snapshot: {},
      })
      .select("*")
      .single()
  );

  const finalizedSession = await must(
    "finalizable session",
    supabase
      .from("attendance_sessions")
      .insert({
        tenant_id: tenantA.id,
        school_id: schoolA.id,
        course_id: courseA.id,
        teacher_id: usersByKey.teacherA.id,
        campus_id: campusA.id,
        status: "closed",
        starts_at: nowIso(-90 * 60_000),
        ends_at: nowIso(-30 * 60_000),
        policy_snapshot: {},
      })
      .select("*")
      .single()
  );

  const otherTenantSession = await must(
    "tenant B session",
    supabase
      .from("attendance_sessions")
      .insert({
        tenant_id: tenantB.id,
        school_id: schoolB.id,
        course_id: courseB.id,
        teacher_id: usersByKey.teacherB.id,
        campus_id: campusB.id,
        status: "active",
        starts_at: nowIso(-5 * 60_000),
        ends_at: nowIso(60 * 60_000),
        policy_snapshot: {},
      })
      .select("*")
      .single()
  );

  const finalizedRecord = await must(
    "finalized attendance record",
    supabase
      .from("attendance_records")
      .insert({
        tenant_id: tenantA.id,
        school_id: schoolA.id,
        session_id: finalizedSession.id,
        student_id: usersByKey.studentA.id,
        status: "present",
        source: "security_seed",
        checked_in_at: nowIso(-80 * 60_000),
      })
      .select("*")
      .single()
  );

  const otherTenantRecord = await must(
    "tenant B attendance record",
    supabase
      .from("attendance_records")
      .insert({
        tenant_id: tenantB.id,
        school_id: schoolB.id,
        session_id: otherTenantSession.id,
        student_id: usersByKey.teacherB.id,
        status: "present",
        source: "security_seed",
        checked_in_at: nowIso(),
      })
      .select("*")
      .single()
  );

  await must(
    "finalize session",
    supabase
      .from("attendance_sessions")
      .update({
        status: "finalized",
        finalized_at: nowIso(-10 * 60_000),
        finalized_by: usersByKey.teacherA.id,
      })
      .eq("id", finalizedSession.id)
  );

  return {
    supported: true,
    tenants: { a: tenantA.id, b: tenantB.id },
    schools: { a: schoolA.id, b: schoolB.id },
    campuses: { a: campusA.id, b: campusB.id },
    courses: { a: courseA.id, b: courseB.id },
    sessions: {
      active: activeSession.id,
      finalized: finalizedSession.id,
      otherTenant: otherTenantSession.id,
    },
    records: {
      finalized: finalizedRecord.id,
      otherTenant: otherTenantRecord.id,
    },
  };
}

async function seedLegacyPrototype(supabase, usersByKey) {
  const hasLegacyProfiles = await maybeHasColumn(supabase, "profiles", "role");
  const hasLegacyCourses = await maybeHasColumn(supabase, "courses", "course_name");
  const hasAttendances = await maybeHasTable(supabase, "attendances");
  const hasQrCodes = await maybeHasTable(supabase, "qr_codes");
  if (!hasLegacyProfiles || !hasLegacyCourses || !hasAttendances || !hasQrCodes) return { supported: false };

  for (const [key, user] of Object.entries(usersByKey)) {
    await upsertProfile(
      supabase,
      user,
      USERS[key],
      null,
      null,
      { hasProfileRole: true, hasTenantId: await maybeHasColumn(supabase, "profiles", "tenant_id"), hasSchoolId: false }
    );
  }

  await supabase.from("attendances").delete().like("course_name", "Security Patch%");
  await supabase.from("qr_codes").delete().like("hash", `${TEST_PREFIX}-%`);
  await supabase.from("courses").delete().like("course_name", "Security Patch%");

  let campusId = 1;
  const { data: campus } = await supabase.from("campuses").select("id").limit(1).maybeSingle();
  if (campus?.id) campusId = campus.id;
  else {
    const created = await must(
      "legacy campus",
      supabase
        .from("campuses")
        .insert({
          name: "School Tracking Security Campus",
          location: "Security Test",
          latitude: 51.03889,
          longitude: 3.69167,
        })
        .select("*")
        .single()
    );
    campusId = created.id;
  }

  const ownCourse = await must(
    "legacy teacher A course",
    supabase
      .from("courses")
      .insert({
        course_name: "Security Patch Own Course",
        classroom: "SEC-1",
        date: todayIsoDate(),
        start_time: clockTime(-10),
        end_time: clockTime(50),
        lesson_type: "live@campus",
        campus_id: campusId,
        teacher_names: [`${USERS.teacherA.firstName} ${USERS.teacherA.lastName}`],
      })
      .select("*")
      .single()
  );
  const otherTeacherCourse = await must(
    "legacy teacher B course",
    supabase
      .from("courses")
      .insert({
        course_name: "Security Patch Other Teacher Course",
        classroom: "SEC-2",
        date: todayIsoDate(),
        start_time: clockTime(120),
        end_time: clockTime(180),
        lesson_type: "live@campus",
        campus_id: campusId,
        teacher_names: [`${USERS.teacherB.firstName} ${USERS.teacherB.lastName}`],
      })
      .select("*")
      .single()
  );

  return {
    supported: true,
    campusId,
    courses: { own: ownCourse.id, other: otherTeacherCourse.id },
  };
}

async function main() {
  const env = readEnv();
  const supabase = adminClient(env);

  const usersByKey = {};
  for (const [key, spec] of Object.entries(USERS)) {
    usersByKey[key] = await getOrCreateAuthUser(supabase, env, spec);
  }

  const saas = await seedSaas(supabase, usersByKey);
  const legacyPrototype = await seedLegacyPrototype(supabase, usersByKey);

  saveFixtures({
    created_at: new Date().toISOString(),
    users: Object.fromEntries(
      Object.entries(usersByKey).map(([key, user]) => [key, { id: user.id, email: user.email }])
    ),
    saas,
    legacyPrototype,
  });

  console.log("Security fixtures are ready.");
  console.log(`SaaS schema: ${saas.supported ? "seeded" : "not detected"}`);
  console.log(`Legacy prototype schema: ${legacyPrototype.supported ? "seeded" : "not detected"}`);
  console.log("Fixture IDs were written to tests/security/.security-fixtures.json.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
