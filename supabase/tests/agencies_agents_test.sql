-- RLS / helper assertions for the Findway hierarchy (agencies, agents) and
-- the book-of-business helpers current_agent_id / current_agency_id /
-- can_access_agent, including the mandatory deactivated-user case.
-- Run with: pnpm db:test  (wraps `supabase test db`, which uses pgTAP).
-- Everything runs inside a single transaction that is rolled back at the end.

begin;
select plan(22);

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
--   staff:   admin, manager
--   tenants: Olive owns "Harbor Agency"; Andy is Harbor's agent;
--            Dina is a direct (house) agent; Dex is a deactivated agent.
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values
  ('77777777-7777-4777-8777-777777777771', 'hier-admin@test', '{"full_name":"Hier Admin"}'),
  ('77777777-7777-4777-8777-777777777772', 'hier-manager@test', '{"full_name":"Hier Manager"}'),
  ('77777777-7777-4777-8777-777777777773', 'hier-owner@test', '{"full_name":"Olive Owner"}'),
  ('77777777-7777-4777-8777-777777777774', 'hier-agent@test', '{"full_name":"Andy Agent"}'),
  ('77777777-7777-4777-8777-777777777775', 'hier-direct@test', '{"full_name":"Dina Direct"}'),
  ('77777777-7777-4777-8777-777777777776', 'hier-disabled@test', '{"full_name":"Dex Disabled"}');

update public.profiles set role = 'admin' where id = '77777777-7777-4777-8777-777777777771';
update public.profiles set role = 'manager' where id = '77777777-7777-4777-8777-777777777772';
update public.profiles set role = 'agency_owner' where id = '77777777-7777-4777-8777-777777777773';
update public.profiles set role = 'agent' where id = '77777777-7777-4777-8777-777777777774';
update public.profiles set role = 'agent' where id = '77777777-7777-4777-8777-777777777775';
update public.profiles set role = 'agent', is_active = false
where id = '77777777-7777-4777-8777-777777777776';

insert into public.agencies (id, name, commission_cut_bps, override_cut_bps, owner_profile_id)
values ('88888888-8888-4888-8888-888888888881', 'Harbor Agency', 5000, 3000,
        '77777777-7777-4777-8777-777777777773');

insert into public.agents (id, full_name, status, agency_id, commission_split_bps, profile_id)
values
  ('99999999-9999-4999-8999-999999999991', 'Andy Agent', 'active',
   '88888888-8888-4888-8888-888888888881', 8000, '77777777-7777-4777-8777-777777777774'),
  ('99999999-9999-4999-8999-999999999992', 'Dina Direct', 'active',
   null, 7500, '77777777-7777-4777-8777-777777777775'),
  ('99999999-9999-4999-8999-999999999993', 'Dex Disabled', 'active',
   null, 8000, '77777777-7777-4777-8777-777777777776');

-- ===========================================================================
-- Manager: create/read/update, no delete
-- ===========================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"77777777-7777-4777-8777-777777777772"}';

select lives_ok(
  $$insert into public.agencies (id, name)
    values ('88888888-8888-4888-8888-888888888882', 'Beacon Agency')$$,
  'manager can insert an agency'
);

select is(
  pg_temp.affected(
    $$update public.agencies set commission_cut_bps = 5500
      where id = '88888888-8888-4888-8888-888888888881'$$
  ),
  1::bigint,
  'manager can adjust an agency cut'
);

select is(
  pg_temp.affected(
    $$delete from public.agencies
      where id = '88888888-8888-4888-8888-888888888882'$$
  ),
  0::bigint,
  'manager delete of an agency affects 0 rows (admin-only)'
);

select lives_ok(
  $$insert into public.agents (full_name, agency_id)
    values ('Manager Made', '88888888-8888-4888-8888-888888888881')$$,
  'manager can insert an agent'
);

select is(
  (select count(*) from public.agents),
  4::bigint,
  'manager reads every agent'
);

-- ===========================================================================
-- Agent (Andy, under Harbor): sees only his own agent row, no agencies
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"77777777-7777-4777-8777-777777777774"}';

select is(
  public.current_agent_id(),
  '99999999-9999-4999-8999-999999999991'::uuid,
  'current_agent_id resolves the calling agent'
);

select is(
  public.current_agency_id(),
  null::uuid,
  'an agent who owns no agency has no current_agency_id'
);

select is(
  (select count(*) from public.agents),
  1::bigint,
  'agent sees only their own agent row'
);

select is(
  (select count(*) from public.agencies),
  0::bigint,
  'agent cannot read agencies'
);

select throws_ok(
  $$insert into public.agents (full_name) values ('Rogue Agent')$$,
  '42501',
  null,
  'agent cannot insert an agent'
);

select is(
  pg_temp.affected(
    $$update public.agents set commission_split_bps = 9900
      where id = '99999999-9999-4999-8999-999999999991'$$
  ),
  0::bigint,
  'agent cannot raise their own split (affects 0 rows)'
);

-- ===========================================================================
-- Agency owner (Olive): her agency and its agents, not the direct agent
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"77777777-7777-4777-8777-777777777773"}';

select is(
  public.current_agency_id(),
  '88888888-8888-4888-8888-888888888881'::uuid,
  'current_agency_id resolves the calling owner''s agency'
);

select is(
  (select count(*) from public.agencies),
  1::bigint,
  'owner sees only their own agency'
);

select ok(
  exists (select 1 from public.agents
          where id = '99999999-9999-4999-8999-999999999991'),
  'owner sees their agency''s agent'
);

select ok(
  not exists (select 1 from public.agents
              where id = '99999999-9999-4999-8999-999999999992'),
  'owner does not see a direct (house) agent'
);

select ok(
  public.can_access_agent('99999999-9999-4999-8999-999999999991'),
  'can_access_agent grants the owner their agency''s agent'
);

select ok(
  not public.can_access_agent('99999999-9999-4999-8999-999999999992'),
  'can_access_agent denies the owner a direct agent'
);

select is(
  pg_temp.affected(
    $$update public.agencies set override_cut_bps = 9000
      where id = '88888888-8888-4888-8888-888888888881'$$
  ),
  0::bigint,
  'owner cannot adjust their own cuts (affects 0 rows)'
);

-- ===========================================================================
-- Admin: delete rights
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"77777777-7777-4777-8777-777777777771"}';

select is(
  pg_temp.affected(
    $$delete from public.agencies
      where id = '88888888-8888-4888-8888-888888888882'$$
  ),
  1::bigint,
  'admin can delete an agency'
);

-- ===========================================================================
-- Deactivated agent (Dex): is_active = false severs everything even though
-- his agent row is still active
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"77777777-7777-4777-8777-777777777776"}';

select is(
  public.current_agent_id(),
  null::uuid,
  'deactivated agent resolves to no agent id'
);

select is(
  (select count(*) from public.agents),
  0::bigint,
  'deactivated agent sees no agent rows'
);

select ok(
  not public.can_access_agent('99999999-9999-4999-8999-999999999993'),
  'can_access_agent denies a deactivated agent their own row'
);

select * from finish();
rollback;
