-- Security patch:
-- 1) RLS-safe helper updates used by policies and Edge Functions
-- 2) tenant-scoped user_roles policy update
-- 3) atomic QR token consume + attendance write RPC
-- 4) attendance session read policies required by the mobile app

-- =============================================================================
-- 1) RLS-safe helpers
-- =============================================================================
create or replace function public.has_role(role_key text)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role_key = has_role.role_key
  )
$$;

grant execute on function public.has_role(text) to authenticated;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

grant execute on function public.current_tenant_id() to authenticated;

create or replace function public.user_is_in_current_tenant(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.profiles target
    where target.id = user_is_in_current_tenant.target_user_id
      and target.tenant_id = public.current_tenant_id()
  )
$$;

grant execute on function public.user_is_in_current_tenant(uuid) to authenticated;

-- =============================================================================
-- 2) user_roles tenant checks without policy-recursive profile lookups
-- =============================================================================
drop policy if exists "user_roles_admin_read_tenant" on public.user_roles;
create policy "user_roles_admin_read_tenant"
  on public.user_roles for select
  to authenticated
  using (
    (
      public.has_role('admin')
      or public.has_role('school_manager')
      or public.has_role('super_admin')
    )
    and (
      public.has_role('super_admin')
      or public.user_is_in_current_tenant(user_roles.user_id)
    )
  );

drop policy if exists "user_roles_admin_insert_tenant" on public.user_roles;
create policy "user_roles_admin_insert_tenant"
  on public.user_roles for insert
  to authenticated
  with check (
    (
      public.has_role('admin')
      or public.has_role('school_manager')
      or public.has_role('super_admin')
    )
    and (
      public.has_role('super_admin')
      or public.user_is_in_current_tenant(user_roles.user_id)
    )
  );

drop policy if exists "user_roles_admin_update_tenant" on public.user_roles;
create policy "user_roles_admin_update_tenant"
  on public.user_roles for update
  to authenticated
  using (
    (
      public.has_role('admin')
      or public.has_role('school_manager')
      or public.has_role('super_admin')
    )
    and (
      public.has_role('super_admin')
      or public.user_is_in_current_tenant(user_roles.user_id)
    )
  )
  with check (
    (
      public.has_role('admin')
      or public.has_role('school_manager')
      or public.has_role('super_admin')
    )
    and (
      public.has_role('super_admin')
      or public.user_is_in_current_tenant(user_roles.user_id)
    )
  );

drop policy if exists "user_roles_admin_delete_tenant" on public.user_roles;
create policy "user_roles_admin_delete_tenant"
  on public.user_roles for delete
  to authenticated
  using (
    (
      public.has_role('admin')
      or public.has_role('school_manager')
      or public.has_role('super_admin')
    )
    and (
      public.has_role('super_admin')
      or public.user_is_in_current_tenant(user_roles.user_id)
    )
  );

-- =============================================================================
-- 3) Atomic QR token consume + attendance write
-- =============================================================================
create or replace function public.consume_qr_token_for_checkin(
  p_token_id uuid,
  p_student_id uuid,
  p_device_id text,
  p_status public.attendance_status,
  p_location_lat double precision,
  p_location_lon double precision,
  p_location_accuracy_m double precision,
  p_location_result jsonb
)
returns public.attendance_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token public.qr_tokens;
  v_session public.attendance_sessions;
  v_record public.attendance_records;
begin
  update public.qr_tokens
    set used_at = now(),
        used_by_user = p_student_id,
        used_by_device_id = p_device_id
    where id = p_token_id
      and used_at is null
      and expires_at > now()
    returning * into v_token;

  if not found then
    raise exception 'token_not_usable';
  end if;

  select *
    into v_session
    from public.attendance_sessions
    where id = v_token.session_id
      and status in ('active', 'grace')
      and ends_at > now();

  if not found then
    raise exception 'session_not_active';
  end if;

  insert into public.attendance_records(
    tenant_id,
    school_id,
    session_id,
    student_id,
    status,
    source,
    checked_in_at,
    location_lat,
    location_lon,
    location_accuracy_m,
    location_result,
    device_id,
    updated_at
  )
  values (
    v_session.tenant_id,
    v_session.school_id,
    v_session.id,
    p_student_id,
    p_status,
    'student_scan',
    now(),
    p_location_lat,
    p_location_lon,
    p_location_accuracy_m,
    coalesce(p_location_result, '{}'::jsonb),
    p_device_id,
    now()
  )
  on conflict (session_id, student_id)
  do update set
    status = excluded.status,
    source = excluded.source,
    checked_in_at = excluded.checked_in_at,
    location_lat = excluded.location_lat,
    location_lon = excluded.location_lon,
    location_accuracy_m = excluded.location_accuracy_m,
    location_result = excluded.location_result,
    device_id = excluded.device_id,
    updated_at = now()
  returning * into v_record;

  return v_record;
end;
$$;

revoke all on function public.consume_qr_token_for_checkin(
  uuid,
  uuid,
  text,
  public.attendance_status,
  double precision,
  double precision,
  double precision,
  jsonb
) from public, anon, authenticated;

grant execute on function public.consume_qr_token_for_checkin(
  uuid,
  uuid,
  text,
  public.attendance_status,
  double precision,
  double precision,
  double precision,
  jsonb
) to service_role;

-- =============================================================================
-- 4) Attendance session read access for the mobile app
-- =============================================================================
drop policy if exists "attendance_sessions_student_read_enrolled" on public.attendance_sessions;
create policy "attendance_sessions_student_read_enrolled"
  on public.attendance_sessions for select
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1
      from public.course_enrollments enrollment
      where enrollment.course_id = attendance_sessions.course_id
        and enrollment.student_id = auth.uid()
    )
  );

drop policy if exists "attendance_sessions_teacher_read_own" on public.attendance_sessions;
create policy "attendance_sessions_teacher_read_own"
  on public.attendance_sessions for select
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and teacher_id = auth.uid()
    and public.has_role('teacher')
  );

drop policy if exists "attendance_sessions_staff_read_tenant" on public.attendance_sessions;
create policy "attendance_sessions_staff_read_tenant"
  on public.attendance_sessions for select
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (
      public.has_role('admin')
      or public.has_role('school_manager')
      or public.has_role('super_admin')
    )
  );
