-- Findway — full sample dataset.
-- Layered on top of the minimal bootstrap in supabase/seed.sql.
-- Run via:  pnpm db:reset:sample
--
-- Coverage intent:
--   app_role:        Avery admin (seed.sql), Morgan manager, Casey agent,
--                    Quinn agency owner.
--   account states:  Riley pending (role null), Drew deactivated agent.
--   client_status:   every value has at least two representative rows; books
--                    span Casey, Harper, Devon, and unassigned (house).
--   documents.kind:  contract, invoice, other (paths only; no objects are
--                    uploaded, so downloads exercise the error-toast path).
--   notifications:   the client inserts below fire the client_created trigger,
--                    so bells are pre-populated on first sign-in (the superuser
--                    actor is null, which notifies every eligible staff role).

-- ---------------------------------------------------------------------------
-- Additional auth users (Avery is already bootstrapped in seed.sql)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000000002', 'manager@example.com', '{"full_name":"Morgan Manager"}'),
  ('00000000-0000-4000-8000-000000000003', 'agent@example.com',   '{"full_name":"Casey Agent"}'),
  ('00000000-0000-4000-8000-000000000004', 'pending@example.com', '{"full_name":"Riley Pending"}'),
  ('00000000-0000-4000-8000-000000000005', 'former@example.com',  '{"full_name":"Drew Former"}'),
  ('00000000-0000-4000-8000-000000000006', 'owner@example.com',   '{"full_name":"Quinn Owner"}')
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
where id between '00000000-0000-4000-8000-000000000002' and '00000000-0000-4000-8000-000000000006';

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(),
  u.id,
  u.email,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(), now(), now()
from auth.users u
where u.id between '00000000-0000-4000-8000-000000000002' and '00000000-0000-4000-8000-000000000006'
on conflict do nothing;

-- Role assignments (the on_auth_user_created trigger provisioned the profiles
-- with a null role). Riley stays null to demo the /pending flow.
update public.profiles set role = 'manager' where id = '00000000-0000-4000-8000-000000000002';
update public.profiles set role = 'agent'   where id = '00000000-0000-4000-8000-000000000003';
update public.profiles set role = 'agent', is_active = false
  where id = '00000000-0000-4000-8000-000000000005';
update public.profiles set role = 'agency_owner'
  where id = '00000000-0000-4000-8000-000000000006';

-- ---------------------------------------------------------------------------
-- Hierarchy: Quinn owns Harbor Insurance Group; Casey writes under it. A
-- second agency and a direct (house) agent cover the remaining shapes.
-- ---------------------------------------------------------------------------
insert into public.agencies (id, name, status, commission_cut_bps, override_cut_bps, owner_profile_id, notes) values
  ('20000000-0000-4000-8000-000000000001', 'Harbor Insurance Group', 'active', 5000, 3000,
   '00000000-0000-4000-8000-000000000006', 'Quinn''s sub-agency; 50% commission cut, 30% override cut.'),
  ('20000000-0000-4000-8000-000000000002', 'Beacon Benefits LLC', 'active', 4000, 2500, null, null);

insert into public.agents (id, full_name, email, npn, status, agency_id, commission_split_bps, profile_id) values
  ('30000000-0000-4000-8000-000000000001', 'Casey Agent',  'agent@example.com', '11110001', 'active',
   '20000000-0000-4000-8000-000000000001', 8000, '00000000-0000-4000-8000-000000000003'),
  ('30000000-0000-4000-8000-000000000002', 'Harper Writer', 'harper@harbor.example', '11110002', 'active',
   '20000000-0000-4000-8000-000000000001', 7500, null),
  ('30000000-0000-4000-8000-000000000003', 'Devon House',  'devon@findway.example', '11110003', 'active',
   null, 8500, null),
  ('30000000-0000-4000-8000-000000000004', 'Blake Former', 'blake@beacon.example', '11110004', 'terminated',
   '20000000-0000-4000-8000-000000000002', 7000, null);

-- ---------------------------------------------------------------------------
-- Clients — every status represented, spread across the seeded agents
-- (Casey, Harper, Devon) with a couple unassigned (house) rows. Each insert
-- fires the client_created notification trigger (staff-only fan-out).
-- ---------------------------------------------------------------------------
insert into public.clients (id, first_name, last_name, dob, email, phone, address, status, agent_id, notes, created_by) values
  ('10000000-0000-4000-8000-000000000001', 'Maria',  'Alvarez',   '1957-03-14', 'maria.alvarez@example.com',   '+1 555 0101', '210 Palm Ave, Miami, FL',        'active',   '30000000-0000-4000-8000-000000000001', 'Medicare Advantage; renewal due Q4.', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', 'James',  'Whitfield', '1949-11-02', 'james.whitfield@example.com', '+1 555 0102', '88 Lakeshore Dr, Tampa, FL',     'active',   '30000000-0000-4000-8000-000000000001', null, '00000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000003', 'Lucia',  'Fernandez', '1962-07-21', 'lucia.fernandez@example.com', '+1 555 0103', '14 Coral Way, Hialeah, FL',      'prospect', '30000000-0000-4000-8000-000000000002', 'Turning 65 in August; follow up before AEP.', '00000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000004', 'Robert', 'Chen',      '1955-01-30', 'robert.chen@example.com',     '+1 555 0104', '501 Bayview St, Orlando, FL',    'active',   '30000000-0000-4000-8000-000000000002', null, '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000005', 'Yvonne', 'Baptiste',  '1968-09-09', 'yvonne.baptiste@example.com', '+1 555 0105', '77 Magnolia Ct, Fort Lauderdale, FL', 'prospect', '30000000-0000-4000-8000-000000000003', 'Referred by Maria Alvarez.', '00000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000006', 'Harold', 'Nakamura',  '1946-05-17', 'harold.nakamura@example.com', '+1 555 0106', '3 Seabreeze Ln, Sarasota, FL',   'inactive', '30000000-0000-4000-8000-000000000003', 'Moved out of state; plan terminated.', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000007', 'Denise', 'Okafor',    '1971-12-05', 'denise.okafor@example.com',   '+1 555 0107', '940 Cypress Rd, Jacksonville, FL', 'prospect', null, 'Walk-in lead; not yet assigned to an agent.', '00000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000008', 'Frank',  'Delgado',   '1953-08-26', 'frank.delgado@example.com',   '+1 555 0108', '12 Harbor View Blvd, St. Petersburg, FL', 'inactive', null, 'Lapsed last year; re-engage during AEP.', '00000000-0000-4000-8000-000000000001');

-- ---------------------------------------------------------------------------
-- Documents — metadata rows only (no storage objects are seeded, so the
-- download action surfaces the graceful error toast).
-- ---------------------------------------------------------------------------
insert into public.documents (client_id, kind, storage_path, uploaded_by) values
  ('10000000-0000-4000-8000-000000000001', 'contract', '10000000-0000-4000-8000-000000000001/contract-1700000000000-policy.pdf',  '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000001', 'invoice',  '10000000-0000-4000-8000-000000000001/invoice-1700000000001-2026-04.pdf',  '00000000-0000-4000-8000-000000000002'),
  (null,                                    'other',    'general/other-1700000000002-onboarding-checklist.pdf',                    '00000000-0000-4000-8000-000000000001');
