-- Notification fan-out and ownership assertions (migrations 0002 + 0004).
-- Run with: pnpm db:test  (wraps `supabase test db`, which uses pgTAP).
-- Everything runs inside a single transaction that is rolled back at the end.
--
-- Counts are always scoped to a fixture user_id (never global) because the
-- bootstrap seed admin also receives fan-outs.

begin;
select plan(9);

create extension if not exists pgtap;

create function pg_temp.affected(sql text)
returns bigint
language plpgsql
as $$
declare
  n bigint;
begin
  execute sql;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'ntf-admin@test', '{"full_name":"Ntf Admin"}'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'ntf-manager@test', '{"full_name":"Ntf Manager"}'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'ntf-agent@test', '{"full_name":"Ntf Agent"}');

update public.profiles set role = 'admin' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
update public.profiles set role = 'manager' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';
update public.profiles set role = 'agent' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3';

-- ---------------------------------------------------------------------------
-- Creating a client (as superuser, actor null) notifies staff only: agents
-- must not see another book's client names through role fan-out.
-- ---------------------------------------------------------------------------
reset role;
set local request.jwt.claims to '';

insert into public.clients (id, first_name, last_name, status)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'Ntf', 'Client', 'prospect');

select is(
  (select count(*) from public.notifications
   where type = 'client_created'
     and entity_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'
     and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  1::bigint,
  'client_created reaches the admin'
);

select is(
  (select count(*) from public.notifications
   where type = 'client_created'
     and entity_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'
     and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
  1::bigint,
  'client_created reaches the manager'
);

select is(
  (select count(*) from public.notifications
   where type = 'client_created'
     and entity_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'
     and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
  0::bigint,
  'agents are outside the client_created audience'
);

-- ---------------------------------------------------------------------------
-- The manager creates a client: the admin is notified, the acting manager is
-- excluded from their own change.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2"}';

insert into public.clients (id, first_name, last_name, status)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'Second', 'Client', 'prospect');

reset role;
set local request.jwt.claims to '';

select is(
  (select count(*) from public.notifications
   where type = 'client_created'
     and entity_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'
     and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  1::bigint,
  'a manager-created client notifies the admin'
);

select is(
  (select count(*) from public.notifications
   where type = 'client_created'
     and entity_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'
     and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
  0::bigint,
  'the acting manager is not notified about their own change'
);

-- ---------------------------------------------------------------------------
-- Ownership RLS: users see and manage only their own notifications.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2"}';

select is(
  (select count(*) from public.notifications
   where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  0::bigint,
  'a manager cannot read another user''s notifications'
);

select is(
  (select count(*) from public.notifications
   where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'
     and entity_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'),
  1::bigint,
  'a manager reads their own notifications'
);

select is(
  pg_temp.affected(
    $$update public.notifications set read_at = now()
      where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'$$
  ),
  0::bigint,
  'marking another user''s notification read affects 0 rows'
);

select is(
  pg_temp.affected(
    $$update public.notifications set read_at = now()
      where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'$$
  ),
  1::bigint,
  'marking one''s own notification read succeeds'
);

select * from finish();
rollback;
