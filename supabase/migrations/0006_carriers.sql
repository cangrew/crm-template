-- ============================================================================
-- Carriers and their commission economics: rate schedules (what a carrier
-- pays per policy) and CSV mappings (how the carrier's monthly statement
-- columns map onto our statement-import fields).
--
-- Visibility model:
--   * carriers — readable by every provisioned role (tenants must resolve
--     carrier names on their own policies), writable by staff.
--   * rate_schedules / carrier_csv_mappings — staff-only in every direction;
--     carrier economics are not for tenant eyes.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums (values mirror CARRIER_STATUSES / RATE_TYPES / BUSINESS_TYPES in
-- lib/domain/enums.ts)
-- ---------------------------------------------------------------------------
create type public.carrier_status as enum ('active', 'inactive');
create type public.rate_type as enum ('pmpm', 'percent_of_premium');
create type public.business_type as enum ('new_business', 'renewal');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.carriers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.carrier_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per (carrier, business type, effective window[, state]). Values are
-- integer-exact: pmpm_cents for flat per-member-per-month rates, percent_bps
-- (basis points, 0-10000) for percent-of-premium rates. Exactly the column
-- matching rate_type must be populated (enforced below).
create table public.rate_schedules (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references public.carriers (id) on delete cascade,
  rate_type public.rate_type not null,
  business_type public.business_type not null,
  pmpm_cents integer check (pmpm_cents >= 0),
  percent_bps integer check (percent_bps between 0 and 10000),
  effective_from date not null,
  -- NULL means open-ended (still in effect).
  effective_to date,
  -- NULL means the schedule applies in all states.
  state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rate_schedules_value_matches_type check (
    (rate_type = 'pmpm' and pmpm_cents is not null and percent_bps is null)
    or (rate_type = 'percent_of_premium' and percent_bps is not null and pmpm_cents is null)
  )
);

create index idx_rate_schedules_lookup
  on public.rate_schedules (carrier_id, business_type, effective_from);

-- Statement-field -> CSV-header maps used by the upcoming statement importer.
-- header_signature stores the normalized header row so an uploaded CSV can be
-- auto-matched to its carrier mapping.
create table public.carrier_csv_mappings (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references public.carriers (id) on delete cascade,
  name text not null,
  mapping jsonb not null,
  header_signature text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_carrier_csv_mappings_carrier on public.carrier_csv_mappings (carrier_id);

-- ---------------------------------------------------------------------------
-- Triggers — reuse the shared updated_at helper from 0003_agencies_agents.sql.
-- ---------------------------------------------------------------------------
create trigger trg_carriers_updated_at
before update on public.carriers
for each row
execute function public.set_updated_at();

create trigger trg_rate_schedules_updated_at
before update on public.rate_schedules
for each row
execute function public.set_updated_at();

create trigger trg_carrier_csv_mappings_updated_at
before update on public.carrier_csv_mappings
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security
--   carriers: every provisioned role reads (tenants resolve carrier names on
--   their policies); staff create/update; admin deletes.
-- ---------------------------------------------------------------------------
alter table public.carriers enable row level security;

create policy carriers_select on public.carriers
for select to authenticated
using (public.has_role('admin', 'manager', 'agent', 'agency_owner'));

create policy carriers_insert on public.carriers
for insert to authenticated
with check (public.has_role('admin', 'manager'));

create policy carriers_update on public.carriers
for update to authenticated
using (public.has_role('admin', 'manager'))
with check (public.has_role('admin', 'manager'));

create policy carriers_delete on public.carriers
for delete to authenticated
using (public.has_role('admin'));

-- rate_schedules / carrier_csv_mappings: staff-only in every direction,
-- delete admin-only.
alter table public.rate_schedules enable row level security;

create policy rate_schedules_select on public.rate_schedules
for select to authenticated
using (public.has_role('admin', 'manager'));

create policy rate_schedules_insert on public.rate_schedules
for insert to authenticated
with check (public.has_role('admin', 'manager'));

create policy rate_schedules_update on public.rate_schedules
for update to authenticated
using (public.has_role('admin', 'manager'))
with check (public.has_role('admin', 'manager'));

create policy rate_schedules_delete on public.rate_schedules
for delete to authenticated
using (public.has_role('admin'));

alter table public.carrier_csv_mappings enable row level security;

create policy carrier_csv_mappings_select on public.carrier_csv_mappings
for select to authenticated
using (public.has_role('admin', 'manager'));

create policy carrier_csv_mappings_insert on public.carrier_csv_mappings
for insert to authenticated
with check (public.has_role('admin', 'manager'));

create policy carrier_csv_mappings_update on public.carrier_csv_mappings
for update to authenticated
using (public.has_role('admin', 'manager'))
with check (public.has_role('admin', 'manager'));

create policy carrier_csv_mappings_delete on public.carrier_csv_mappings
for delete to authenticated
using (public.has_role('admin'));
