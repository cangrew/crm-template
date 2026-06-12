-- Notification preference (mute) assertions (migration 0002).
-- Run with: pnpm db:test  (wraps `supabase test db`, which uses pgTAP).
-- Everything runs inside a single transaction that is rolled back at the end.

begin;
select plan(4);

create extension if not exists pgtap;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'pref-admin@test', '{"full_name":"Pref Admin"}'),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 'pref-manager@test', '{"full_name":"Pref Manager"}');

update public.profiles set role = 'admin' where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
update public.profiles set role = 'manager' where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2';
-- ...2 mutes client_created (below).

insert into public.notification_preferences (user_id, type, muted)
values ('cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 'client_created', true);

-- ---------------------------------------------------------------------------
-- Creating a client (as superuser, so neither user is the actor) should reach
-- the admin but skip the manager who muted client_created.
-- ---------------------------------------------------------------------------
reset role;
set local request.jwt.claims to '';

insert into public.clients (id, first_name, last_name, status)
values ('dddddddd-dddd-4ddd-8ddd-ddddddddddd1', 'Pref', 'Client', 'prospect');

select is(
  (select count(*) from public.notifications
   where type = 'client_created' and user_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'),
  1::bigint,
  'unmuted admin still receives client_created'
);

select is(
  (select count(*) from public.notifications
   where type = 'client_created' and user_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2'),
  0::bigint,
  'manager who muted client_created receives nothing'
);

-- A different type the manager did NOT mute still reaches them (invoked via
-- the fan-out helper directly; the statement triggers land in a later module).
do $$
begin
  perform public.notify_roles(
    array['admin', 'manager']::public.app_role[],
    'statement_posted', 'normal',
    'Statement posted', 'April statement ingested.',
    'statement', 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2'
  );
end;
$$;

select is(
  (select count(*) from public.notifications
   where type = 'statement_posted' and user_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2'),
  1::bigint,
  'unmuted statement_posted still reaches the manager'
);

-- ---------------------------------------------------------------------------
-- RLS: a user cannot read another user's preferences.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1"}';

select is(
  (select count(*) from public.notification_preferences
   where user_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2'),
  0::bigint,
  'admin cannot see the manager''s preferences'
);

select * from finish();
rollback;
