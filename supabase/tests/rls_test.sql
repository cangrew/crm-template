-- RLS / policy assertions for clients (book-of-business scoping) and the
-- shared role tiers (admin, manager, agent, agency_owner) plus the
-- deactivated-admin revocation case.
-- Run with: pnpm db:test  (wraps `supabase test db`, which uses pgTAP).
-- Everything runs inside a single transaction that is rolled back at the end.

begin;
select plan(24);

create extension if not exists pgtap;

-- Helper: run a data-modifying statement under the *current* role (RLS applies,
-- SECURITY INVOKER) and return the number of rows it affected. This lets us
-- assert that a denied UPDATE/DELETE silently affects 0 rows.
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
--   staff:   admin, manager (+ a deactivated admin)
--   tenants: Ona owns "Pelican Agency"; Abe writes under it; Dot is a direct
--            (house) agent.
--   clients: one in Abe's book, one in Dot's book, one unassigned (house).
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values
  ('f1111111-1111-4111-8111-111111111111', 'rls-admin@test', '{"full_name":"RLS Admin"}'),
  ('f1111111-1111-4111-8111-111111111112', 'rls-manager@test', '{"full_name":"RLS Manager"}'),
  ('f1111111-1111-4111-8111-111111111113', 'rls-owner@test', '{"full_name":"Ona Owner"}'),
  ('f1111111-1111-4111-8111-111111111114', 'rls-agent@test', '{"full_name":"Abe Agent"}'),
  ('f1111111-1111-4111-8111-111111111115', 'rls-direct@test', '{"full_name":"Dot Direct"}'),
  ('f1111111-1111-4111-8111-111111111116', 'rls-disabled@test', '{"full_name":"RLS Disabled"}');

update public.profiles set role = 'admin' where id = 'f1111111-1111-4111-8111-111111111111';
update public.profiles set role = 'manager' where id = 'f1111111-1111-4111-8111-111111111112';
update public.profiles set role = 'agency_owner' where id = 'f1111111-1111-4111-8111-111111111113';
update public.profiles set role = 'agent' where id = 'f1111111-1111-4111-8111-111111111114';
update public.profiles set role = 'agent' where id = 'f1111111-1111-4111-8111-111111111115';
update public.profiles set role = 'admin', is_active = false
where id = 'f1111111-1111-4111-8111-111111111116';

insert into public.agencies (id, name, owner_profile_id)
values ('f2222222-2222-4222-8222-222222222221', 'Pelican Agency',
        'f1111111-1111-4111-8111-111111111113');

insert into public.agents (id, full_name, status, agency_id, profile_id)
values
  ('f3333333-3333-4333-8333-333333333331', 'Abe Agent', 'active',
   'f2222222-2222-4222-8222-222222222221', 'f1111111-1111-4111-8111-111111111114'),
  ('f3333333-3333-4333-8333-333333333332', 'Dot Direct', 'active',
   null, 'f1111111-1111-4111-8111-111111111115');

insert into public.clients (id, first_name, last_name, status, agent_id)
values
  ('f4444444-4444-4444-8444-444444444441', 'Abe''s', 'Client', 'active',
   'f3333333-3333-4333-8333-333333333331'),
  ('f4444444-4444-4444-8444-444444444442', 'Dot''s', 'Client', 'prospect',
   'f3333333-3333-4333-8333-333333333332'),
  ('f4444444-4444-4444-8444-444444444443', 'House', 'Client', 'prospect', null);

insert into public.documents (id, client_id, kind, storage_path)
values
  ('f5555555-5555-4555-8555-555555555551', 'f4444444-4444-4444-8444-444444444441',
   'contract', 'f4444444-4444-4444-8444-444444444441/contract-1-policy.pdf'),
  ('f5555555-5555-4555-8555-555555555552', null,
   'other', 'general/other-2-note.pdf');

-- ===========================================================================
-- Agent (Abe): reads only his own book, writes nothing
-- ===========================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"f1111111-1111-4111-8111-111111111114"}';

select is(
  (select count(*) from public.clients),
  1::bigint,
  'agent sees only their own book of business'
);

select ok(
  exists (select 1 from public.clients
          where id = 'f4444444-4444-4444-8444-444444444441'),
  'the visible row is the agent''s own client'
);

select ok(
  not exists (select 1 from public.clients
              where id = 'f4444444-4444-4444-8444-444444444443'),
  'agent cannot read an unassigned (house) client'
);

