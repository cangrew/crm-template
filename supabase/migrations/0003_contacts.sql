-- ============================================================================
-- EXAMPLE ENTITY (contacts) — safe to delete; see README "Removing the
-- example entity". This migration is the reference pattern for adding a
-- business entity: enum + table + index + updated_at trigger + RLS gated
-- through has_role() + notification triggers + pgTAP coverage
-- (supabase/tests/rls_test.sql, notifications_test.sql).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enum (values mirror CONTACT_STATUSES in lib/domain/enums.ts)
-- ---------------------------------------------------------------------------
create type public.contact_status as enum ('lead', 'active', 'at_risk', 'closed');

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text,
  phone text,
  status public.contact_status not null default 'lead',
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contacts_status on public.contacts (status);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_contact_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_contacts_updated_at
before update on public.contacts
for each row
execute function public.set_contact_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security. Reads are gated through has_role() too (not a bare
-- `using (true)`), so pending and deactivated accounts see nothing — RLS is
-- the floor, the app guard is just UX.
--   admin   — full CRUD
--   manager — create/read/update, no delete (the worked mid-tier example)
--   agent / agency_owner — read-only tenants (RLS narrows rows from Phase 2 on)
-- ---------------------------------------------------------------------------
alter table public.contacts enable row level security;

create policy contacts_select on public.contacts
for select to authenticated
using (public.has_role('admin', 'manager', 'agent', 'agency_owner'));

create policy contacts_insert on public.contacts
for insert to authenticated
with check (public.has_role('admin', 'manager'));

create policy contacts_update on public.contacts
for update to authenticated
using (public.has_role('admin', 'manager'))
with check (public.has_role('admin', 'manager'));

create policy contacts_delete on public.contacts
for delete to authenticated
using (public.has_role('admin'));

-- ---------------------------------------------------------------------------
-- Notifications: translate contact lifecycle changes into role fan-outs
-- (audiences mirror NOTIFICATION_AUDIENCE in lib/domain/notifications.ts).
-- ---------------------------------------------------------------------------
create or replace function public.notify_contact_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify_roles(
      array['admin', 'manager', 'agent', 'agency_owner']::public.app_role[],
      'contact_created', 'normal',
      'New contact: ' || new.name,
      coalesce(nullif(new.company, ''), 'No company') || ' — added as ' || new.status::text || '.',
      'contact', new.id::text
    );
    return new;
  end if;

  if (new.status is distinct from old.status) then
    if new.status = 'at_risk' then
      perform public.notify_roles(
        array['admin', 'manager']::public.app_role[],
        'contact_at_risk', 'high',
        'Contact at risk: ' || new.name,
        'Status moved from ' || old.status::text || ' to at_risk.',
        'contact', new.id::text
      );
    elsif new.status = 'closed' then
      perform public.notify_roles(
        array['admin']::public.app_role[],
        'contact_closed', 'normal',
        'Contact closed: ' || new.name,
        'Relationship closed (was ' || old.status::text || ').',
        'contact', new.id::text
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_notify_contact_insert
after insert on public.contacts
for each row
execute function public.notify_contact_changes();

create trigger trg_notify_contact_changes
after update on public.contacts
for each row
execute function public.notify_contact_changes();
