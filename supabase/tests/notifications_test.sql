-- Notification fan-out and ownership assertions (migrations 0002 + 0003).
-- Run with: pnpm db:test  (wraps `supabase test db`, which uses pgTAP).
-- Everything runs inside a single transaction that is rolled back at the end.
--
-- Counts are always scoped to a fixture user_id (never global) because the
-- bootstrap seed admin also receives fan-outs.

begin;
select plan(12);

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
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'ntf-member@test', '{"full_name":"Ntf Member"}');

update public.profiles set role = 'admin' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
update public.profiles set role = 'manager' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';
update public.profiles set role = 'member' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3';

-- ---------------------------------------------------------------------------
-- Creating a contact (as superuser, actor null) notifies every role.
-- ---------------------------------------------------------------------------
reset role;
set local request.jwt.claims to '';

insert into public.contacts (id, name, company, status)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'Ntf Contact', 'Ntf Co', 'lead');

select is(
  (select count(*) from public.notifications
   where type = 'contact_created'
     and entity_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'
     and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  1::bigint,
  'contact_created reaches the admin'
);

select is(
  (select count(*) from public.notifications
   where type = 'contact_created'
     and entity_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'
     and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
  1::bigint,
  'contact_created reaches the manager'
);

select is(
  (select count(*) from public.notifications
   where type = 'contact_created'
     and entity_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'
     and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
  1::bigint,
  'contact_created reaches the member'
);

-- ---------------------------------------------------------------------------
-- The manager flags the contact at risk: high-priority fan-out to admin
-- (+managers), excluding the acting manager; members are not in the audience.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2"}';

update public.contacts set status = 'at_risk'
where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';

reset role;
set local request.jwt.claims to '';

select is(
  (select count(*) from public.notifications
   where type = 'contact_at_risk'
     and priority = 'high'
     and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  1::bigint,
  'contact_at_risk reaches the admin as high priority'
);

select is(
  (select count(*) from public.notifications
   where type = 'contact_at_risk'
     and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
  0::bigint,
  'the acting manager is not notified about their own change'
);

select is(
  (select count(*) from public.notifications
   where type = 'contact_at_risk'
     and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
  0::bigint,
  'members are outside the contact_at_risk audience'
);

-- ---------------------------------------------------------------------------
-- Closing the contact notifies admins only.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2"}';

update public.contacts set status = 'closed'
where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';

reset role;
set local request.jwt.claims to '';

select is(
  (select count(*) from public.notifications
   where type = 'contact_closed'
     and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  1::bigint,
  'contact_closed reaches the admin'
);

select is(
  (select count(*) from public.notifications
   where type = 'contact_closed'
     and user_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3')),
  0::bigint,
  'contact_closed reaches neither manager nor member'
);

-- ---------------------------------------------------------------------------
-- Ownership RLS: users see and manage only their own notifications.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3"}';

select is(
  (select count(*) from public.notifications
   where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  0::bigint,
  'a member cannot read another user''s notifications'
);

select is(
  (select count(*) from public.notifications
   where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'
     and entity_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'),
  1::bigint,
  'a member reads their own notifications'
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
      where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'$$
  ),
  1::bigint,
  'marking one''s own notification read succeeds'
);

select * from finish();
rollback;
