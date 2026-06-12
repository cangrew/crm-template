-- ============================================================================
-- Findway hierarchy: sub-agencies and agents, plus the book-of-business RLS
-- helpers every downstream table (clients, policies, ledger) gates through.
--
-- Hierarchy model (two levels, deliberate):
--   Findway (the house) → agencies (sub-agencies) → agents
--   An agent with agency_id NULL hangs directly under Findway.
--
-- Tenant access model:
--   * agents.profile_id / agencies.owner_profile_id link login profiles to
--     their hierarchy row. Rows may exist without logins (profile id null).
--   * current_agent_id() / current_agency_id() resolve the caller's hierarchy
--     position; both honor profiles.is_active and the row's own status, so a
--     deactivated or terminated tenant resolves to NULL and loses all access.
--   * can_access_agent(agent_id) is the single book-of-business predicate:
--     staff, the agent themself, or the owner of the agent's agency.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums (values mirror AGENCY_STATUSES / AGENT_STATUSES in lib/domain/enums.ts)
-- ---------------------------------------------------------------------------
create type public.agency_status as enum ('active', 'inactive');
create type public.agent_status as enum ('active', 'inactive', 'terminated');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
-- Cuts are basis points (0–10000) so penny math stays integer-exact:
--   commission_cut_bps — the share of the post-agent commission remainder the
--                        sub-agency keeps (the rest is Findway's).
--   override_cut_bps   — the share of override lines the sub-agency keeps.
create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.agency_status not null default 'active',
  commission_cut_bps integer not null default 0
    check (commission_cut_bps between 0 and 10000),
  override_cut_bps integer not null default 0
    check (override_cut_bps between 0 and 10000),
  owner_profile_id uuid unique references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- commission_split_bps is the agent's share of a commission line; the
-- remainder is split between the agency cut and the house.
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  npn text unique,
  status public.agent_status not null default 'active',
  agency_id uuid references public.agencies (id) on delete restrict,
  commission_split_bps integer not null default 8000
    check (commission_split_bps between 0 and 10000),
  profile_id uuid unique references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_agents_agency on public.agents (agency_id);
create index idx_agents_status on public.agents (status);

-- ---------------------------------------------------------------------------
-- Triggers — shared updated_at helper for this and future entity tables.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_agencies_updated_at
before update on public.agencies
for each row
execute function public.set_updated_at();

create trigger trg_agents_updated_at
before update on public.agents
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Book-of-business helper functions. Security definer (like current_app_role
-- in 0001) so policies on other tables can consult agents/agencies without
-- RLS recursion. Both return NULL for deactivated profiles and for
-- inactive/terminated hierarchy rows — NULL never matches, so access drops.
-- ---------------------------------------------------------------------------
create or replace function public.current_agent_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select a.id
  from public.agents a
  where a.profile_id = (select auth.uid())
    and a.status = 'active'
    and public.is_active_user();
$$;

create or replace function public.current_agency_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select g.id
  from public.agencies g
  where g.owner_profile_id = (select auth.uid())
    and g.status = 'active'
    and public.is_active_user();
$$;

-- THE book-of-business predicate. Downstream tables scope rows with
-- can_access_agent(<row's writing agent>): staff see everything, an agent
-- sees their own production, an agency owner sees their agents' production.
create or replace function public.can_access_agent(target_agent_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role('admin', 'manager')
    or target_agent_id = public.current_agent_id()
    or exists (
      select 1
      from public.agents a
      where a.id = target_agent_id
        and a.agency_id = public.current_agency_id()
    );
$$;

-- ---------------------------------------------------------------------------
-- Row-Level Security
--   admin   — full CRUD
--   manager — create/read/update, no delete
--   agent   — reads their own agent row
--   agency_owner — reads their agency and its agents
-- ---------------------------------------------------------------------------
alter table public.agencies enable row level security;

create policy agencies_select on public.agencies
for select to authenticated
using (public.has_role('admin', 'manager') or id = public.current_agency_id());

create policy agencies_insert on public.agencies
for insert to authenticated
with check (public.has_role('admin', 'manager'));

create policy agencies_update on public.agencies
for update to authenticated
using (public.has_role('admin', 'manager'))
with check (public.has_role('admin', 'manager'));

create policy agencies_delete on public.agencies
for delete to authenticated
using (public.has_role('admin'));

alter table public.agents enable row level security;

create policy agents_select on public.agents
for select to authenticated
using (public.can_access_agent(id));

create policy agents_insert on public.agents
for insert to authenticated
with check (public.has_role('admin', 'manager'));

create policy agents_update on public.agents
for update to authenticated
using (public.has_role('admin', 'manager'))
with check (public.has_role('admin', 'manager'));

create policy agents_delete on public.agents
for delete to authenticated
using (public.has_role('admin'));
