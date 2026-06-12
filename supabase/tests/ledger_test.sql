-- The money suite: post_statement / void_statement RPCs and the append-only
-- ledger's per-payee RLS. Hand-built entries mirror the TS engine's math
-- (lib/domain/commission-engine.ts) for an agency agent (split 80%, agency
-- cut 50%, override cut 30%), a chargeback, and a direct agent (split 75%).
-- Run with: pnpm db:test. Single transaction, rolled back at the end.

begin;
select plan(24);

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
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values
  ('ccccccc1-1111-4111-8111-111111111111', 'led-admin@test', '{"full_name":"Led Admin"}'),
  ('ccccccc1-1111-4111-8111-111111111112', 'led-manager@test', '{"full_name":"Led Manager"}'),
  ('ccccccc1-1111-4111-8111-111111111113', 'led-owner@test', '{"full_name":"Led Owner"}'),
  ('ccccccc1-1111-4111-8111-111111111114', 'led-agent@test', '{"full_name":"Led Agent"}'),
  ('ccccccc1-1111-4111-8111-111111111115', 'led-direct@test', '{"full_name":"Led Direct"}'),
  ('ccccccc1-1111-4111-8111-111111111116', 'led-disabled@test', '{"full_name":"Led Disabled"}');

update public.profiles set role = 'admin' where id = 'ccccccc1-1111-4111-8111-111111111111';
update public.profiles set role = 'manager' where id = 'ccccccc1-1111-4111-8111-111111111112';
update public.profiles set role = 'agency_owner' where id = 'ccccccc1-1111-4111-8111-111111111113';
update public.profiles set role = 'agent' where id = 'ccccccc1-1111-4111-8111-111111111114';
update public.profiles set role = 'agent' where id = 'ccccccc1-1111-4111-8111-111111111115';
update public.profiles set role = 'agent', is_active = false
where id = 'ccccccc1-1111-4111-8111-111111111116';

insert into public.agencies (id, name, commission_cut_bps, override_cut_bps, owner_profile_id)
values ('ccccccc2-2222-4222-8222-222222222221', 'Led Harbor', 5000, 3000,
        'ccccccc1-1111-4111-8111-111111111113');

insert into public.agents (id, full_name, status, agency_id, commission_split_bps, profile_id)
values
  ('ccccccc3-3333-4333-8333-333333333331', 'Led Agent', 'active',
   'ccccccc2-2222-4222-8222-222222222221', 8000, 'ccccccc1-1111-4111-8111-111111111114'),
  ('ccccccc3-3333-4333-8333-333333333332', 'Led Direct', 'active',
   null, 7500, 'ccccccc1-1111-4111-8111-111111111115'),
  ('ccccccc3-3333-4333-8333-333333333333', 'Led Disabled', 'active',
   null, 8000, 'ccccccc1-1111-4111-8111-111111111116');

insert into public.carriers (id, name)
values ('ccccccc4-4444-4444-8444-444444444441', 'Led Carrier');

insert into public.clients (id, first_name, last_name, status, agent_id)
values
  ('ccccccc5-5555-4555-8555-555555555551', 'Cara', 'Client', 'active',
   'ccccccc3-3333-4333-8333-333333333331'),
  ('ccccccc5-5555-4555-8555-555555555552', 'Dino', 'Client', 'active',
   'ccccccc3-3333-4333-8333-333333333332');

insert into public.policies (id, client_id, carrier_id, agent_id, policy_number, status)
values
  ('ccccccc6-6666-4666-8666-666666666661', 'ccccccc5-5555-4555-8555-555555555551',
   'ccccccc4-4444-4444-8444-444444444441', 'ccccccc3-3333-4333-8333-333333333331',
   'LED-001', 'active'),
  ('ccccccc6-6666-4666-8666-666666666662', 'ccccccc5-5555-4555-8555-555555555552',
   'ccccccc4-4444-4444-8444-444444444441', 'ccccccc3-3333-4333-8333-333333333332',
   'LED-002', 'active');

-- S1: the statement under test ($100.00 commission + $22.00 chargeback on the
-- agency agent's policy, $50.00 commission on the direct agent's). S2: a spare
-- draft for the authorization probe.
insert into public.commission_statements (id, carrier_id, period_month)
values
  ('ccccccc7-7777-4777-8777-777777777771', 'ccccccc4-4444-4444-8444-444444444441', '2026-05-01'),
  ('ccccccc7-7777-4777-8777-777777777772', 'ccccccc4-4444-4444-8444-444444444441', '2026-06-01');

insert into public.statement_lines
  (id, statement_id, row_index, raw, amount_cents, match_status, matched_policy_id)
