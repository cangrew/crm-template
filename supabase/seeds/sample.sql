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
--   carriers:        active (Ambetter, Oscar) and inactive (Molina); rate
--                    schedules cover both rate types, both business types, an
--                    open-ended window, and a superseded (closed) window; one
--                    CSV mapping with a header signature for the importer.
--   policy_status:   every value represented across the seeded clients,
--                    agents, and carriers; the renewed policy carries an
--                    original_effective_date a year before its effective date.
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

-- Legacy agency/agent resources imported from old_data/resources.json. The
-- client_corrections map is intentionally not imported in this sample pass.
with legacy_agencies (id, name, override_cut_bps) as (
  values
    ('21000000-0000-4000-8000-000000000001'::uuid, 'AAB Insurance', 100),
    ('21000000-0000-4000-8000-000000000002'::uuid, 'Financial Solutions', 125),
    ('21000000-0000-4000-8000-000000000003'::uuid, 'Findway Solutions', 300),
    ('21000000-0000-4000-8000-000000000004'::uuid, 'Infinity Group', 300),
    ('21000000-0000-4000-8000-000000000005'::uuid, 'L&Y Insurance', 100),
    ('21000000-0000-4000-8000-000000000006'::uuid, 'TBD', 300)
)
insert into public.agencies (id, name, status, commission_cut_bps, override_cut_bps, owner_profile_id, notes)
select
  id,
  name,
  'active',
  0,
  override_cut_bps,
  null,
  'Imported from old_data/resources.json; legacy rate stored as override cut.'
from legacy_agencies;

