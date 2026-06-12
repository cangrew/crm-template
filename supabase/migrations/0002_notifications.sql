-- Findway — in-app notifications with per-user preferences.
-- Server-authoritative: rows are created only by the SECURITY DEFINER
-- `public.notify_roles` helper, invoked from entity triggers (see
-- 0004_clients.sql for the wiring). Recipients are resolved by role
-- (lib/domain/notifications.ts mirrors this routing). Each notification is one
-- row per recipient user so RLS, unread counts, and realtime filtering stay
-- trivial.

-- ---------------------------------------------------------------------------
-- Enums (values mirror NOTIFICATION_TYPES / NOTIFICATION_PRIORITIES in TS).
-- The later values are used by upcoming modules (policies, statements,
-- payouts); defining them now avoids enum surgery after the first deploy
-- (enum values are append-only once deployed).
-- ---------------------------------------------------------------------------
create type public.notification_type as enum (
  'client_created',
  'policy_lapsed',
  'statement_posted',
  'lines_unmatched',
  'payout_finalized'
);

create type public.notification_priority as enum ('normal', 'high');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  priority public.notification_priority not null default 'normal',
  title text not null,
  body text not null default '',
  -- entity_type names the linked entity ('client', 'policy', …); entity_id is
  -- text so it can hold uuid or numeric ids alike.
  entity_type text not null,
  entity_id text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Unread lookups and the most-recent-first panel feed.
create index idx_notifications_user_unread on public.notifications (user_id, read_at);
create index idx_notifications_user_created on public.notifications (user_id, created_at desc);

-- Realtime delivery: emit full row images so inserts and read-state updates
-- both carry the data the client cache needs.
alter table public.notifications replica identity full;

-- A row with muted = true suppresses a notification type for one user. The
-- absence of a row means the type is delivered (opt-out model).
create table public.notification_preferences (
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  muted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, type)
);

-- ---------------------------------------------------------------------------
-- Row-Level Security: a user sees and manages only their own rows.
-- No insert policy exists on notifications; rows are minted exclusively by
-- notify_roles below.
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;

create policy notifications_select on public.notifications
for select to authenticated
using (user_id = (select auth.uid()));

create policy notifications_update on public.notifications
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy notifications_delete on public.notifications
for delete to authenticated
using (user_id = (select auth.uid()));

alter table public.notification_preferences enable row level security;

create policy notification_preferences_select on public.notification_preferences
for select to authenticated
using (user_id = (select auth.uid()));

create policy notification_preferences_insert on public.notification_preferences
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy notification_preferences_update on public.notification_preferences
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy notification_preferences_delete on public.notification_preferences
for delete to authenticated
using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Fan-out helper. SECURITY DEFINER so it may insert rows for other users
-- (RLS would otherwise block writing rows the caller does not own). Skips the
-- acting user (no self-notifications), inactive profiles, and recipients who
-- muted the type in notification_preferences.
-- ---------------------------------------------------------------------------
create or replace function public.notify_roles(
  p_roles public.app_role[],
  p_type public.notification_type,
  p_priority public.notification_priority,
  p_title text,
  p_body text,
  p_entity_type text,
  p_entity_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
begin
  insert into public.notifications (user_id, type, priority, title, body, entity_type, entity_id)
  select
    p.id, p_type, p_priority, p_title, p_body, p_entity_type, p_entity_id
  from public.profiles p
  where p.role = any (p_roles)
    and p.is_active
    and (v_actor is null or p.id is distinct from v_actor)
    and not exists (
      select 1
      from public.notification_preferences np
      where np.user_id = p.id
        and np.type = p_type
        and np.muted
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Realtime: stream notification rows to subscribed clients.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.notifications;
