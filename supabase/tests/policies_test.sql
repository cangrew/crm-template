-- RLS / trigger assertions for policies: book-of-business scoping through
-- can_access_agent (agent, agency owner, staff tiers), staff-only writes,
-- the deactivated-user case, and the policy_lapsed notification fan-out
-- (admin + manager audience, actor excluded, tenants never notified).
-- Run with: pnpm db:test  (wraps `supabase test db`, which uses pgTAP).
-- Everything runs inside a single transaction that is rolled back at the end.

begin;
select plan(17);

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
-- Fixtures (created as the superuser test role, bypassing RLS)
--   staff:   admin, two managers (one acts, one only receives notifications)
--   tenants: Orla owns "Pelagic Agency"; Aida writes under it; Dirk is a
--            direct (house) agent; Dee is a deactivated agent.
--   data:    a carrier, one client + policy in Aida's book, one in Dirk's.
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values
  ('ba111111-1111-4111-8111-111111111111', 'pol-admin@test', '{"full_name":"Pol Admin"}'),
  ('ba111111-1111-4111-8111-111111111112', 'pol-manager@test', '{"full_name":"Pol Manager"}'),
  ('ba111111-1111-4111-8111-111111111113', 'pol-manager2@test', '{"full_name":"Pol Manager Two"}'),
  ('ba111111-1111-4111-8111-111111111114', 'pol-owner@test', '{"full_name":"Orla Owner"}'),
  ('ba111111-1111-4111-8111-111111111115', 'pol-agent@test', '{"full_name":"Aida Agent"}'),
  ('ba111111-1111-4111-8111-111111111116', 'pol-direct@test', '{"full_name":"Dirk Direct"}'),
  ('ba111111-1111-4111-8111-111111111117', 'pol-disabled@test', '{"full_name":"Dee Disabled"}');

update public.profiles set role = 'admin' where id = 'ba111111-1111-4111-8111-111111111111';
update public.profiles set role = 'manager' where id = 'ba111111-1111-4111-8111-111111111112';
update public.profiles set role = 'manager' where id = 'ba111111-1111-4111-8111-111111111113';
update public.profiles set role = 'agency_owner' where id = 'ba111111-1111-4111-8111-111111111114';
update public.profiles set role = 'agent' where id = 'ba111111-1111-4111-8111-111111111115';
update public.profiles set role = 'agent' where id = 'ba111111-1111-4111-8111-111111111116';
update public.profiles set role = 'agent', is_active = false
where id = 'ba111111-1111-4111-8111-111111111117';

insert into public.agencies (id, name, owner_profile_id)
values ('bb222222-2222-4222-8222-222222222221', 'Pelagic Agency',
        'ba111111-1111-4111-8111-111111111114');

insert into public.agents (id, full_name, status, agency_id, profile_id)
values
  ('bc333333-3333-4333-8333-333333333331', 'Aida Agent', 'active',
   'bb222222-2222-4222-8222-222222222221', 'ba111111-1111-4111-8111-111111111115'),
  ('bc333333-3333-4333-8333-333333333332', 'Dirk Direct', 'active',
   null, 'ba111111-1111-4111-8111-111111111116');

insert into public.clients (id, first_name, last_name, status, agent_id)
values
  ('bd444444-4444-4444-8444-444444444441', 'Aida''s', 'Client', 'active',
   'bc333333-3333-4333-8333-333333333331'),
  ('bd444444-4444-4444-8444-444444444442', 'Dirk''s', 'Client', 'active',
   'bc333333-3333-4333-8333-333333333332');

insert into public.carriers (id, name)
values ('be555555-5555-4555-8555-555555555551', 'Ambetter Health');

insert into public.policies (id, client_id, carrier_id, agent_id, policy_number, status, member_count, monthly_premium_cents, effective_date)
values
  ('bf666666-6666-4666-8666-666666666661', 'bd444444-4444-4444-8444-444444444441',
   'be555555-5555-4555-8555-555555555551', 'bc333333-3333-4333-8333-333333333331',
   'AMB-T-0001', 'active', 2, 78000, '2026-01-01'),
  ('bf666666-6666-4666-8666-666666666662', 'bd444444-4444-4444-8444-444444444442',
   'be555555-5555-4555-8555-555555555551', 'bc333333-3333-4333-8333-333333333332',
   'AMB-T-0002', 'active', 1, 42000, '2026-01-01');

-- ===========================================================================
-- Agent (Aida): reads only her own production, writes nothing
-- ===========================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"ba111111-1111-4111-8111-111111111115"}';

