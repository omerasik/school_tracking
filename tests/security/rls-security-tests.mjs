import { adminClient, anonClient, loadFixtures, readEnv, signIn } from "./security-test-utils.mjs";

async function assertHasRole(client, role, expected, label) {
  const { data, error } = await client.rpc("has_role", { role_key: role });
  if (error) throw new Error(`${label}: has_role(${role}) failed: ${error.message}`);
  if (data !== expected) throw new Error(`${label}: has_role(${role}) expected ${expected}, got ${data}`);
}

async function expectNoRows(label, promise) {
  const { data, error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
  if (data?.length) throw new Error(`${label}: expected zero visible rows, got ${data.length}`);
}

async function expectRlsDenied(label, promise) {
  const { error } = await promise;
  if (!error) throw new Error(`${label}: expected RLS denial, operation succeeded`);
}

async function main() {
  const env = readEnv();
  const fixtures = loadFixtures();
  if (!fixtures.saas.supported) {
    console.log("SKIP RLS tests: SaaS migration schema was not detected.");
    return;
  }

  const student = await signIn(env, fixtures.users.studentA.email);
  const teacher = await signIn(env, fixtures.users.teacherA.email);
  const adminA = await signIn(env, fixtures.users.adminA.email);
  const superAdmin = await signIn(env, fixtures.users.superAdmin.email);

  await assertHasRole(student.client, "student", true, "student role");
  await assertHasRole(student.client, "teacher", false, "student role");
  await assertHasRole(teacher.client, "teacher", true, "teacher role");
  await assertHasRole(adminA.client, "admin", true, "admin role");

  await expectNoRows(
    "student cannot read cross-tenant user_roles",
    student.client.from("user_roles").select("*").eq("user_id", fixtures.users.teacherB.id)
  );
  await expectNoRows(
    "student cannot read cross-tenant attendance_records",
    student.client.from("attendance_records").select("*").eq("id", fixtures.saas.records.otherTenant)
  );

  const ownRole = { user_id: fixtures.users.studentA.id, role_key: "school_manager" };
  const { error: ownInsertError } = await adminA.client.from("user_roles").upsert(ownRole, { onConflict: "user_id,role_key" });
  if (ownInsertError) throw new Error(`admin own-tenant role insert failed: ${ownInsertError.message}`);
  await adminA.client.from("user_roles").delete().match(ownRole);

  await expectRlsDenied(
    "cross-tenant admin role insert denied",
    adminA.client.from("user_roles").insert({ user_id: fixtures.users.teacherB.id, role_key: "school_manager" })
  );

  const globalRole = { user_id: fixtures.users.teacherB.id, role_key: "school_manager" };
  const { error: globalInsertError } = await superAdmin.client.from("user_roles").upsert(globalRole, { onConflict: "user_id,role_key" });
  if (globalInsertError) throw new Error(`super_admin global role insert failed: ${globalInsertError.message}`);
  await superAdmin.client.from("user_roles").delete().match(globalRole);

  const service = adminClient(env);
  const { error: updateError } = await service
    .from("attendance_records")
    .update({ status: "late" })
    .eq("id", fixtures.saas.records.finalized);
  if (!updateError) throw new Error("finalized attendance record update should be denied");

  const { error: deleteError } = await service.from("attendance_records").delete().eq("id", fixtures.saas.records.finalized);
  if (!deleteError) throw new Error("finalized attendance record delete should be denied");

  const { count, error: auditError } = await service
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("action", "finalized_record_mutation_attempt")
    .eq("resource_type", "attendance_record")
    .eq("resource_id", fixtures.saas.records.finalized);
  if (auditError) throw new Error(`finalized audit lookup failed: ${auditError.message}`);
  if (!count || count < 2) throw new Error(`expected finalized mutation audit logs, got ${count ?? 0}`);

  await anonClient(env).auth.signOut();
  console.log("PASS RLS, role management, finalized mutation lock, and audit checks.");
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
