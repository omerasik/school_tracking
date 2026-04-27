-- ScanIt SaaS (tenant-first) initial schema.
-- This does NOT replace the prototype schema automatically; it is a new baseline
-- for production-grade multi-tenant attendance.
--
-- Apply using Supabase CLI:
--   supabase db reset
-- or:
--   supabase db push

create extension if not exists "pgcrypto";

-- =============================================================================
-- Core: tenants / schools / campuses / rooms
-- =============================================================================
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists idx_schools_tenant_id on public.schools(tenant_id);

create table if not exists public.campuses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  geofence_radius_m integer not null default 250,
  created_at timestamptz not null default now()
);
create index if not exists idx_campuses_school_id on public.campuses(school_id);

create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  campus_id uuid references public.campuses(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  campus_id uuid references public.campuses(id) on delete set null,
  building_id uuid references public.buildings(id) on delete set null,
  name text not null,
  capacity integer,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Users / profiles / roles
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  first_name text not null default '',
  last_name text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_profiles_tenant_id on public.profiles(tenant_id);

create table if not exists public.roles (
  key text primary key,
  description text,
  is_system boolean not null default true
);

insert into public.roles(key, description, is_system) values
  ('student', 'Student role', true),
  ('teacher', 'Teacher/Docent role', true),
  ('admin', 'School admin role', true),
  ('school_manager', 'Department/School manager role', true),
  ('super_admin', 'SaaS owner role', true)
on conflict (key) do nothing;

create table if not exists public.permissions (
  key text primary key,
  description text,
  is_system boolean not null default true
);

create table if not exists public.role_permissions (
  role_key text not null references public.roles(key) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role_key, permission_key)
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_key text not null references public.roles(key) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, role_key)
);
create index if not exists idx_user_roles_role_key on public.user_roles(role_key);

-- =============================================================================
-- Academic model
-- =============================================================================
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  code text,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.class_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_group_id uuid references public.class_groups(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (course_id, student_id)
);

create table if not exists public.timetable_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  campus_id uuid references public.campuses(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_timetable_entries_starts_at on public.timetable_entries(starts_at);

-- =============================================================================
-- Attendance sessions / records
-- =============================================================================
do $$ begin
  create type public.attendance_status as enum (
    'present',
    'late',
    'absent',
    'excused',
    'left_early',
    'pending_review',
    'manually_adjusted',
    'invalid_attempt',
    'duplicate_attempt',
    'outside_location'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.session_status as enum ('draft', 'active', 'grace', 'closed', 'finalized');
exception when duplicate_object then null;
end $$;

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  timetable_entry_id uuid references public.timetable_entries(id) on delete set null,
  course_id uuid not null references public.courses(id) on delete restrict,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  room_id uuid references public.rooms(id) on delete set null,
  campus_id uuid references public.campuses(id) on delete set null,
  status public.session_status not null default 'draft',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  grace_present_until timestamptz,
  grace_late_until timestamptz,
  finalized_at timestamptz,
  finalized_by uuid references public.profiles(id) on delete set null,
  policy_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_attendance_sessions_teacher_id on public.attendance_sessions(teacher_id);
create index if not exists idx_attendance_sessions_status on public.attendance_sessions(status);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.attendance_status not null default 'pending_review',
  source text not null default 'checkin',
  checked_in_at timestamptz,
  location_lat double precision,
  location_lon double precision,
  location_accuracy_m double precision,
  location_result jsonb not null default '{}'::jsonb,
  device_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id)
);
create index if not exists idx_attendance_records_session_id on public.attendance_records(session_id);
create index if not exists idx_attendance_records_student_id on public.attendance_records(student_id);

-- =============================================================================
-- QR tokens (short-lived, single-use)
-- =============================================================================
create table if not exists public.qr_tokens (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  jti text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by_user uuid references public.profiles(id) on delete set null,
  used_by_device_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_qr_tokens_session_id on public.qr_tokens(session_id);
create index if not exists idx_qr_tokens_expires_at on public.qr_tokens(expires_at);

-- =============================================================================
-- Corrections / notifications / audit / device sessions
-- =============================================================================
do $$ begin
  create type public.correction_status as enum ('requested', 'approved', 'rejected', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  record_id uuid not null references public.attendance_records(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  requested_at timestamptz not null default now(),
  requested_status public.attendance_status not null,
  reason text not null,
  status public.correction_status not null default 'requested',
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  decision_note text
);
create index if not exists idx_attendance_corrections_record_id on public.attendance_corrections(record_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  school_id uuid,
  actor_user_id uuid,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_user_id);

create table if not exists public.device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, device_id)
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  school_id uuid references public.schools(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, school_id, key)
);

-- =============================================================================
-- Helpers for RLS
-- =============================================================================
create or replace function public.current_profile()
returns public.profiles
language sql
stable
as $$
  select * from public.profiles where id = auth.uid()
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

create or replace function public.has_role(role_key text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role_key = has_role.role_key
  )
$$;

-- =============================================================================
-- RLS (baseline; refine per product needs)
-- =============================================================================
alter table public.tenants enable row level security;
alter table public.schools enable row level security;
alter table public.campuses enable row level security;
alter table public.buildings enable row level security;
alter table public.rooms enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.courses enable row level security;
alter table public.class_groups enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.timetable_entries enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.qr_tokens enable row level security;
alter table public.attendance_corrections enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.device_sessions enable row level security;
alter table public.app_settings enable row level security;

-- Profiles: users read own; staff can read within tenant
create policy "profiles_read_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_staff_read_tenant"
  on public.profiles for select
  to authenticated
  using (
    public.current_tenant_id() is not null
    and tenant_id = public.current_tenant_id()
    and (public.has_role('teacher') or public.has_role('admin') or public.has_role('school_manager') or public.has_role('super_admin'))
  );

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Core entities: tenant-scoped read for staff/admin, minimal for students (through joins in RPC)
create policy "courses_read_tenant"
  on public.courses for select
  to authenticated
  using (tenant_id = public.current_tenant_id());

create policy "timetable_read_tenant"
  on public.timetable_entries for select
  to authenticated
  using (tenant_id = public.current_tenant_id());

-- Attendance: student reads own; teacher/admin reads within tenant
create policy "attendance_records_student_read_own"
  on public.attendance_records for select
  to authenticated
  using (student_id = auth.uid());

create policy "attendance_records_staff_read_tenant"
  on public.attendance_records for select
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and (public.has_role('teacher') or public.has_role('admin') or public.has_role('school_manager') or public.has_role('super_admin'))
  );

create policy "notifications_read_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