values
  ('ccccccc8-8888-4888-8888-888888888881', 'ccccccc7-7777-4777-8777-777777777771',
   0, '{}', 10000, 'auto_matched', 'ccccccc6-6666-4666-8666-666666666661'),
  ('ccccccc8-8888-4888-8888-888888888882', 'ccccccc7-7777-4777-8777-777777777771',
   1, '{}', -2200, 'auto_matched', 'ccccccc6-6666-4666-8666-666666666661'),
  ('ccccccc8-8888-4888-8888-888888888883', 'ccccccc7-7777-4777-8777-777777777771',
   2, '{}', 5000, 'auto_matched', 'ccccccc6-6666-4666-8666-666666666662');



-- ===========================================================================
-- Authorization: a tenant cannot post
-- ===========================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"ccccccc1-1111-4111-8111-111111111114"}';

select throws_ok(
  $$select public.post_statement('ccccccc7-7777-4777-8777-777777777772', '[]'::jsonb)$$,
  '42501',
  null,
  'an agent cannot call post_statement'
);

-- ===========================================================================
-- Manager posts the statement
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"ccccccc1-1111-4111-8111-111111111112"}';

select lives_ok(
  $sql$select public.post_statement('ccccccc7-7777-4777-8777-777777777771', '[ {"statement_line_id":"ccccccc8-8888-4888-8888-888888888881","policy_id":"ccccccc6-6666-4666-8666-666666666661","entry_kind":"agent_commission","payee_type":"agent","agent_id":"ccccccc3-3333-4333-8333-333333333331","agency_id":"ccccccc2-2222-4222-8222-222222222221","amount_cents":8000,"applied_bps":8000,"period_month":"2026-05-01"}, {"statement_line_id":"ccccccc8-8888-4888-8888-888888888881","policy_id":"ccccccc6-6666-4666-8666-666666666661","entry_kind":"agency_commission","payee_type":"agency","agent_id":"ccccccc3-3333-4333-8333-333333333331","agency_id":"ccccccc2-2222-4222-8222-222222222221","amount_cents":1000,"applied_bps":5000,"period_month":"2026-05-01"}, {"statement_line_id":"ccccccc8-8888-4888-8888-888888888881","policy_id":"ccccccc6-6666-4666-8666-666666666661","entry_kind":"house_commission","payee_type":"house","agent_id":"ccccccc3-3333-4333-8333-333333333331","agency_id":"ccccccc2-2222-4222-8222-222222222221","amount_cents":1000,"applied_bps":null,"period_month":"2026-05-01"}, {"statement_line_id":"ccccccc8-8888-4888-8888-888888888882","policy_id":"ccccccc6-6666-4666-8666-666666666661","entry_kind":"agent_commission","payee_type":"agent","agent_id":"ccccccc3-3333-4333-8333-333333333331","agency_id":"ccccccc2-2222-4222-8222-222222222221","amount_cents":-1760,"applied_bps":8000,"period_month":"2026-05-01"}, {"statement_line_id":"ccccccc8-8888-4888-8888-888888888882","policy_id":"ccccccc6-6666-4666-8666-666666666661","entry_kind":"agency_commission","payee_type":"agency","agent_id":"ccccccc3-3333-4333-8333-333333333331","agency_id":"ccccccc2-2222-4222-8222-222222222221","amount_cents":-220,"applied_bps":5000,"period_month":"2026-05-01"}, {"statement_line_id":"ccccccc8-8888-4888-8888-888888888882","policy_id":"ccccccc6-6666-4666-8666-666666666661","entry_kind":"house_commission","payee_type":"house","agent_id":"ccccccc3-3333-4333-8333-333333333331","agency_id":"ccccccc2-2222-4222-8222-222222222221","amount_cents":-220,"applied_bps":null,"period_month":"2026-05-01"}, {"statement_line_id":"ccccccc8-8888-4888-8888-888888888883","policy_id":"ccccccc6-6666-4666-8666-666666666662","entry_kind":"agent_commission","payee_type":"agent","agent_id":"ccccccc3-3333-4333-8333-333333333332","agency_id":null,"amount_cents":3750,"applied_bps":7500,"period_month":"2026-05-01"}, {"statement_line_id":"ccccccc8-8888-4888-8888-888888888883","policy_id":"ccccccc6-6666-4666-8666-666666666662","entry_kind":"house_commission","payee_type":"house","agent_id":"ccccccc3-3333-4333-8333-333333333332","agency_id":null,"amount_cents":1250,"applied_bps":null,"period_month":"2026-05-01"} ]'::jsonb)$sql$,
  'manager can post a statement'
);

