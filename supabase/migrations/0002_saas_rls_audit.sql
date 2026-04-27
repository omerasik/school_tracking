-- RLS hardening + audit helpers for ScanIt SaaS schema (0001_init_saas.sql).

-- =============================================================================
-- Updated_at trigger helper
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_attendance_records_updated_at on public.attendance_records;
create trigger trg_attendance_records_updated_at
before update on public.attendance_records
for each row execute procedure public.set_updated_at();

-- =============================================================================
-- Audit helper (callable from triggers/RPC)
-- =============================================================================
create or replace function public.audit_log(
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
  v_profile public.profiles;
begin
  v_actor := auth.uid();
  select * into v_profile from public.profiles where id = v_actor;

  insert into public.audit_logs(
    tenant_id,
    school_id,
    actor_user_id,
    action,
    resource_type,
    resource_id,
    reason,
    metadata
  ) values (
    v_profile.tenant_id,
    v_profile.school_id,
    v_actor,
    p_action,
    p_resource_type,
    p_resource_id,
    p_reason,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

-- =============================================================================
-- Finalize lock: prevent silent mutation after finalized
-- =============================================================================
create or replace function public.prevent_updates_after_finalize()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Allow platform/service operations (Edge Functions using service role).
  if current_role in ('service_role', 'postgres') then
    return new;
  end if;

  if old.status = 'finalized' and (
    new.starts_at is distinct from old.starts_at
    or new.ends_at is distinct from old.ends_at
    or new.teacher_id is distinct from old.teacher_id
    or new.course_id is distinct from old.course_id
    or new.policy_snapshot is distinct from old.policy_snapshot
    or new.status is distinct from old.status
  ) then
    raise exception 'Finalized sessions are immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_attendance_sessions_finalize_lock on public.attendance_sessions;
create trigger trg_attendance_sessions_finalize_lock
before update on public.attendance_sessions
for each row execute procedure public.prevent_updates_after_finalize();

-- =============================================================================
-- RLS policies: write access
-- =============================================================================

-- Helper: staff role check (inline for readability)
-- Teachers/admins/managers can insert/update sessions within tenant.
create policy "attendance_sessions_teacher_insert"
  on public.attendance_sessions for insert
  to authenticated
  with check (
    tenant_id = public.current_tenant_id()
    and teacher_id = auth.uid()
    and public.has_role('teacher')
  );

create policy "attendance_sessions_teacher_update_own"
  on public.attendance_sessions for update
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and teacher_id = auth.uid()
    and public.has_role('teacher')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and teacher_id = auth.uid()
    and public.has_role('teacher')
  );

create policy "attendance_sessions_admin_update_tenant"
  on public.attendance_sessions for update
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (public.has_role('admin') or public.has_role('school_manager') or public.has_role('super_admin'))
  )
  with check (
    tenant_id = public.current_tenant_id()
    and (public.has_role('admin') or public.has_role('school_manager') or public.has_role('super_admin'))
  );

-- QR tokens: only teachers can create for their active sessions
create policy "qr_tokens_teacher_insert"
  on public.qr_tokens for insert
  to authenticated
  with check (
    tenant_id = public.current_tenant_id()
    and public.has_role('teacher')
  );

create policy "qr_tokens_staff_read_tenant"
  on public.qr_tokens for select
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (public.has_role('teacher') or public.has_role('admin') or public.has_role('school_manager') or public.has_role('super_admin'))
  );

-- Attendance records: students can upsert their own record for a session in their tenant
create policy "attendance_records_student_upsert_own"
  on public.attendance_records for insert
  to authenticated
  with check (
    tenant_id = public.current_tenant_id()
    and student_id = auth.uid()
  );

create policy "attendance_records_student_update_own"
  on public.attendance_records for update
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and student_id = auth.uid()
  )
  with check (
    tenant_id = public.current_tenant_id()
    and student_id = auth.uid()
  );

-- Corrections: student requests; staff decides
create policy "attendance_corrections_student_insert"
  on public.attendance_corrections for insert
  to authenticated
  with check (
    tenant_id = public.current_tenant_id()
    and requested_by = auth.uid()
  );

create policy "attendance_corrections_student_read_own"
  on public.attendance_corrections for select
  to authenticated
  using (requested_by = auth.uid());

create policy "attendance_corrections_staff_read_tenant"
  on public.attendance_corrections for select
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (public.has_role('teacher') or public.has_role('admin') or public.has_role('school_manager') or public.has_role('super_admin'))
  );

create policy "attendance_corrections_staff_update_tenant"
  on public.attendance_corrections for update
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (public.has_role('teacher') or public.has_role('admin') or public.has_role('school_manager') or public.has_role('super_admin'))
  )
  with check (
    tenant_id = public.current_tenant_id()
    and (public.has_role('teacher') or public.has_role('admin') or public.has_role('school_manager') or public.has_role('super_admin'))
  );

