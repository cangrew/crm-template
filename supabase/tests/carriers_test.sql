-- RLS / constraint assertions for carriers, rate_schedules, and
-- carrier_csv_mappings: carriers are tenant-readable (agents resolve carrier
-- names on their policies) while the economics tables stay staff-only, plus
-- the mandatory deactivated-user case and the exactly-one-value check.
-- Run with: pnpm db:test  (wraps `supabase test db`, which uses pgTAP).
-- Everything runs inside a single transaction that is rolled back at the end.

begin;
select plan(11);

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
--   tenants: an agent; plus a deactivated agent
--   data:    one carrier with a rate schedule and a CSV mapping
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values
  ('ab111111-1111-4111-8111-111111111111', 'car-admin@test', '{"full_name":"Car Admin"}'),
  ('ab111111-1111-4111-8111-111111111112', 'car-manager@test', '{"full_name":"Car Manager"}'),
  ('ab111111-1111-4111-8111-111111111113', 'car-agent@test', '{"full_name":"Car Agent"}'),
  ('ab111111-1111-4111-8111-111111111114', 'car-disabled@test', '{"full_name":"Car Disabled"}');

update public.profiles set role = 'admin' where id = 'ab111111-1111-4111-8111-111111111111';
update public.profiles set role = 'manager' where id = 'ab111111-1111-4111-8111-111111111112';
update public.profiles set role = 'agent' where id = 'ab111111-1111-4111-8111-111111111113';
update public.profiles set role = 'agent', is_active = false
where id = 'ab111111-1111-4111-8111-111111111114';

insert into public.carriers (id, name, status)
values ('ac222222-2222-4222-8222-222222222221', 'Ambetter Health', 'active');

insert into public.rate_schedules (id, carrier_id, rate_type, business_type, pmpm_cents, effective_from)
values ('ad333333-3333-4333-8333-333333333331', 'ac222222-2222-4222-8222-222222222221',
        'pmpm', 'new_business', 2200, '2026-01-01');

insert into public.carrier_csv_mappings (id, carrier_id, name, mapping, header_signature)
values ('ae444444-4444-4444-8444-444444444441', 'ac222222-2222-4222-8222-222222222221',
        'Ambetter monthly statement', '{"policy_number":"Policy ID"}',
        'policy id|member id');

select is(
  (select source_config from public.carrier_csv_mappings
   where id = 'ae444444-4444-4444-8444-444444444441'),
  '{}'::jsonb,
  'carrier CSV mappings default legacy source_config to an empty object'
);

-- ===========================================================================
-- Manager: create/read/update carriers and their economics
-- ===========================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"ab111111-1111-4111-8111-111111111112"}';

select lives_ok(
  $$insert into public.carriers (id, name)
    values ('ac222222-2222-4222-8222-222222222222', 'Oscar Health')$$,
  'manager can insert a carrier'
);

select is(
  pg_temp.affected(
    $$update public.carriers set notes = 'patched by manager'
      where id = 'ac222222-2222-4222-8222-222222222221'$$
  ),
  1::bigint,
  'manager can update a carrier'
);

select lives_ok(
  $$insert into public.rate_schedules (carrier_id, rate_type, business_type, percent_bps, effective_from)
    values ('ac222222-2222-4222-8222-222222222222', 'percent_of_premium', 'renewal', 300, '2026-01-01')$$,
  'manager can insert a rate schedule'
);

select throws_ok(
  $$insert into public.rate_schedules (carrier_id, rate_type, business_type, pmpm_cents, percent_bps, effective_from)
    values ('ac222222-2222-4222-8222-222222222221', 'pmpm', 'new_business', 2200, 500, '2026-01-01')$$,
  '23514',
  null,
  'a rate schedule carrying both value columns violates the check constraint'
);

-- ===========================================================================
-- Agent: reads carriers (to resolve names on their policies) but none of the
-- carrier economics; no writes anywhere
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"ab111111-1111-4111-8111-111111111113"}';

select is(
  (select count(*) from public.carriers),
  2::bigint,
  'agent can read every carrier'
);

select is(
  (select count(*) from public.rate_schedules),
  0::bigint,
  'agent sees no rate schedules'
);

select is(
  (select count(*) from public.carrier_csv_mappings),
  0::bigint,
  'agent sees no carrier CSV mappings'
);

select throws_ok(
  $$insert into public.carriers (name) values ('Rogue Carrier')$$,
  '42501',
  null,
  'agent cannot insert a carrier'
);

-- ===========================================================================
-- Admin: delete rights
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"ab111111-1111-4111-8111-111111111111"}';

select is(
  pg_temp.affected(
    $$delete from public.carriers
      where id = 'ac222222-2222-4222-8222-222222222222'$$
  ),
  1::bigint,
  'admin can delete a carrier'
);

-- ===========================================================================
-- Deactivated user: is_active = false severs even tenant-readable carriers
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"ab111111-1111-4111-8111-111111111114"}';

select is(
  (select count(*) from public.carriers),
  0::bigint,
  'deactivated user sees no carriers'
);

select * from finish();
rollback;
