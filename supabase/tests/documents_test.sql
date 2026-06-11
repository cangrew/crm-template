-- Documents table RLS and storage bucket assertions (migration 0004).
-- Run with: pnpm db:test  (wraps `supabase test db`, which uses pgTAP).
-- Everything runs inside a single transaction that is rolled back at the end.

begin;
select plan(7);

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
  ('99999999-9999-4999-8999-999999999991', 'doc-manager@test', '{"full_name":"Doc Manager"}'),
  ('99999999-9999-4999-8999-999999999992', 'doc-member@test', '{"full_name":"Doc Member"}'),
  ('99999999-9999-4999-8999-999999999993', 'doc-disabled@test', '{"full_name":"Doc Disabled"}');

update public.profiles set role = 'manager' where id = '99999999-9999-4999-8999-999999999991';
update public.profiles set role = 'member' where id = '99999999-9999-4999-8999-999999999992';
update public.profiles set role = 'manager', is_active = false
where id = '99999999-9999-4999-8999-999999999993';

insert into public.documents (id, contact_id, kind, storage_path)
values ('88888888-8888-4888-8888-888888888881', null, 'other', 'general/other-1-fixture.pdf');

-- The private bucket the app uploads into must exist.
select is(
  (select count(*) from storage.buckets where id = 'documents' and public = false),
  1::bigint,
  'the private documents bucket exists'
);

-- ===========================================================================
-- Member: read-only
-- ===========================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"99999999-9999-4999-8999-999999999992"}';

select is(
  (select count(*) from public.documents
   where id = '88888888-8888-4888-8888-888888888881'),
  1::bigint,
  'member can read documents'
);

select throws_ok(
  $$insert into public.documents (kind, storage_path)
    values ('invoice', 'general/invoice-x.pdf')$$,
  '42501',
  null,
  'member cannot insert a document'
);

select is(
  pg_temp.affected(
    $$delete from public.documents
      where id = '88888888-8888-4888-8888-888888888881'$$
  ),
  0::bigint,
  'member delete of a document affects 0 rows'
);

-- ===========================================================================
-- Manager: full document management
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"99999999-9999-4999-8999-999999999991"}';

select lives_ok(
  $$insert into public.documents (kind, storage_path)
    values ('contract', 'general/contract-2-new.pdf')$$,
  'manager can insert a document'
);

select is(
  pg_temp.affected(
    $$update public.documents set kind = 'invoice'
      where id = '88888888-8888-4888-8888-888888888881'$$
  ),
  1::bigint,
  'manager can update a document'
);

-- ===========================================================================
-- Deactivated manager: reads nothing
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"99999999-9999-4999-8999-999999999993"}';

select is(
  (select count(*) from public.documents),
  0::bigint,
  'deactivated manager cannot read documents'
);

select * from finish();
rollback;
