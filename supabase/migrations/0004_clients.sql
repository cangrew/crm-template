-- ============================================================================
-- Clients (policyholders) — the heart of the book of business. Every client
-- may be assigned to a writing agent; the assignment drives the multi-tenant
-- row scoping below and, later, commission attribution.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enum (values mirror CLIENT_STATUSES in lib/domain/enums.ts)
-- ---------------------------------------------------------------------------
create type public.client_status as enum ('prospect', 'active', 'inactive');

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  dob date,
  email text,
  phone text,
  address text,
  status public.client_status not null default 'prospect',
  -- The writing agent who owns this client. NULL means an unassigned (house)
  -- client, visible to staff only.
  agent_id uuid references public.agents (id) on delete set null,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_clients_status on public.clients (status);
create index idx_clients_agent on public.clients (agent_id);

-- ---------------------------------------------------------------------------
-- Triggers — reuse the shared updated_at helper from 0003_agencies_agents.sql.
-- ---------------------------------------------------------------------------
create trigger trg_clients_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security — the multi-tenant part. Reads are book-scoped through
-- can_access_agent(): staff see everything, an agent sees their own clients,
-- an agency owner sees their agents' clients. Unassigned (agent_id null)
-- clients are staff-only. Writes stay with staff:
--   admin   — full CRUD
--   manager — create/read/update, no delete
--   agent / agency_owner — read-only over their book of business
-- ---------------------------------------------------------------------------
alter table public.clients enable row level security;

create policy clients_select on public.clients
for select to authenticated
using (
  public.has_role('admin', 'manager')
  or (agent_id is not null and public.can_access_agent(agent_id))
);

create policy clients_insert on public.clients
for insert to authenticated
with check (public.has_role('admin', 'manager'));

create policy clients_update on public.clients
for update to authenticated
using (public.has_role('admin', 'manager'))
with check (public.has_role('admin', 'manager'));

create policy clients_delete on public.clients
for delete to authenticated
using (public.has_role('admin'));

-- ---------------------------------------------------------------------------
-- Notifications: announce new clients to staff (audience mirrors
-- NOTIFICATION_AUDIENCE in lib/domain/notifications.ts). Staff-only because
-- notify_roles fans out by role and other agents must not see another book's
-- client names.
-- ---------------------------------------------------------------------------
create or replace function public.notify_client_created()
returns trigger
language plpgsql
as $$
begin
  perform public.notify_roles(
    array['admin', 'manager']::public.app_role[],
    'client_created', 'normal',
    'New client: ' || new.first_name || ' ' || new.last_name,
    'Added as ' || new.status::text || '.',
    'client', new.id::text
  );
  return new;
end;
$$;

create trigger trg_notify_client_created
after insert on public.clients
for each row
execute function public.notify_client_created();