select throws_ok(
  $$insert into public.clients (first_name, last_name) values ('Agent', 'Made')$$,
  '42501',
  null,
  'agent cannot insert a client'
);

select is(
  pg_temp.affected(
    $$update public.clients set notes = 'agent was here'
      where id = 'f4444444-4444-4444-8444-444444444441'$$
  ),
  0::bigint,
  'agent update of their own client silently affects 0 rows'
);

select throws_ok(
  $$insert into public.documents (kind, storage_path)
    values ('other', 'general/other-x.pdf')$$,
  '42501',
  null,
  'agent cannot insert a document'
);

select is(
  pg_temp.affected(
    $$delete from public.documents
      where id = 'f5555555-5555-4555-8555-555555555551'$$
  ),
  0::bigint,
  'agent delete of a document affects 0 rows'
);

select is(
  (select count(*) from public.profiles),
  1::bigint,
  'agent sees only their own profile'
);

-- ===========================================================================
-- Agency owner (Ona): her agency's agents' clients only
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"f1111111-1111-4111-8111-111111111113"}';

select ok(
  exists (select 1 from public.clients
          where id = 'f4444444-4444-4444-8444-444444444441'),
  'owner reads their agency''s agents'' clients'
);

select ok(
  not exists (select 1 from public.clients
              where id = 'f4444444-4444-4444-8444-444444444442'),
  'owner does not read a direct (house) agent''s client'
);

select ok(
  not exists (select 1 from public.clients
              where id = 'f4444444-4444-4444-8444-444444444443'),
  'owner does not read unassigned (house) clients'
);

-- ===========================================================================
-- Manager: create/read/update clients but no delete; full documents
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"f1111111-1111-4111-8111-111111111112"}';

select is(
  (select count(*) from public.clients),
  3::bigint,
  'manager reads every client, including unassigned'
);

select lives_ok(
  $$insert into public.clients (id, first_name, last_name)
    values ('f4444444-4444-4444-8444-444444444444', 'Manager', 'Made')$$,
  'manager can insert a client'
);

select is(
  pg_temp.affected(
    $$update public.clients set notes = 'patched by manager'
      where id = 'f4444444-4444-4444-8444-444444444441'$$
  ),
  1::bigint,
  'manager can update a client'
);

select is(
  pg_temp.affected(
    $$delete from public.clients
      where id = 'f4444444-4444-4444-8444-444444444441'$$
  ),
  0::bigint,
  'manager delete of a client affects 0 rows (admin-only)'
);

select is(
  pg_temp.affected(
    $$delete from public.documents
      where id = 'f5555555-5555-4555-8555-555555555552'$$
  ),
  1::bigint,
  'manager can delete a document'
);

select is(
  (select count(*) from public.profiles),
  1::bigint,
  'manager sees only their own profile'
);

-- ===========================================================================
-- Admin: full control, including client deletes and the users console
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"f1111111-1111-4111-8111-111111111111"}';

select is(
  (select count(*) from public.clients),
  4::bigint,
  'admin reads every client'
);

select is(
  pg_temp.affected(
    $$delete from public.clients
      where id = 'f4444444-4444-4444-8444-444444444441'$$
  ),
  1::bigint,
  'admin can delete a client'
);

select is(
  (select count(*) from public.profiles
   where id = 'f1111111-1111-4111-8111-111111111114'),
  1::bigint,
  'admin can read other profiles'
);

select is(
  pg_temp.affected(
    $$update public.profiles set full_name = 'Renamed Agent'
      where id = 'f1111111-1111-4111-8111-111111111114'$$
  ),
  1::bigint,
  'admin can update another profile'
);

-- ===========================================================================
-- Deactivated admin: the role on the row is revoked by is_active = false
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"f1111111-1111-4111-8111-111111111116"}';

select is(
  public.current_app_role(),
  null::public.app_role,
  'deactivated admin resolves to no app role'
);

select is(
  (select count(*) from public.clients),
  0::bigint,
  'deactivated admin cannot read clients'
);

select is(
  pg_temp.affected(
    $$update public.clients set notes = 'ghost'
      where id = 'f4444444-4444-4444-8444-444444444444'$$
  ),
  0::bigint,
  'deactivated admin update affects 0 rows'
);

select * from finish();
rollback;
