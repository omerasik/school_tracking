import {
  adminClient,
  expectResult,
  fetchJson,
  loadFixtures,
  readEnv,
  signIn,
} from "./security-test-utils.mjs";

async function main() {
  const env = readEnv();
  const fixtures = loadFixtures();
  if (!fixtures.saas.supported) {
    console.log("SKIP race test: SaaS migration schema was not detected.");
    return;
  }

  const teacher = await signIn(env, fixtures.users.teacherA.email);
  const student = await signIn(env, fixtures.users.studentA.email);

  const qr = await fetchJson(`${env.functionsUrl}/session-qr`, {
    jwt: teacher.jwt,
    body: { session_id: fixtures.saas.sessions.active, ttl_seconds: 60 },
  });
  expectResult(qr, 200, null, "teacher can generate race token");

  const requestCount = Number(process.env.SCHOOL_TRACKING_RACE_REQUESTS ?? 5);
  const requests = Array.from({ length: requestCount }, (_, index) =>
    fetchJson(`${env.functionsUrl}/attendance-checkin`, {
      jwt: student.jwt,
      body: {
        token: qr.body.token,
        device_id: `security-race-${index}`,
        location: { lat: 51.03889, lon: 3.69167, accuracy_m: 8 },
      },
    })
  );

  const results = await Promise.all(requests);
  const successCount = results.filter((r) => r.status === 200 && !r.body?.error).length;
  const reusedCount = results.filter((r) => r.status === 409 && r.body?.error === "token_already_used").length;

  if (successCount !== 1 || reusedCount !== results.length - 1) {
    throw new Error(
      `expected exactly 1 success and ${results.length - 1} token_already_used responses, got ${successCount}/${reusedCount}`
    );
  }

  const supabase = adminClient(env);
  const { count, error } = await supabase
    .from("qr_tokens")
    .select("*", { count: "exact", head: true })
    .eq("session_id", fixtures.saas.sessions.active)
    .not("used_at", "is", null);
  if (error) throw new Error(`token post-check failed: ${error.message}`);

  console.log(`PASS race test: ${successCount} success, ${reusedCount} token_already_used, used token rows observed: ${count}.`);
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
