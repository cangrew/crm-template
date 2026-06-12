-- RLS assertions for the statement import staging area (commission_statements
-- + statement_lines): staff-only in every direction; tenants see nothing.
-- Run with: pnpm db:test  (wraps `supabase test db`, which uses pgTAP).
-- Everything runs inside a single transaction that is rolled back at the end.

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
-- Fixtures (created as the superuser test role, bypassing RLS)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values
  ('bbbbbbb1-1111-4111-8111-111111111111', 'stm-admin@test', '{"full_name":"Stm Admin"}'),
  ('bbbbbbb1-1111-4111-8111-111111111112', 'stm-manager@test', '{"full_name":"Stm Manager"}'),
  ('bbbbbbb1-1111-4111-8111-111111111113', 'stm-agent@test', '{"full_name":"Stm Agent"}'),
  ('bbbbbbb1-1111-4111-8111-111111111114', 'stm-disabled@test', '{"full_name":"Stm Disabled"}');

update public.profiles set role = 'admin' where id = 'bbbbbbb1-1111-4111-8111-111111111111';
update public.profiles set role = 'manager' where id = 'bbbbbbb1-1111-4111-8111-111111111112';
update public.profiles set role = 'agent' where id = 'bbbbbbb1-1111-4111-8111-111111111113';
update public.profiles set role = 'manager', is_active = false
where id = 'bbbbbbb1-1111-4111-8111-111111111114';

insert into public.agents (id, full_name, status, profile_id)
values ('bbbbbbb2-2222-4222-8222-222222222221', 'Stm Agent', 'active',
        'bbbbbbb1-1111-4111-8111-111111111113');

insert into public.carriers (id, name)
values ('bbbbbbb3-3333-4333-8333-333333333331', 'Stm Carrier');

-- ===========================================================================
-- Manager: full staging workflow
-- ===========================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"bbbbbbb1-1111-4111-8111-111111111112"}';

select lives_ok(
  $$insert into public.commission_statements (id, carrier_id, period_month)
    values ('bbbbbbb4-4444-4444-8444-444444444441',
            'bbbbbbb3-3333-4333-8333-333333333331', '2026-05-01')$$,
  'manager can insert a statement'
);

select lives_ok(
  $$insert into public.statement_lines (id, statement_id, row_index, raw, amount_cents)
    values ('bbbbbbb5-5555-4555-8555-555555555551',
            'bbbbbbb4-4444-4444-8444-444444444441', 0, '{"Policy ID":"AMB-001"}', 2200),
           ('bbbbbbb5-5555-4555-8555-555555555552',
            'bbbbbbb4-4444-4444-8444-444444444441', 1, '{"Policy ID":"AMB-002"}', -860)$$,
  'manager can insert statement lines (including a chargeback)'
);

select is(
  pg_temp.affected(
    $$update public.statement_lines
      set match_status = 'ignored', match_reason = 'footer row'
      where id = 'bbbbbbb5-5555-4555-8555-555555555552'$$
  ),
  1::bigint,
  'manager can update a line''s match fields'
);

-- ===========================================================================
-- Agent: raw statements are staff-only in every direction
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"bbbbbbb1-1111-4111-8111-111111111113"}';

select is(
  (select count(*) from public.commission_statements),
  0::bigint,
  'agent sees no statements'
);

select is(
  (select count(*) from public.statement_lines),
  0::bigint,
  'agent sees no statement lines'
);

select throws_ok(
  $$insert into public.commission_statements (carrier_id, period_month)
    values ('bbbbbbb3-3333-4333-8333-333333333331', '2026-06-01')$$,
  '42501',
  null,
  'agent cannot insert a statement'
);

-- ===========================================================================
-- Deactivated staff: is_active = false severs access
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"bbbbbbb1-1111-4111-8111-111111111114"}';

select is(
  (select count(*) from public.commission_statements),
  0::bigint,
  'deactivated manager sees no statements'
);

-- ===========================================================================
-- Admin: delete cascades the staged lines
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"bbbbbbb1-1111-4111-8111-111111111111"}';

select is(
  pg_temp.affected(
    $$delete from public.commission_statements
      where id = 'bbbbbbb4-4444-4444-8444-444444444441'$$
  ),
  1::bigint,
  'admin can delete a draft statement'
);

select is(
  (select count(*) from public.statement_lines
   where statement_id = 'bbbbbbb4-4444-4444-8444-444444444441'),
  0::bigint,
  'deleting a statement cascades its lines'
);

select * from finish();
rollback;
