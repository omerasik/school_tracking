-- Optional SaaS data-only seed template.
-- Prefer seed-security-fixtures.mjs because it safely creates/updates Auth users.
-- Use this SQL only after replacing UUID placeholders with staging/local Auth user IDs.

do $$
declare
  v_student_a uuid := '<STUDENT_A_UUID>'::uuid;
  v_teacher_a uuid := '<TEACHER_A_UUID>'::uuid;
  v_teacher_b uuid := '<TEACHER_B_UUID>'::uuid;
  v_admin_a uuid := '<ADMIN_A_UUID>'::uuid;
  v_admin_b uuid := '<ADMIN_B_UUID>'::uuid;
  v_super_admin uuid := '<SUPER_ADMIN_UUID>'::uuid;

  v_tenant_a uuid;
  v_tenant_b uuid;
  v_school_a uuid;
  v_school_b uuid;
  v_campus_a uuid;
  v_campus_b uuid;
  v_course_a uuid;
  v_course_b uuid;
  v_active_session uuid;
  v_finalized_session uuid;
  v_other_tenant_session uuid;
  v_finalized_record uuid;
  v_other_tenant_record uuid;
begin
  delete from public.tenants
  where slug in ('school-tracking-security-a', 'school-tracking-security-b');

  insert into public.tenants(name, slug, status)
  values ('School Tracking Security Tenant A', 'school-tracking-security-a', 'active')
  returning id into v_tenant_a;

  insert into public.tenants(name, slug, status)
  values ('School Tracking Security Tenant B', 'school-tracking-security-b', 'active')
  returning id into v_tenant_b;

  insert into public.schools(tenant_id, name, status)
  values (v_tenant_a, 'School Tracking Security School A', 'active')
  returning id into v_school_a;

  insert into public.schools(tenant_id, name, status)
  values (v_tenant_b, 'School Tracking Security School B', 'active')
  returning id into v_school_b;

  insert into public.campuses(tenant_id, school_id, name, latitude, longitude, geofence_radius_m)
  values (v_tenant_a, v_school_a, 'School Tracking Security Campus A', 51.03889, 3.69167, 500)
  returning id into v_campus_a;

  insert into public.campuses(tenant_id, school_id, name, latitude, longitude, geofence_radius_m)
  values (v_tenant_b, v_school_b, 'School Tracking Security Campus B', 51.05455, 3.71891, 500)
  returning id into v_campus_b;

  insert into public.profiles(id, tenant_id, school_id, first_name, last_name)
  values
    (v_student_a, v_tenant_a, v_school_a, 'Security', 'Student A'),
    (v_teacher_a, v_tenant_a, v_school_a, 'Security', 'Teacher A'),
    (v_admin_a, v_tenant_a, v_school_a, 'Security', 'Admin A'),
    (v_super_admin, v_tenant_a, v_school_a, 'Security', 'Super Admin'),
    (v_teacher_b, v_tenant_b, v_school_b, 'Security', 'Teacher B'),
    (v_admin_b, v_tenant_b, v_school_b, 'Security', 'Admin B')
  on conflict (id) do update set
    tenant_id = excluded.tenant_id,
    school_id = excluded.school_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name;

  delete from public.user_roles
  where user_id in (v_student_a, v_teacher_a, v_teacher_b, v_admin_a, v_admin_b, v_super_admin);

  insert into public.user_roles(user_id, role_key)
  values
    (v_student_a, 'student'),
    (v_teacher_a, 'teacher'),
    (v_teacher_b, 'teacher'),
    (v_admin_a, 'admin'),
    (v_admin_b, 'admin'),
    (v_super_admin, 'super_admin');

  insert into public.courses(tenant_id, school_id, code, name)
  values (v_tenant_a, v_school_a, 'SEC-A', 'Security Patch Course A')
  returning id into v_course_a;

  insert into public.courses(tenant_id, school_id, code, name)
  values (v_tenant_b, v_school_b, 'SEC-B', 'Security Patch Course B')
  returning id into v_course_b;

  insert into public.course_enrollments(tenant_id, school_id, course_id, student_id)
  values (v_tenant_a, v_school_a, v_course_a, v_student_a);

  insert into public.attendance_sessions(
    tenant_id, school_id, course_id, teacher_id, campus_id, status,
    starts_at, ends_at, grace_present_until, grace_late_until, policy_snapshot
  )
  values (
    v_tenant_a, v_school_a, v_course_a, v_teacher_a, v_campus_a, 'active',
    now() - interval '5 minutes', now() + interval '60 minutes',
    now() + interval '15 minutes', now() + interval '45 minutes', '{}'::jsonb
  )
  returning id into v_active_session;

  insert into public.attendance_sessions(
    tenant_id, school_id, course_id, teacher_id, campus_id, status,
    starts_at, ends_at, policy_snapshot
  )
  values (
    v_tenant_a, v_school_a, v_course_a, v_teacher_a, v_campus_a, 'closed',
    now() - interval '90 minutes', now() - interval '30 minutes', '{}'::jsonb
  )
  returning id into v_finalized_session;

  insert into public.attendance_records(
    tenant_id, school_id, session_id, student_id, status, source, checked_in_at
  )
  values (
    v_tenant_a, v_school_a, v_finalized_session, v_student_a,
    'present', 'security_seed', now() - interval '80 minutes'
  )
  returning id into v_finalized_record;

  update public.attendance_sessions
  set status = 'finalized',
      finalized_at = now() - interval '10 minutes',
      finalized_by = v_teacher_a
  where id = v_finalized_session;

  insert into public.attendance_sessions(
    tenant_id, school_id, course_id, teacher_id, campus_id, status,
    starts_at, ends_at, policy_snapshot
  )
  values (
    v_tenant_b, v_school_b, v_course_b, v_teacher_b, v_campus_b, 'active',
    now() - interval '5 minutes', now() + interval '60 minutes', '{}'::jsonb
  )
  returning id into v_other_tenant_session;

  insert into public.attendance_records(
    tenant_id, school_id, session_id, student_id, status, source, checked_in_at
  )
  values (
    v_tenant_b, v_school_b, v_other_tenant_session, v_teacher_b,
    'present', 'security_seed', now()
  )
  returning id into v_other_tenant_record;

  raise notice 'active_session=% finalized_record=% other_tenant_record=%',
    v_active_session, v_finalized_record, v_other_tenant_record;
end $$;
