-- RLS / policy assertions per role (admin, manager, member) plus the
-- deactivated-admin revocation case.
-- Run with: pnpm db:test  (wraps `supabase test db`, which uses pgTAP).
-- Everything runs inside a single transaction that is rolled back at the end.

begin;
select plan(17);

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
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values
  ('66666666-6666-4666-8666-666666666661', 'rls-admin@test', '{"full_name":"RLS Admin"}'),
  ('66666666-6666-4666-8666-666666666662', 'rls-manager@test', '{"full_name":"RLS Manager"}'),
  ('66666666-6666-4666-8666-666666666663', 'rls-member@test', '{"full_name":"RLS Member"}'),
  ('66666666-6666-4666-8666-666666666664', 'rls-disabled@test', '{"full_name":"RLS Disabled"}');

update public.profiles set role = 'admin' where id = '66666666-6666-4666-8666-666666666661';
update public.profiles set role = 'manager' where id = '66666666-6666-4666-8666-666666666662';
update public.profiles set role = 'member' where id = '66666666-6666-4666-8666-666666666663';
update public.profiles set role = 'admin', is_active = false
where id = '66666666-6666-4666-8666-666666666664';

insert into public.contacts (id, name, status)
values ('55555555-5555-4555-8555-555555555551', 'Fixture Contact', 'lead');

insert into public.documents (id, contact_id, kind, storage_path)
values
  ('44444444-4444-4444-8444-444444444441', '55555555-5555-4555-8555-555555555551',
   'contract', '55555555-5555-4555-8555-555555555551/contract-1-msa.pdf'),
  ('44444444-4444-4444-8444-444444444442', null,
   'other', 'general/other-2-note.pdf');

-- ===========================================================================
-- Member: read-only everywhere
-- ===========================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"66666666-6666-4666-8666-666666666663"}';

select is(
  (select count(*) from public.contacts
   where id = '55555555-5555-4555-8555-555555555551'),
  1::bigint,
  'member can read contacts'
);

select throws_ok(
  $$insert into public.contacts (name) values ('Member Contact')$$,
  '42501',
  null,
  'member cannot insert a contact'
);

select is(
  pg_temp.affected(
    $$update public.contacts set notes = 'member was here'
      where id = '55555555-5555-4555-8555-555555555551'$$
  ),
  0::bigint,
  'member update of a contact silently affects 0 rows'
);

select throws_ok(
  $$insert into public.documents (kind, storage_path)
    values ('other', 'general/other-x.pdf')$$,
  '42501',
  null,
  'member cannot insert a document'
);

select is(
  pg_temp.affected(
    $$delete from public.documents
      where id = '44444444-4444-4444-8444-444444444441'$$
  ),
  0::bigint,
  'member delete of a document affects 0 rows'
);

select is(
  (select count(*) from public.profiles),
  1::bigint,
  'member sees only their own profile'
);

-- ===========================================================================
-- Manager: create/read/update contacts but no delete; full documents
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"66666666-6666-4666-8666-666666666662"}';

select lives_ok(
  $$insert into public.contacts (id, name)
    values ('55555555-5555-4555-8555-555555555552', 'Manager Contact')$$,
  'manager can insert a contact'
);

select is(
  pg_temp.affected(
    $$update public.contacts set company = 'Patched Co'
      where id = '55555555-5555-4555-8555-555555555551'$$
  ),
  1::bigint,
  'manager can update a contact'
);

select is(
  pg_temp.affected(
    $$delete from public.contacts
      where id = '55555555-5555-4555-8555-555555555551'$$
  ),
  0::bigint,
  'manager delete of a contact affects 0 rows (admin-only)'
);

select is(
  pg_temp.affected(
    $$delete from public.documents
      where id = '44444444-4444-4444-8444-444444444442'$$
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
-- Admin: full control, including contact deletes and the users console
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"66666666-6666-4666-8666-666666666661"}';

select is(
  pg_temp.affected(
    $$delete from public.contacts
      where id = '55555555-5555-4555-8555-555555555551'$$
  ),
  1::bigint,
  'admin can delete a contact'
);

select is(
  (select count(*) from public.profiles
   where id = '66666666-6666-4666-8666-666666666663'),
  1::bigint,
  'admin can read other profiles'
);

select is(
  pg_temp.affected(
    $$update public.profiles set full_name = 'Renamed Member'
      where id = '66666666-6666-4666-8666-666666666663'$$
  ),
  1::bigint,
  'admin can update another profile'
);

-- ===========================================================================
-- Deactivated admin: the role on the row is revoked by is_active = false
-- ===========================================================================
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"66666666-6666-4666-8666-666666666664"}';

select is(
  public.current_app_role(),
  null::public.app_role,
  'deactivated admin resolves to no app role'
);

select is(
  (select count(*) from public.contacts),
  0::bigint,
  'deactivated admin cannot read contacts'
);

select is(
  pg_temp.affected(
    $$update public.contacts set notes = 'ghost'
      where id = '55555555-5555-4555-8555-555555555552'$$
  ),
  0::bigint,
  'deactivated admin update affects 0 rows'
);

select * from finish();
rollback;