select is(
  (select count(*) from public.policies),
  1::bigint,
  'agent sees only their own policies'
);

select ok(
  exists (select 1 from public.policies
          where id = 'bf666666-6666-4666-8666-666666666661'),
  'the visible row is the agent''s own policy'
);

select throws_ok(
  $$insert into public.policies (client_id, carrier_id, agent_id)
    values ('bd444444-4444-4444-8444-444444444441',
            'be555555-5555-4555-8555-555555555551',
            'bc333333-3333-4333-8333-333333333331')$$,
  '42501',
  null,
  'agent cannot insert a policy'
);

select is(
  pg_temp.affected(
    $$update public.policies set monthly_premium_cents = 1
      where id = 'bf666666-6666-4666-8666-666666666661'$$
  ),
  0::bigint,
  'agent update of their own policy silently affects 0 rows'
);

-- ===========================================================================
-- Agency owner (Orla): her agency's agents' policies, not the direct agent's
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"ba111111-1111-4111-8111-111111111114"}';

select ok(
  exists (select 1 from public.policies
          where id = 'bf666666-6666-4666-8666-666666666661'),
  'owner reads their agency''s agent''s policy'
);

select ok(
  not exists (select 1 from public.policies
              where id = 'bf666666-6666-4666-8666-666666666662'),
  'owner does not read a direct (house) agent''s policy'
);

-- ===========================================================================
-- Manager: create/read/update but no delete; flipping a policy to lapsed
-- fires the staff notification fan-out
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"ba111111-1111-4111-8111-111111111112"}';

select is(
  (select count(*) from public.policies),
  2::bigint,
  'manager reads every policy'
);

select lives_ok(
  $$insert into public.policies (id, client_id, carrier_id, agent_id, policy_number)
    values ('bf666666-6666-4666-8666-666666666663',
            'bd444444-4444-4444-8444-444444444441',
            'be555555-5555-4555-8555-555555555551',
            'bc333333-3333-4333-8333-333333333331',
            'AMB-T-0003')$$,
  'manager can insert a policy'
);

select is(
  pg_temp.affected(
    $$update public.policies set plan_name = 'patched by manager'
      where id = 'bf666666-6666-4666-8666-666666666663'$$
  ),
  1::bigint,
  'manager can update a policy'
);

select is(
  pg_temp.affected(
    $$delete from public.policies
      where id = 'bf666666-6666-4666-8666-666666666663'$$
  ),
  0::bigint,
  'manager delete of a policy affects 0 rows (admin-only)'
);

select is(
  pg_temp.affected(
    $$update public.policies set status = 'lapsed'
      where id = 'bf666666-6666-4666-8666-666666666661'$$
  ),
  1::bigint,
  'manager can move a policy to lapsed'
);

-- Notification fan-out (checked as superuser, outside RLS): admin and the
-- non-acting manager are notified; the acting manager is excluded as the
-- actor; the writing agent never receives a staff-only type.
reset role;

select is(
  (select count(*) from public.notifications
   where type = 'policy_lapsed'
     and user_id = 'ba111111-1111-4111-8111-111111111111'),
  1::bigint,
  'policy_lapsed notifies the admin'
);

select is(
  (select count(*) from public.notifications
   where type = 'policy_lapsed'
     and user_id = 'ba111111-1111-4111-8111-111111111113'),
  1::bigint,
  'policy_lapsed notifies the other manager'
);

select is(
  (select count(*) from public.notifications
   where type = 'policy_lapsed'
     and user_id = 'ba111111-1111-4111-8111-111111111112'),
  0::bigint,
  'the acting manager is not self-notified'
);

select is(
  (select count(*) from public.notifications
   where type = 'policy_lapsed'
     and user_id = 'ba111111-1111-4111-8111-111111111115'),
  0::bigint,
  'the writing agent receives no policy_lapsed notification'
);

-- ===========================================================================
-- Admin: delete rights
-- ===========================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"ba111111-1111-4111-8111-111111111111"}';

select is(
  pg_temp.affected(
    $$delete from public.policies
      where id = 'bf666666-6666-4666-8666-666666666663'$$
  ),
  1::bigint,
  'admin can delete a policy'
);

-- ===========================================================================
-- Deactivated agent (Dee): is_active = false severs everything
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"ba111111-1111-4111-8111-111111111117"}';

select is(
  (select count(*) from public.policies),
  0::bigint,
  'deactivated user sees no policies'
);

select * from finish();
rollback;
