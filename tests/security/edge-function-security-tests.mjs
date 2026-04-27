import {
  adminClient,
  expectResult,
  fetchJson,
  loadFixtures,
  must,
  nowIso,
  randomToken,
  readEnv,
  sha256Hex,
  signIn,
  todayIsoDate,
  clockTime,
} from "./security-test-utils.mjs";

async function createQrToken(supabase, fixtures, label, offsetMs = 60_000) {
  const raw = randomToken(label);
  const hash = sha256Hex(raw);
  await must(
    `seed qr token ${label}`,
    supabase.from("qr_tokens").insert({
      tenant_id: fixtures.saas.tenants.a,
      school_id: fixtures.saas.schools.a,
      session_id: fixtures.saas.sessions.active,
      jti: hash,
      expires_at: nowIso(offsetMs),
    })
  );
  return raw;
}

async function callSessionQr(env, fixtures, teacherJwt) {
  return fetchJson(`${env.functionsUrl}/session-qr`, {
    jwt: teacherJwt,
    body: { session_id: fixtures.saas.sessions.active, ttl_seconds: 60 },
  });
}

async function callCheckin(env, jwt, token, deviceId = "security-api-test") {
  return fetchJson(`${env.functionsUrl}/attendance-checkin`, {
    jwt,
    body: {
      token,
      device_id: deviceId,
      location: { lat: 51.03889, lon: 3.69167, accuracy_m: 8 },
    },
  });
}

async function runSaasEdgeTests(env, fixtures, supabase, sessions) {
  if (!fixtures.saas.supported) {
    console.log("SKIP SaaS Edge tests: SaaS migration schema was not detected.");
    return;
  }

  const generated = await callSessionQr(env, fixtures, sessions.teacherA.jwt);
  expectResult(generated, 200, null, "teacher can generate session QR");

  const once = await callCheckin(env, sessions.studentA.jwt, generated.body.token, "security-api-once");
  expectResult(once, 200, null, "first token consume succeeds");

  const twice = await callCheckin(env, sessions.studentA.jwt, generated.body.token, "security-api-twice");
  expectResult(twice, 409, "token_already_used", "second token consume is rejected");

  const expired = await createQrToken(supabase, fixtures, "expired", -60_000);
  const expiredResult = await callCheckin(env, sessions.studentA.jwt, expired, "security-api-expired");
  expectResult(expiredResult, 410, "token_expired", "expired token is rejected");

  const invalidResult = await callCheckin(env, sessions.studentA.jwt, randomToken("invalid"), "security-api-invalid");
  expectResult(invalidResult, 404, "token_not_found", "invalid token is rejected");

  const { count: auditCount, error: auditError } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .in("action", ["checkin_success", "reused_token_attempt", "expired_token_attempt", "invalid_token_attempt"])
    .gte("created_at", fixtures.created_at);
  if (auditError) throw new Error(`audit verification failed: ${auditError.message}`);
  if (!auditCount || auditCount < 4) throw new Error(`expected critical audit logs, got ${auditCount ?? 0}`);

  console.log("PASS SaaS Edge token scenarios and audit verification.");
}

async function seedLegacyQr(supabase, fixtures, token) {
  await must(
    "seed legacy qr",
    supabase.from("qr_codes").upsert(
      {
        user_id: fixtures.users.studentA.id,
        hash: token,
        expires_at: nowIso(10_000),
      },
      { onConflict: "hash" }
    )
  );
}

async function callPrototype(env, jwt, qr) {
  return fetchJson(`${env.functionsUrl}/prototype-teacher-scan`, {
    jwt,
    body: {
      qr,
      location: { lat: 51.03889, lon: 3.69167, accuracy_m: 8 },
    },
  });
}

async function setLegacyCourseWindows(supabase, fixtures, mode) {
  const today = todayIsoDate();
  if (mode === "own-active") {
    await must(
      "own course active",
      supabase
        .from("courses")
        .update({ date: today, start_time: clockTime(-10), end_time: clockTime(50) })
        .eq("id", fixtures.legacyPrototype.courses.own)
    );
    await must(
      "other course inactive",
      supabase
        .from("courses")
        .update({ date: today, start_time: clockTime(120), end_time: clockTime(180) })
        .eq("id", fixtures.legacyPrototype.courses.other)
    );
  } else {
    await must(
      "own course inactive",
      supabase
        .from("courses")
        .update({ date: today, start_time: clockTime(120), end_time: clockTime(180) })
        .eq("id", fixtures.legacyPrototype.courses.own)
    );
    await must(
      "other course active",
      supabase
        .from("courses")
        .update({ date: today, start_time: clockTime(-10), end_time: clockTime(50) })
        .eq("id", fixtures.legacyPrototype.courses.other)
    );
  }
}

async function runPrototypeTests(env, fixtures, supabase, sessions) {
  if (!fixtures.legacyPrototype.supported) {
    console.log("SKIP prototype-teacher-scan tests: legacy prototype schema was not detected.");
    return;
  }

  await setLegacyCourseWindows(supabase, fixtures, "own-active");
  const studentQr = `${fixtures.users.studentA.id}_${Date.now()}`;
  await seedLegacyQr(supabase, fixtures, studentQr);

  const studentScan = await callPrototype(env, sessions.studentA.jwt, studentQr);
  expectResult(studentScan, 403, "forbidden", "student cannot call prototype-teacher-scan");

  const teacherQr = `${fixtures.users.studentA.id}_${Date.now()}`;
  await seedLegacyQr(supabase, fixtures, teacherQr);
  const teacherScan = await callPrototype(env, sessions.teacherA.jwt, teacherQr);
  expectResult(teacherScan, 200, null, "teacher can scan own active course");

  await setLegacyCourseWindows(supabase, fixtures, "other-active");
  const otherQr = `${fixtures.users.studentA.id}_${Date.now()}`;
  await seedLegacyQr(supabase, fixtures, otherQr);
  const otherTeacherCourse = await callPrototype(env, sessions.teacherA.jwt, otherQr);
  expectResult(otherTeacherCourse, 403, "forbidden", "teacher cannot scan another teacher's active course");

  const { count: legacyAuditCount } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("action", "checkin_success")
    .eq("resource_type", "attendance")
    .gte("created_at", fixtures.created_at);

  console.log(
    `PASS prototype-teacher-scan scenarios. Legacy numeric audit row count after success: ${legacyAuditCount ?? 0}.`
  );
}

async function main() {
  const env = readEnv();
  const fixtures = loadFixtures();
  const supabase = adminClient(env);
  const sessions = {
    studentA: await signIn(env, fixtures.users.studentA.email),
    teacherA: await signIn(env, fixtures.users.teacherA.email),
  };

  await runPrototypeTests(env, fixtures, supabase, sessions);
  await runSaasEdgeTests(env, fixtures, supabase, sessions);
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
