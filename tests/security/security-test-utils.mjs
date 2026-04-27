import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const TEST_PREFIX = "school-tracking-security";
export const FIXTURE_PATH = path.resolve("tests/security/.security-fixtures.json");

export function readEnv() {
  const url = process.env.SUPABASE_TEST_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_TEST_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  const serviceKey =
    process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY;
  const functionsUrl =
    process.env.SUPABASE_FUNCTIONS_URL ?? (url ? `${url.replace(/\/$/, "")}/functions/v1` : undefined);
  const password =
    process.env.SCHOOL_TRACKING_SECURITY_TEST_PASSWORD ??
    "School-Tracking-Security-Test-2026!";

  const missing = [];
  if (!url) missing.push("SUPABASE_TEST_URL");
  if (!anonKey) missing.push("SUPABASE_TEST_ANON_KEY");
  if (!serviceKey) missing.push("SUPABASE_TEST_SERVICE_ROLE_KEY");
  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }

  assertNotProduction(url);
  return { url, anonKey, serviceKey, functionsUrl, password };
}

export function assertNotProduction(url) {
  const parsed = new URL(url);
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  const remoteTestsAllowed = process.env.SCHOOL_TRACKING_ALLOW_REMOTE_TESTS === "yes";
  if (!isLocal && !remoteTestsAllowed) {
    throw new Error(
      "Refusing to touch a remote Supabase project. Set SCHOOL_TRACKING_ALLOW_REMOTE_TESTS=yes only for staging."
    );
  }
}

export function adminClient(env = readEnv()) {
  return createClient(env.url, env.serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function anonClient(env = readEnv()) {
  return createClient(env.url, env.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function signIn(env, email) {
  const client = anonClient(env);
  const { data, error } = await client.auth.signInWithPassword({ email, password: env.password });
  if (error || !data.session?.access_token) {
    throw new Error(`Could not sign in ${email}: ${error?.message ?? "missing session"}`);
  }
  return { client, jwt: data.session.access_token, user: data.user };
}

export function loadFixtures() {
  if (!fs.existsSync(FIXTURE_PATH)) {
    throw new Error("Fixture file missing. Run: node tests/security/seed-security-fixtures.mjs");
  }
  return JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));
}

export function saveFixtures(fixtures) {
  fs.writeFileSync(FIXTURE_PATH, `${JSON.stringify(fixtures, null, 2)}\n`);
}

export function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function randomToken(label = "token") {
  return `${TEST_PREFIX}-${label}-${crypto.randomBytes(24).toString("base64url")}`;
}

export function nowIso(offsetMs = 0) {
  return new Date(Date.now() + offsetMs).toISOString();
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function clockTime(offsetMinutes = 0) {
  const d = new Date(Date.now() + offsetMinutes * 60_000);
  return d.toTimeString().slice(0, 8);
}

export async function must(label, promise) {
  const { data, error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

export async function maybeHasColumn(supabase, table, column) {
  const { error } = await supabase.from(table).select(column).limit(1);
  return !error;
}

export async function maybeHasTable(supabase, table) {
  const { error } = await supabase.from(table).select("*").limit(1);
  return !error;
}

export async function maybeSingleBy(client, table, select, filters) {
  let query = client.from(table).select(select);
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`${table} lookup failed: ${error.message}`);
  return data;
}

export async function fetchJson(url, { jwt, body }) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${jwt}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  return { status: res.status, body: payload };
}

export function expectResult(actual, expectedStatus, expectedError, label) {
  const okStatus = actual.status === expectedStatus;
  const okError = expectedError ? actual.body?.error === expectedError : !actual.body?.error;
  if (!okStatus || !okError) {
    throw new Error(
      `${label}: expected ${expectedStatus}/${expectedError ?? "success"}, got ${actual.status}/${actual.body?.error ?? "success"}`
    );
  }
}
