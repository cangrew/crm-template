-- ============================================================================
-- Carrier commission statements: the import staging area. A statement is one
-- uploaded carrier CSV for one (carrier, period); its lines are the parsed
-- rows awaiting policy matching and posting to the ledger (0009).
--
-- Visibility model: BOTH tables (and the raw-CSV storage bucket) are
-- staff-only in every direction. Statements carry other agents' production
-- and the carrier's full economics — tenants never see raw statements; their
-- view of commissions is the ledger (0009), which scopes per payee.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums (values mirror STATEMENT_STATUSES / LINE_KINDS / MATCH_STATUSES in
-- lib/domain/enums.ts)
-- ---------------------------------------------------------------------------
create type public.statement_status as enum ('draft', 'matching', 'posted', 'void');
create type public.line_kind as enum ('commission', 'override', 'adjustment');
create type public.match_status as enum (
  'unmatched',
  'auto_matched',
  'manual_matched',
  'ignored'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
-- line_count / total_amount_cents are denormalized rollups maintained by
-- public.post_statement (0009); they stay 0 while the statement is in staging.
create table public.commission_statements (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references public.carriers (id) on delete restrict,
  -- First day of the commission month the statement covers.
  period_month date not null,
  status public.statement_status not null default 'draft',
  -- Raw CSV retained for audit; null until uploaded.
  storage_path text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  line_count integer not null default 0,
  total_amount_cents bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_commission_statements_carrier_period
  on public.commission_statements (carrier_id, period_month);

-- One parsed CSV row. `raw` keeps the original row verbatim for audit; the
-- parsed columns are nullable because carrier files are messy. amount_cents
-- is signed — negative means chargeback. matched_policy_id + match_status +
-- match_reason record the exception-flow resolution; posted flips when the
-- line's ledger entries are written (see public.post_statement in 0009).
create table public.statement_lines (
  id uuid primary key default gen_random_uuid(),
  statement_id uuid not null references public.commission_statements (id) on delete cascade,
  row_index integer not null,
  raw jsonb not null,
  policy_number text,
  carrier_member_id text,
  subscriber_name text,
  subscriber_dob date,
  member_count integer,
  premium_cents integer,
  amount_cents integer not null,
  line_kind public.line_kind not null default 'commission',
  business_type public.business_type,
  match_status public.match_status not null default 'unmatched',
  matched_policy_id uuid references public.policies (id) on delete set null,
  match_reason text,
  posted boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_statement_lines_statement on public.statement_lines (statement_id);
create index idx_statement_lines_match on public.statement_lines (statement_id, match_status);

-- ---------------------------------------------------------------------------
-- Triggers — reuse the shared updated_at helper from 0003_agencies_agents.sql.
-- ---------------------------------------------------------------------------
create trigger trg_commission_statements_updated_at
before update on public.commission_statements
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security: staff-only in every direction, delete admin-only.
-- ---------------------------------------------------------------------------
alter table public.commission_statements enable row level security;

create policy commission_statements_select on public.commission_statements
for select to authenticated
using (public.has_role('admin', 'manager'));

create policy commission_statements_insert on public.commission_statements
for insert to authenticated
with check (public.has_role('admin', 'manager'));

create policy commission_statements_update on public.commission_statements
for update to authenticated
using (public.has_role('admin', 'manager'))
with check (public.has_role('admin', 'manager'));

create policy commission_statements_delete on public.commission_statements
for delete to authenticated
using (public.has_role('admin'));

alter table public.statement_lines enable row level security;

create policy statement_lines_select on public.statement_lines
for select to authenticated
using (public.has_role('admin', 'manager'));

create policy statement_lines_insert on public.statement_lines
for insert to authenticated
with check (public.has_role('admin', 'manager'));

create policy statement_lines_update on public.statement_lines
for update to authenticated
using (public.has_role('admin', 'manager'))
with check (public.has_role('admin', 'manager'));

create policy statement_lines_delete on public.statement_lines
for delete to authenticated
using (public.has_role('admin'));

-- ---------------------------------------------------------------------------
-- Storage: a private bucket for the raw carrier CSVs (audit copies). Same
-- signed-URL pattern as the documents bucket (0005), but ALL access — read
-- and write — is staff-only: raw statements expose other books' production.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('statements', 'statements', false)
on conflict (id) do nothing;

create policy "statements bucket read" on storage.objects
for select to authenticated
using (bucket_id = 'statements' and public.has_role('admin', 'manager'));

create policy "statements bucket insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'statements' and public.has_role('admin', 'manager'));

create policy "statements bucket update" on storage.objects
for update to authenticated
using (bucket_id = 'statements' and public.has_role('admin', 'manager'))
with check (bucket_id = 'statements' and public.has_role('admin', 'manager'));

create policy "statements bucket delete" on storage.objects
for delete to authenticated
using (bucket_id = 'statements' and public.has_role('admin', 'manager'));