with legacy_agent_company as (
  select *
  from jsonb_each_text(
    '{"Adriana Rosales":"Infinity Group","Adriana Torrealba":"Financial Solutions","Alexis Garcia":"Findway Solutions","Ana Caracas":"AAB Insurance","Anabel Rincon":"L&Y Insurance","Anahys Oliver":"L&Y Insurance","Andrea Prado De Serrano":"Findway Solutions","Andrea Zerpa":"Findway Solutions","Andry Chirinos Delgado":"Findway Solutions","Andry y Anyibi":"Findway Solutions","Andry,Anyibi y Myralvis":"Findway Solutions","Anizabeth Parra":"Infinity Group","Anyibi Chirinos Pararia":"Findway Solutions","Ariana Pena Guerra":"Findway Solutions","Ayme Mena Gonzalez":"Findway Solutions","Barbara Guerra":"Financial Solutions","Bassima Romhain":"Infinity Group","Blanca Molero Villalobos":"Financial Solutions","Boris Gonzalez Perez":"Findway Solutions","Candida castro":"Findway Solutions","Carolina Silva":"Findway Solutions","Cesar Vargas Viracacha":"Financial Solutions","Claudia Mejia":"Financial Solutions","Daniela Hidalgo":"Infinity Group","Darimar Fragiel":"Findway Solutions","Diego Perez Constantine":"Financial Solutions","Dora Chavez":"Findway Solutions","Elisa Alvarez":"Financial Solutions","Fabiana Rojas":"Financial Solutions","Francisco Astudillo-Soto":"Financial Solutions","Francys Loreto":"AAB Insurance","Gabriela Garcia":"L&Y Insurance","Gena Rosario":"Infinity Group","Gerardo Rodriguez":"Infinity Group","Gladys Ponce":"Findway Solutions","Haydee Izquierdo":"Findway Solutions","Indira Leon":"AAB Insurance","Infinity Group":"Infinity Group","Ivonne Leon":"Findway Solutions","Jackson Vasquez Ramirez":"Financial Solutions","Jennifer Medina":"Findway Solutions","Jhanaika Marin":"Infinity Group","Jhoana Tatesauth-Salgado":"Findway Solutions","Jonathan Escobar":"Financial Solutions","Jorge Martin-Lobo":"Financial Solutions","Jose Fazio Ruiz":"Financial Solutions","Josmeira Soto mendoza":"Findway Solutions","Juan Trujillo Talero":"Financial Solutions","Kamal Vina Rincones":"AAB Insurance","Karla Rojas":"Findway Solutions","Kassandra Bernal":"Findway Solutions","Katiuska Tolazzi":"Infinity Group","Kellsmir Fernandez":"Findway Solutions","Leslye Silva Urdaneta":"L&Y Insurance","Lida":"Infinity Group","Livia Lugo":"Findway Solutions","Luis Suarez":"Infinity Group","Luisa Campos":"L&Y Insurance","Manuel Ching Garcia":"Findway Solutions","Maria Colucci":"Financial Solutions","Maria Ronson":"Infinity Group","Mariangela Aviles":"AAB Insurance","Maried Hernandez":"Infinity Group","Marilin Gongora":"Findway Solutions","Marilyn Palomino":"Findway Solutions","Marismely Wilhem":"Infinity Group","Marivin Barboza":"Infinity Group","Marjorie Anaya":"Findway Solutions","Marlim Guerrero":"Findway Solutions","Mary Arango":"Findway Solutions","Maxima Estrella":"AAB Insurance","Michlin Romhain":"Infinity Group","Monica Gomez":"Findway Solutions","Morela Dosrrey":"Findway Solutions","Myralvis Ramirez":"Findway Solutions","Myrian Rios":"Findway Solutions","Nahily Blanque":"Infinity Group","Nancy Lobo-Manrique":"Financial Solutions","Natalia Paredes":"Findway Solutions","Robinson Rodriguez":"Findway Solutions","Rosa Contreras":"AAB Insurance","Roselyn Linares Leon":"TBD","Rosibel Villasana":"Findway Solutions","Runnairy Soto":"Infinity Group","Sandra Ruiz":"Findway Solutions","Sara Mileno":"Findway Solutions","Sonia Espitia":"Findway Solutions","Soto Mendoza,":"Findway Solutions","Stefany Leal Fleitas":"Financial Solutions","Susana Al Choufi":"Infinity Group","Wismerck Martinez":"Financial Solutions","Xioly Calderon":"Financial Solutions","Yadimay balaila":"Findway Solutions","Yadimay Balaila":"Findway Solutions","Yadimay Hernandez-Hernandez":"Findway Solutions","Yamaury Quintero Gomez":"Financial Solutions","Yasmir Olmos":"Findway Solutions","Yenny Quintero Rocha":"Findway Solutions","Yilibeth Diaz":"Financial Solutions","Yilibeth Diaz Rodriguez":"Financial Solutions","Yonny Guerra":"Findway Solutions","Yoycy Barreto":"AAB Insurance","Zoramy M Castillo Perez":"Findway Solutions"}'::jsonb
  ) as t(full_name, agency_name)
),
legacy_agents as (
  select
    full_name,
    agency_name,
    row_number() over (order by full_name) as n
  from legacy_agent_company
),
legacy_agencies (id, name) as (
  values
    ('21000000-0000-4000-8000-000000000001'::uuid, 'AAB Insurance'),
    ('21000000-0000-4000-8000-000000000002'::uuid, 'Financial Solutions'),
    ('21000000-0000-4000-8000-000000000003'::uuid, 'Findway Solutions'),
    ('21000000-0000-4000-8000-000000000004'::uuid, 'Infinity Group'),
    ('21000000-0000-4000-8000-000000000005'::uuid, 'L&Y Insurance'),
    ('21000000-0000-4000-8000-000000000006'::uuid, 'TBD')
)
insert into public.agents (id, full_name, email, npn, status, agency_id, commission_split_bps, profile_id)
select
  ('31000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  full_name,
  null,
  null,
  'active',
  legacy_agencies.id,
  8000,
  null
from legacy_agents
join legacy_agencies on legacy_agencies.name = legacy_agents.agency_name;

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
-- Carriers — imported from old_data/carriers.json while preserving the IDs
-- referenced by the sample policies below.
-- ---------------------------------------------------------------------------
insert into public.carriers (id, name, status, notes) values
  ('40000000-0000-4000-8000-000000000001', 'Ambetter', 'active', 'Imported from old_data/carriers.json; full legacy statement-import settings are preserved on the CSV mapping.'),
  ('40000000-0000-4000-8000-000000000002', 'Oscar', 'active', 'Imported from old_data/carriers.json; full legacy statement-import settings are preserved on the CSV mapping.'),
  ('40000000-0000-4000-8000-000000000003', 'Molina Healthcare', 'active', 'Imported from old_data/carriers.json; full legacy statement-import settings are preserved on the CSV mapping.'),
  ('40000000-0000-4000-8000-000000000004', 'Aetna HFI', 'active', 'Imported from old_data/carriers.json; full legacy statement-import settings are preserved on the CSV mapping.'),
  ('40000000-0000-4000-8000-000000000005', 'Cigna', 'active', 'Imported from old_data/carriers.json; full legacy statement-import settings are preserved on the CSV mapping.'),
  ('40000000-0000-4000-8000-000000000006', 'United Healthcare', 'active', 'Imported from old_data/carriers.json; full legacy statement-import settings are preserved on the CSV mapping.'),
  ('40000000-0000-4000-8000-000000000007', 'AmeriHealth', 'active', 'Imported from old_data/carriers.json; full legacy statement-import settings are preserved on the CSV mapping.');

-- ---------------------------------------------------------------------------
-- Rate schedules — Ambetter pays flat PMPM (with a superseded 2025 window),
-- Oscar pays percent of premium. All open-ended from 2026-01-01 except the
-- closed 2025 Ambetter window.
-- ---------------------------------------------------------------------------
insert into public.rate_schedules (id, carrier_id, rate_type, business_type, pmpm_cents, percent_bps, effective_from, effective_to, state) values
  ('41000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'pmpm',               'new_business', 2200, null, '2026-01-01', null,         null),
  ('41000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', 'pmpm',               'renewal',      1100, null, '2026-01-01', null,         null),
  ('41000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000002', 'percent_of_premium', 'new_business', null, 500,  '2026-01-01', null,         null),
  ('41000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000002', 'percent_of_premium', 'renewal',      null, 300,  '2026-01-01', null,         null),
  ('41000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000001', 'pmpm',               'new_business', 2000, null, '2025-01-01', '2025-12-31', null);

-- ---------------------------------------------------------------------------
-- Carrier CSV mappings — simple parser-ready mappings plus the complete
-- legacy source configuration from old_data/carriers.json.
-- ---------------------------------------------------------------------------
insert into public.carrier_csv_mappings (id, carrier_id, name, mapping, header_signature, source_config) values
  ('42000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'Ambetter legacy statement', '{"amount":"Total","member_count":"Number of Members"}'::jsonb, null, '{"name":"Ambetter","displayName":"Ambetter","headerRow":5,"sheetIndex":0,"filterColumn":"GA NAME","filterValue":"Grand Total","columnMap":{"gaName":"GA NAME","statement":"Policy Effective Date","customerName":["Insured First Name","Insured Last Name"],"subscriber":"Number of Members","agentName":"Agent Name","amount":"Total"},"divisor":3}'::jsonb),
  ('42000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'Oscar legacy statement', '{"carrier_member_id":"Member ID","subscriber_name":"Subscriber name","amount":"Total"}'::jsonb, null, '{"name":"Oscar","displayName":"Oscar","headerRow":5,"sheetIndex":0,"filterColumn":"GA NAME","filterValue":"Grand Total","columnMap":{"gaName":"GA NAME","statement":"Commission month","customerId":"Member ID","customerName":"Subscriber name","agentName":"Producer name","amount":"Total"},"divisor":3}'::jsonb),
  ('42000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 'Molina Healthcare legacy statement', '{"carrier_member_id":"Subscriber ID","member_count":"Member Count"}'::jsonb, null, '{"name":"Molina","displayName":"Molina Healthcare","headerRow":5,"sheetIndex":0,"filterColumn":"GA Name","filterValue":"Grand Total","columnMap":{"gaName":"GA Name","customerId":"Subscriber ID","customerName":["Subcriber First Name","Subcriber Last Name"],"memberCount":"Member Count"},"divisor":3}'::jsonb),
  ('42000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000004', 'Aetna HFI legacy statement', '{"carrier_member_id":"Customer Number","subscriber_name":"Customer Name"}'::jsonb, null, '{"name":"Aetna_HFI","displayName":"Aetna HFI","headerRow":4,"sheetIndex":0,"agentColumnStart":"Andrea Zerpa-Romero","agentColumnEnd":"Wismerck Martinez","filterColumn":"GA Name","filterValue":"Grand Total","columnMap":{"gaName":"GA Name","statement":"Statement","customerId":"Customer Number","customerName":"Customer Name","date":"DATE","subscriber":"SUBSCRIBER"},"divisor":3}'::jsonb),
  ('42000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000005', 'Cigna legacy statement', '{"carrier_member_id":"Subscriber ID","subscriber_name":"Customer Name","member_count":"Member Count"}'::jsonb, null, '{"name":"Cigna","displayName":"Cigna","headerRow":4,"sheetIndex":0,"filterColumn":"Statement Date","filterValue":"Grand Total","columnMap":{"gaName":"GA NAME","statement":"Statement Date","customerId":"Subscriber ID","customerName":"Customer Name","date":"Policy Period","subscriber":"Member Count"},"divisor":4}'::jsonb),
  ('42000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000006', 'United Healthcare legacy statement', '{"subscriber_name":"Member Name","policy_number":"Policy Number"}'::jsonb, null, '{"name":"UHC","displayName":"United Healthcare","headerRow":5,"sheetIndex":0,"filterColumn":"GA Name","filterValue":"Grand Total","columnMap":{"gaName":"GA Name","statement":"Payment Period","customerId":"Policy Number","customerName":"Member Name"},"divisor":4}'::jsonb),
  ('42000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000007', 'AmeriHealth legacy statement', '{}'::jsonb, null, '{"name":"Amerihealth","displayName":"AmeriHealth","headerRow":5,"sheetIndex":0,"filterColumn":"GA Name","filterValue":"Grand Total","columnMap":{"gaName":"GA Name","statement":"Premium Period","customerName":["Member First Name","Member Last Name"]},"divisor":4}'::jsonb);

-- ---------------------------------------------------------------------------
-- Policies — every status represented, spread across the seeded clients,
-- agents (Casey, Harper, Devon), and carriers. The renewed policy's
-- original_effective_date sits a year before its effective date; new business
-- carries original_effective_date = effective_date.
-- ---------------------------------------------------------------------------
insert into public.policies (id, client_id, carrier_id, agent_id, policy_number, carrier_member_id, plan_name, status, member_count, monthly_premium_cents, effective_date, effectuated_at, termination_date, original_effective_date, notes, created_by) values
  ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
   'AMB-2026-0001', 'U7100231', 'Ambetter Balanced Care 11', 'active', 2, 78000, '2026-01-01', '2026-01-04', null, '2026-01-01', null, '00000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001',
   'OSC-2026-0114', 'OSC88412', 'Oscar Bronze Classic', 'active', 1, 42000, '2026-02-01', '2026-02-03', null, '2026-02-01', null, '00000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002',
   'AMB-2026-0042', 'U7100977', 'Ambetter Complete Silver', 'grace', 3, 95000, '2026-01-01', '2026-01-09', null, '2026-01-01', 'Missed the May premium; in the grace window.', '00000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002',
   'OSC-2026-0287', 'OSC90233', 'Oscar Silver Saver', 'lapsed', 1, 51000, '2026-01-01', '2026-01-06', null, '2026-01-01', 'Grace period exhausted in April.', '00000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003',
   null, null, 'Ambetter Everyday Bronze', 'draft', 2, 64000, '2026-07-01', null, null, '2026-07-01', 'Quoting; waiting on income verification.', '00000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003',
   'MOL-2026-0033', 'MHC55102', 'Molina Core Care Select', 'cancelled', 1, 35000, '2026-01-01', null, '2026-02-28', '2026-01-01', 'Cancelled before effectuation; member moved out of state.', '00000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001',
   'OSC-2026-0501', 'OSC91488', 'Oscar Gold Family', 'submitted', 4, 120000, '2026-06-01', null, null, '2026-06-01', 'Family add-on application pending carrier review.', '00000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
   'AMB-2025-0918', 'U7099812', 'Ambetter Balanced Care 4', 'renewed', 1, 39000, '2026-01-01', '2026-01-02', null, '2025-01-01', 'Renewal of the 2025 plan; pays the renewal PMPM rate.', '00000000-0000-4000-8000-000000000001');

-- ---------------------------------------------------------------------------
-- Documents — metadata rows only (no storage objects are seeded, so the
-- download action surfaces the graceful error toast).
-- ---------------------------------------------------------------------------
insert into public.documents (client_id, kind, storage_path, uploaded_by) values
  ('10000000-0000-4000-8000-000000000001', 'contract', '10000000-0000-4000-8000-000000000001/contract-1700000000000-policy.pdf',  '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000001', 'invoice',  '10000000-0000-4000-8000-000000000001/invoice-1700000000001-2026-04.pdf',  '00000000-0000-4000-8000-000000000002'),
  (null,                                    'other',    'general/other-1700000000002-onboarding-checklist.pdf',                    '00000000-0000-4000-8000-000000000001');
