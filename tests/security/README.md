# School Tracking Security Patch Test Pack

This pack is for local or staging Supabase only. It creates namespaced `school-tracking-security-*` fixtures and refuses remote projects unless `SCHOOL_TRACKING_ALLOW_REMOTE_TESTS=yes` is set.

## Preparation

1. Start or reset a local Supabase database:
   ```powershell
   npx supabase start
   npx supabase db reset
   ```
2. Serve Edge Functions locally:
   ```powershell
   npx supabase functions serve --env-file .env
   ```
   If you deploy to staging instead:
   ```powershell
   npx supabase functions deploy prototype-teacher-scan --project-ref <staging-ref>
   npx supabase functions deploy session-qr --project-ref <staging-ref>
   npx supabase functions deploy attendance-checkin --project-ref <staging-ref>
   ```
3. Export env values from `tests/security/security-env.example`.
4. Seed test fixtures:
   ```powershell
   node tests/security/seed-security-fixtures.mjs
   ```

## Commands

Run API/Edge Function security checks:
```powershell
node tests/security/edge-function-security-tests.mjs
```

Run the parallel QR token consume race check:
```powershell
node tests/security/race-token-test.mjs
```

Run RLS/security policy checks:
```powershell
node tests/security/rls-security-tests.mjs
```

Optional SQL probes are in `tests/security/rls-security-tests.sql`.
An optional SaaS data-only seed template is in `tests/security/seed-security-fixtures.sql`; the Node seeder is preferred because it creates Auth users safely.

## Expected Results

| # | Scenario | Expected |
|---|---|---|
| 1 | Student calls `prototype-teacher-scan` | `403 forbidden` |
| 2 | Teacher scans own active legacy course | `200` |
| 3 | Teacher scans when only another teacher's course is active | `403 forbidden` |
| 4 | Same SaaS QR token twice | first `200`, second `409 token_already_used` |
| 5 | Same SaaS QR token in 2-5 parallel requests | exactly one `200`, the rest `409 token_already_used` |
| 6 | Expired SaaS token | `410 token_expired` |
| 7 | Invalid SaaS token | `404 token_not_found` |
| 8 | Update finalized `attendance_records` | denied with immutable-record error |
| 9 | Delete finalized `attendance_records` | denied with immutable-record error |
| 10 | `has_role()` for student/teacher/admin | correct booleans |
| 11 | Student reads cross-tenant `user_roles` | zero visible rows |
| 12 | Student reads cross-tenant `attendance_records` | zero visible rows |
| 13 | Admin manages own-tenant roles | allowed |
| 14 | Admin manages cross-tenant roles | denied |
| 15 | `super_admin` manages global roles | allowed |
| 16 | Critical audit logs | rows exist for check-in/reuse/expired/invalid/finalized attempts |
| 17 | Legacy numeric/UUID audit mismatch | prototype success must not fail; audit row may be absent if numeric `resource_id` is swallowed |

## Failure Triage

| Failure | Check |
|---|---|
| Prototype role guard fails | `supabase/functions/prototype-teacher-scan/index.ts`, `profiles.role`, `user_roles` lookup |
| Prototype ownership guard fails | `prototype-teacher-scan/index.ts`, active legacy `courses.date/start_time/end_time/teacher_names` |
| Duplicate/race token succeeds more than once | `supabase/functions/attendance-checkin/index.ts`, atomic `qr_tokens.update(...).is("used_at", null)` |
| Expired/invalid token status mismatch | `attendance-checkin/index.ts` token fallback branch |
| `has_role()` wrong under RLS | `supabase/migrations/0003_security_hardening.sql` security definer function |
| Cross-tenant role read/write leak | `0003_security_hardening.sql` `user_roles_*` policies |
| Finalized record mutates | `0003_security_hardening.sql` `block_finalized_attendance_record_mutation()` triggers |
| Audit missing unexpectedly | `audit_logs.resource_id` UUID type, Edge Function `logAudit()` resource ID casting |

## Verdict Gate

Production is close only when all three scripts pass against a fresh local reset and a staging project. A known remaining risk is the legacy `prototype-teacher-scan` audit path: it may silently drop audit rows when numeric legacy attendance IDs are inserted into the SaaS UUID `audit_logs.resource_id` column.
