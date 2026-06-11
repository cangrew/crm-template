-- CRM Template — full sample dataset.
-- Layered on top of the minimal bootstrap in supabase/seed.sql.
-- Run via:  pnpm db:reset:sample
--
-- Coverage intent:
--   app_role:        Avery admin (seed.sql), Morgan manager, Casey member.
--   account states:  Riley pending (role null), Drew deactivated member.
--   contact_status:  every value has at least two representative rows.
--   documents.kind:  contract, invoice, other (paths only; no objects are
--                    uploaded, so downloads exercise the error-toast path).
--   notifications:   the status updates below fire the contact triggers, so
--                    bells are pre-populated on first sign-in (the superuser
--                    actor is null, which notifies every eligible role).

-- ---------------------------------------------------------------------------
-- Additional auth users (Avery is already bootstrapped in seed.sql)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000000002', 'manager@example.com', '{"full_name":"Morgan Manager"}'),
  ('00000000-0000-4000-8000-000000000003', 'member@example.com',  '{"full_name":"Casey Member"}'),
  ('00000000-0000-4000-8000-000000000004', 'pending@example.com', '{"full_name":"Riley Pending"}'),
  ('00000000-0000-4000-8000-000000000005', 'former@example.com',  '{"full_name":"Drew Former"}')
on conflict (id) do nothing;

update auth.users set
  instance_id            = '00000000-0000-0000-0000-000000000000',
  aud                    = 'authenticated',
  role                   = 'authenticated',
  encrypted_password     = crypt('dev-password', gen_salt('bf')),
  email_confirmed_at     = now(),
  created_at             = now(),
  updated_at             = now(),
  confirmation_token     = '',
  recovery_token         = '',
  email_change_token_new = '',
  email_change           = ''
where id between '00000000-0000-4000-8000-000000000002' and '00000000-0000-4000-8000-000000000005';

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(),
  u.id,
  u.email,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(), now(), now()
from auth.users u
where u.id between '00000000-0000-4000-8000-000000000002' and '00000000-0000-4000-8000-000000000005'
on conflict do nothing;

-- Role assignments (the on_auth_user_created trigger provisioned the profiles
-- with a null role). Riley stays null to demo the /pending flow.
update public.profiles set role = 'manager' where id = '00000000-0000-4000-8000-000000000002';
update public.profiles set role = 'member'  where id = '00000000-0000-4000-8000-000000000003';
update public.profiles set role = 'member', is_active = false
  where id = '00000000-0000-4000-8000-000000000005';

-- ---------------------------------------------------------------------------
-- Contacts (EXAMPLE ENTITY) — every status represented.
-- ---------------------------------------------------------------------------
insert into public.contacts (id, name, company, email, phone, status, notes, created_by) values
  ('10000000-0000-4000-8000-000000000001', 'Ada Lovelace',    'Analytical Engines Ltd', 'ada@analytical.example',    '+1 555 0101', 'lead',   'Met at the spring expo; wants a follow-up demo.', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', 'Grace Hopper',    'Flowmatic Systems',      'grace@flowmatic.example',   '+1 555 0102', 'lead',   null, '00000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000003', 'Alan Turing',     'Bombe Works',            'alan@bombe.example',        '+1 555 0103', 'lead',   'Referred by Ada.', '00000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000004', 'Katherine Johnson', 'Orbital Calc Co',      'katherine@orbital.example', '+1 555 0104', 'active', 'Renewal due Q4.', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000005', 'Margaret Hamilton', 'Apollo Guidance LLC',  'margaret@apollo.example',   '+1 555 0105', 'active', null, '00000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000006', 'Edsger Dijkstra', 'Shortest Path BV',       'edsger@paths.example',      '+31 20 555 0106', 'active', 'Prefers email over calls.', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000007', 'Barbara Liskov',  'Substitution Inc',       'barbara@subst.example',     '+1 555 0107', 'at_risk', 'Support tickets unanswered for two weeks.', '00000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000008', 'Donald Knuth',    'Literate Press',         'don@literate.example',      '+1 555 0108', 'at_risk', 'Evaluating a competitor.', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000009', 'John von Neumann', 'EDVAC Partners',        'john@edvac.example',        '+1 555 0109', 'closed', 'Project completed in March.', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000010', 'Claude Shannon',  'Bit & Boole',            'claude@bitboole.example',   '+1 555 0110', 'closed', null, '00000000-0000-4000-8000-000000000002');

-- Exercise the notification triggers so bells have content: re-state two
-- contacts through status updates (the insert fan-outs above already fired).
update public.contacts set status = 'active'
  where id = '10000000-0000-4000-8000-000000000006' and status <> 'active';
update public.contacts set status = 'at_risk'
  where id = '10000000-0000-4000-8000-000000000007';
update public.contacts set status = 'closed'
  where id = '10000000-0000-4000-8000-000000000009';

-- ---------------------------------------------------------------------------
-- Documents — metadata rows only (no storage objects are seeded, so the
-- download action surfaces the graceful error toast).
-- ---------------------------------------------------------------------------
insert into public.documents (contact_id, kind, storage_path, uploaded_by) values
  ('10000000-0000-4000-8000-000000000004', 'contract', '10000000-0000-4000-8000-000000000004/contract-1700000000000-msa.pdf',     '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000004', 'invoice',  '10000000-0000-4000-8000-000000000004/invoice-1700000000001-2026-04.pdf',  '00000000-0000-4000-8000-000000000002'),
  (null,                                    'other',    'general/other-1700000000002-onboarding-checklist.pdf',                    '00000000-0000-4000-8000-000000000001');
