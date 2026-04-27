-- Optional SQL probes for local/staging Supabase.
-- Replace the placeholders with IDs from tests/security/.security-fixtures.json.
-- Run inside a transaction and roll back; these blocks do not need to persist data.

begin;

-- Student role behavior and cross-tenant reads.
set local role authenticated;
select set_config('request.jwt.claim.sub', '<STUDENT_A_UUID>', true);

select
  public.has_role('student') as student_is_student,
  public.has_role('teacher') as student_is_teacher,
  public.has_role('admin') as student_is_admin;

select count(*) as visible_cross_tenant_user_roles
from public.user_roles
where user_id = '<TEACHER_B_UUID>'::uuid;

select count(*) as visible_cross_tenant_attendance_records
from public.attendance_records
where id = '<OTHER_TENANT_ATTENDANCE_RECORD_UUID>'::uuid;

rollback;

begin;

-- Admin may manage roles inside their own tenant.
set local role authenticated;
select set_config('request.jwt.claim.sub', '<ADMIN_A_UUID>', true);

insert into public.user_roles(user_id, role_key)
values ('<STUDENT_A_UUID>'::uuid, 'school_manager')
on conflict do nothing;

delete from public.user_roles
where user_id = '<STUDENT_A_UUID>'::uuid
  and role_key = 'school_manager';

rollback;

begin;

-- Cross-tenant admin role management should fail with an RLS error.
set local role authenticated;
select set_config('request.jwt.claim.sub', '<ADMIN_A_UUID>', true);

insert into public.user_roles(user_id, role_key)
values ('<TEACHER_B_UUID>'::uuid, 'school_manager');

rollback;

begin;

-- super_admin global role management should be allowed.
set local role authenticated;
select set_config('request.jwt.claim.sub', '<SUPER_ADMIN_UUID>', true);

insert into public.user_roles(user_id, role_key)
values ('<TEACHER_B_UUID>'::uuid, 'school_manager')
on conflict do nothing;

delete from public.user_roles
where user_id = '<TEACHER_B_UUID>'::uuid
  and role_key = 'school_manager';

rollback;

begin;

-- Finalized attendance_records mutation lock should raise:
-- "Finalized attendance records are immutable".
set local role service_role;

update public.attendance_records
set status = 'late'
where id = '<FINALIZED_ATTENDANCE_RECORD_UUID>'::uuid;

delete from public.attendance_records
where id = '<FINALIZED_ATTENDANCE_RECORD_UUID>'::uuid;

rollback;