select throws_like(
  $$select public.post_statement('ccccccc7-7777-4777-8777-777777777771', '[]'::jsonb)$$,
  '%not postable%',
  'a posted statement cannot be posted again'
);

select is(
  (select status from public.commission_statements
   where id = 'ccccccc7-7777-4777-8777-777777777771'),
  'posted'::public.statement_status,
  'posting flips the statement to posted'
);

select is(
  (select line_count from public.commission_statements
   where id = 'ccccccc7-7777-4777-8777-777777777771'),
  3,
  'posting rolls up line_count'
);

select is(
  (select total_amount_cents from public.commission_statements
   where id = 'ccccccc7-7777-4777-8777-777777777771'),
  12800::bigint,
  'posting rolls up total_amount_cents (10000 - 2200 + 5000)'
);

select is(
  (select count(*) from public.statement_lines
   where statement_id = 'ccccccc7-7777-4777-8777-777777777771' and posted),
  3::bigint,
  'posting flags every line as posted'
);

select is(
  (select count(*)
   from (
     select l.id, l.amount_cents, sum(e.amount_cents) as allocated
     from public.statement_lines l
     join public.ledger_entries e on e.statement_line_id = l.id
     where l.statement_id = 'ccccccc7-7777-4777-8777-777777777771'
     group by l.id, l.amount_cents
   ) sums
   where sums.allocated <> sums.amount_cents),
  0::bigint,
  'every line''s ledger entries sum exactly to the line amount'
);

-- ===========================================================================
-- Tenant visibility: each payee sees exactly their slice, never house rows
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"ccccccc1-1111-4111-8111-111111111114"}';

select is(
  (select count(*) from public.ledger_entries),
  2::bigint,
  'the agency agent sees exactly their two commission shares'
);

select is(
  (select count(*) from public.ledger_entries where payee_type <> 'agent'),
  0::bigint,
  'the agent sees no agency or house rows (no cut/residual leak)'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"ccccccc1-1111-4111-8111-111111111115"}';

select is(
  (select count(*) from public.ledger_entries),
  1::bigint,
  'the direct agent sees exactly their one commission share'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"ccccccc1-1111-4111-8111-111111111113"}';

select is(
  (select count(*) from public.ledger_entries),
  4::bigint,
  'the owner sees the agency cuts plus their agent''s shares'
);

select is(
  (select count(*) from public.ledger_entries where payee_type = 'house'),
  0::bigint,
  'the owner sees no house rows'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"ccccccc1-1111-4111-8111-111111111116"}';

select is(
  (select count(*) from public.ledger_entries),
  0::bigint,
  'a deactivated agent sees no ledger entries'
);

-- ===========================================================================
-- Append-only: even an admin cannot update or delete ledger rows
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"ccccccc1-1111-4111-8111-111111111111"}';

select is(
  (select count(*) from public.ledger_entries),
  8::bigint,
  'staff see every ledger entry'
);

select is(
  pg_temp.affected($$update public.ledger_entries set amount_cents = 0$$),
  0::bigint,
  'admin UPDATE of ledger entries affects 0 rows (append-only)'
);

select is(
  pg_temp.affected($$delete from public.ledger_entries$$),
  0::bigint,
  'admin DELETE of ledger entries affects 0 rows (append-only)'
);

-- ===========================================================================
-- Voiding: admin-only, inserts exact negations
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"ccccccc1-1111-4111-8111-111111111112"}';

select throws_ok(
  $$select public.void_statement('ccccccc7-7777-4777-8777-777777777771')$$,
  '42501',
  null,
  'a manager cannot void a posted statement'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"ccccccc1-1111-4111-8111-111111111111"}';

select lives_ok(
  $$select public.void_statement('ccccccc7-7777-4777-8777-777777777771')$$,
  'admin can void a posted statement'
);

select is(
  (select status from public.commission_statements
   where id = 'ccccccc7-7777-4777-8777-777777777771'),
  'void'::public.statement_status,
  'voiding flips the statement to void'
);

select is(
  (select count(*) from public.ledger_entries),
  16::bigint,
  'voiding doubles the entries with reversals'
);

select is(
  (select coalesce(sum(amount_cents), -1) from public.ledger_entries),
  0::bigint,
  'reversals zero the ledger out exactly'
);

select is(
  (select count(*) from public.statement_lines
   where statement_id = 'ccccccc7-7777-4777-8777-777777777771' and posted),
  0::bigint,
  'voiding flips the lines back to unposted'
);

select throws_like(
  $$select public.void_statement('ccccccc7-7777-4777-8777-777777777771')$$,
  '%not voidable%',
  'a voided statement cannot be voided again'
);

select * from finish();
rollback;
