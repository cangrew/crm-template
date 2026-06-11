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
-- ...2 mutes contact_created (below).

insert into public.notification_preferences (user_id, type, muted)
values ('cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 'contact_created', true);

-- ---------------------------------------------------------------------------
-- Creating a contact (as superuser, so neither user is the actor) should reach
-- the admin but skip the manager who muted contact_created.
-- ---------------------------------------------------------------------------
reset role;
set local request.jwt.claims to '';

insert into public.contacts (id, name, status)
values ('dddddddd-dddd-4ddd-8ddd-ddddddddddd1', 'Pref Contact', 'lead');

select is(
  (select count(*) from public.notifications
   where type = 'contact_created' and user_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'),
  1::bigint,
  'unmuted admin still receives contact_created'
);

select is(
  (select count(*) from public.notifications
   where type = 'contact_created' and user_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2'),
  0::bigint,
  'manager who muted contact_created receives nothing'
);

-- A different type the manager did NOT mute still reaches them.
update public.contacts set status = 'at_risk'
where id = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1';

select is(
  (select count(*) from public.notifications
   where type = 'contact_at_risk' and user_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2'),
  1::bigint,
  'unmuted contact_at_risk still reaches the manager'
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
