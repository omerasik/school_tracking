-- Security hardening patch set:
-- 1) has_role() reliability under RLS
-- 2) user_roles RLS policies
-- 3) finalized session mutation lock for attendance_records

-- =============================================================================
-- 1) has_role() under RLS
-- =============================================================================
create or replace function public.has_role(role_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role_key = has_role.role_key
  )
$$;

grant execute on function public.has_role(text) to authenticated;

-- =============================================================================
-- 2) user_roles RLS policies
-- =============================================================================
alter table public.user_roles enable row level security;

drop policy if exists "user_roles_read_own" on public.user_roles;
create policy "user_roles_read_own"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

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
      or exists (
        select 1
        from public.profiles target
        where target.id = user_roles.user_id
          and target.tenant_id = public.current_tenant_id()
      )
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
      or exists (
        select 1
        from public.profiles target
        where target.id = user_roles.user_id
          and target.tenant_id = public.current_tenant_id()
      )
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
      or exists (
        select 1
        from public.profiles target
        where target.id = user_roles.user_id
          and target.tenant_id = public.current_tenant_id()
      )
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
      or exists (
        select 1
        from public.profiles target
        where target.id = user_roles.user_id
          and target.tenant_id = public.current_tenant_id()
      )
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
      or exists (
        select 1
        from public.profiles target
        where target.id = user_roles.user_id
          and target.tenant_id = public.current_tenant_id()
      )
    )
  );

-- =============================================================================
-- 3) Finalized session lock on attendance_records
-- =============================================================================
create or replace function public.block_finalized_attendance_record_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_is_finalized boolean;
begin
  v_session_id := case
    when tg_op = 'DELETE' then old.session_id
    else new.session_id
  end;

  select (s.status = 'finalized')
    into v_is_finalized
  from public.attendance_sessions s
  where s.id = v_session_id;

  if coalesce(v_is_finalized, false) then
    begin
      insert into public.audit_logs(
        tenant_id,
        school_id,
        actor_user_id,
        action,
        resource_type,
        resource_id,
        reason,
        metadata
      )
      values (
        null,
        null,
        auth.uid(),
        'finalized_record_mutation_attempt',
        'attendance_record',
        case when tg_op = 'DELETE' then old.id else new.id end,
        'finalized_session_lock',
        jsonb_build_object(
          'operation', tg_op,
          'session_id', v_session_id
        )
      );
    exception when others then
      null;
    end;

    raise exception 'Finalized attendance records are immutable';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_attendance_records_finalized_lock_insert on public.attendance_records;
create trigger trg_attendance_records_finalized_lock_insert
before insert on public.attendance_records
for each row execute procedure public.block_finalized_attendance_record_mutation();

drop trigger if exists trg_attendance_records_finalized_lock_update on public.attendance_records;
create trigger trg_attendance_records_finalized_lock_update
before update on public.attendance_records
for each row execute procedure public.block_finalized_attendance_record_mutation();

drop trigger if exists trg_attendance_records_finalized_lock_delete on public.attendance_records;
create trigger trg_attendance_records_finalized_lock_delete
before delete on public.attendance_records
for each row execute procedure public.block_finalized_attendance_record_mutation();

-- Direct student update policy is too broad for integrity-sensitive records.
drop policy if exists "attendance_records_student_update_own" on public.attendance_records;

