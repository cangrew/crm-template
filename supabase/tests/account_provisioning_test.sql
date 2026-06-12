-- Account provisioning assertions (migration 0001_core): new users provision
-- with no role (pending) and deactivated profiles lose all role-based access.
-- Run with: pnpm db:test  (wraps `supabase test db`, which uses pgTAP).
-- Everything runs inside a single transaction that is rolled back at the end.
--
-- Unlike permissive starters, client reads are role-gated too, so these
-- assertions cover read denial as well as write denial for pending and
-- deactivated accounts.

begin;
select plan(9);

create extension if not exists pgtap;

-- ---------------------------------------------------------------------------
-- Fixtures (created as the superuser test role, bypassing RLS)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'prov-pending@test', '{"full_name":"Prov Pending"}'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', 'prov-disabled@test', '{"full_name":"Prov Disabled"}'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3', 'prov-active@test', '{"full_name":"Prov Active"}');

-- ...e1 keeps the trigger default (no role) and stays active.
-- ...e2 is a manager whose account has been deactivated.
update public.profiles
set role = 'manager', is_active = false
where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2';
-- ...e3 is an active manager (control).
update public.profiles set role = 'manager' where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3';

-- A client the gated SELECT policy should hide from pending/deactivated users.
insert into public.clients (id, first_name, last_name, status)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee10', 'Prov', 'Fixture', 'prospect');

-- The first-login trigger must leave the role unset (pending admin assignment).
select is(
  (select role from public.profiles where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1'),
  null::public.app_role,
  'a newly provisioned profile has no role (pending)'
);

-- ===========================================================================
-- Pending user (authenticated, no role) — resolves to no role, sees nothing,
-- cannot write.
-- ===========================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1"}';

select is(
  public.current_app_role(),
  null::public.app_role,
  'pending user resolves to no app role'
);

select is(
  (select count(*) from public.clients),
  0::bigint,
  'pending user cannot read clients'
);

select throws_ok(
  $$insert into public.clients (first_name, last_name) values ('Pending', 'Client')$$,
  '42501',
  null,
  'pending user cannot insert a client'
);

-- ===========================================================================
-- Deactivated manager — has the role on its row, but is_active = false
-- revokes it, so it resolves to no role, sees nothing, and cannot write.
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2"}';

select is(
  public.current_app_role(),
  null::public.app_role,
  'deactivated manager resolves to no app role'
);

select is(
  (select count(*) from public.clients),
  0::bigint,
  'deactivated manager cannot read clients'
);

select throws_ok(
  $$insert into public.clients (first_name, last_name) values ('Disabled', 'Client')$$,
  '42501',
  null,
  'deactivated manager cannot insert a client'
);

-- ===========================================================================
-- Active manager (control) — reads and writes normally
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3"}';

select is(
  (select count(*) from public.clients
   where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee10'),
  1::bigint,
  'active manager can read clients'
);

select lives_ok(
  $$insert into public.clients (first_name, last_name) values ('Active', 'Client')$$,
  'active manager can insert a client'
);

select * from finish();
rollback;
