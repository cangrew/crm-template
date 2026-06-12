-- ============================================================================
-- Policies — the production unit of the book of business. Every policy names
-- its client, carrier, and writing agent; the agent drives all tenant scoping
-- (and, later, commission attribution).
--
-- Date semantics (deliberate):
--   * effectuated_at   — the member paid the first premium; commission
--                        eligibility begins here.
--   * original_effective_date — first-ever effective date of the coverage;
--                        drives new-business vs renewal rate selection.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enum (values mirror POLICY_STATUSES in lib/domain/enums.ts, lifecycle order)
-- ---------------------------------------------------------------------------
create type public.policy_status as enum (
  'draft',
  'submitted',
  'active',
  'grace',
  'lapsed',
  'cancelled',
  'terminated',
  'renewed'
);

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table public.policies (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  carrier_id uuid not null references public.carriers (id) on delete restrict,
  -- The writing agent — drives all tenant scoping below.
  agent_id uuid not null references public.agents (id) on delete restrict,
  policy_number text,
  carrier_member_id text,
  plan_name text,
  status public.policy_status not null default 'draft',
  member_count integer not null default 1 check (member_count >= 1),
  monthly_premium_cents integer check (monthly_premium_cents >= 0),
  effective_date date,
  effectuated_at date,
  termination_date date,
  original_effective_date date,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_policies_carrier_number on public.policies (carrier_id, policy_number);
create index idx_policies_agent on public.policies (agent_id);
create index idx_policies_client on public.policies (client_id);
create index idx_policies_status on public.policies (status);

-- ---------------------------------------------------------------------------
-- Triggers — reuse the shared updated_at helper from 0003_agencies_agents.sql.
-- ---------------------------------------------------------------------------
create trigger trg_policies_updated_at
before update on public.policies
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security — reads are book-scoped through can_access_agent():
-- staff see everything, an agent sees their own production, an agency owner
-- sees their agents' production. Writes stay with staff:
--   admin   — full CRUD
--   manager — create/read/update, no delete
--   agent / agency_owner — read-only over their book of business
-- ---------------------------------------------------------------------------
alter table public.policies enable row level security;

create policy policies_select on public.policies
for select to authenticated
using (public.has_role('admin', 'manager') or public.can_access_agent(agent_id));

create policy policies_insert on public.policies
for insert to authenticated
with check (public.has_role('admin', 'manager'));

create policy policies_update on public.policies
for update to authenticated
using (public.has_role('admin', 'manager'))
with check (public.has_role('admin', 'manager'));

create policy policies_delete on public.policies
for delete to authenticated
using (public.has_role('admin'));

-- ---------------------------------------------------------------------------
-- Notifications: alert staff when a policy lapses (audience mirrors
-- NOTIFICATION_AUDIENCE in lib/domain/notifications.ts). Staff-only because
-- notify_roles fans out by role and other agents must not see another book's
-- policy identifiers.
-- ---------------------------------------------------------------------------
create or replace function public.notify_policy_lapsed()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'lapsed' and old.status is distinct from new.status then
    perform public.notify_roles(
      array['admin', 'manager']::public.app_role[],
      'policy_lapsed', 'high',
      'Policy lapsed: ' || coalesce(new.policy_number, new.id::text),
      'Status moved from ' || old.status::text || ' to lapsed.',
      'policy', new.id::text
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_policy_lapsed
after update on public.policies
for each row
execute function public.notify_policy_lapsed();
