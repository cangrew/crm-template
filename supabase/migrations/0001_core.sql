-- CRM Template — core schema: roles, profiles, provisioning, RLS helpers,
-- and API-role grants. Enum values are the canonical snake_case identifiers
-- shared with lib/domain/enums.ts.
--
-- Account model (deliberate, keep it):
--   * New users provision WITHOUT a role ("pending"). An admin assigns a role
--     before they get in.
--   * Deactivated profiles (is_active = false) lose all role-based access; the
--     users-console "Disable" action actually revokes access.
--   * RLS policies must gate through public.has_role() /
--     public.current_app_role() / public.is_active_user() — never inline a
--     `select role from public.profiles` subquery, which would silently skip
--     the is_active check.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'manager', 'agent', 'agency_owner');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
-- role is nullable with no default: a null role means "pending" (or, combined
-- with is_active = false, a revoked account). Both resolve to no access.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role public.app_role,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer to read role without RLS recursion)
-- ---------------------------------------------------------------------------
-- Role resolution ignores deactivated profiles. A null result (pending role
-- OR inactive account) makes has_role(...) false, denying RLS-protected data;
-- the app guard reads the same role and routes the user to /pending.
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles
  where id = (select auth.uid()) and is_active;
$$;

create or replace function public.has_role(variadic roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_app_role() = any (roles);
$$;

-- Whether the calling user's profile exists and is active. For self-access
-- policies that are not role-based (e.g. "a user reads their own rows") but
-- must still cut off disabled accounts.
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_active from public.profiles where id = (select auth.uid())),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
-- Auto-provision a profile row on first login with a null (pending) role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email, ''),
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- profiles: a user sees their own row; admins manage all.
create policy profiles_select on public.profiles
for select to authenticated
using (id = (select auth.uid()) or public.has_role('admin'));

create policy profiles_insert on public.profiles
for insert to authenticated
with check (public.has_role('admin'));

create policy profiles_update on public.profiles
for update to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy profiles_delete on public.profiles
for delete to authenticated
using (public.has_role('admin'));

-- ---------------------------------------------------------------------------
-- Grants. Local `supabase db reset` applies these automatically as part of its
-- role setup, but a hosted project provisioned purely via `supabase db push`
-- never receives them, and every authenticated query fails with
-- `42501: permission denied for table ...`. Row-level security still governs
-- which rows each role may access; these grants only open the tables at the
-- privilege level so RLS can then filter.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

-- Ensure objects created by future migrations inherit the same grants.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on routines to anon, authenticated, service_role;
