-- ============================================================================
-- The commission ledger — APPEND-ONLY. Every row is one payee's share of one
-- statement line, snapshotted at post time by public.post_statement. Rows are
-- NEVER updated or deleted: corrections are reversal inserts, and voiding a
-- posted statement inserts offsetting rows (public.void_statement). This is
-- the only money table tenants can see, scoped per payee by RLS.
--
-- Entry shape mirrors LedgerEntryDraft in lib/domain/commission-engine.ts:
-- every entry carries the producing agent's agent_id and (when agency-bound)
-- agency_id, so an agency owner sees their agents' production through the
-- agency_id column. House rows are excluded from tenant reads — Findway's
-- residual economics are not for tenant eyes.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums (values mirror LEDGER_ENTRY_KINDS / PAYEE_TYPES / PAYOUT_STATUSES in
-- lib/domain/enums.ts; entry kinds mirror commission-engine.ts)
-- ---------------------------------------------------------------------------
create type public.ledger_entry_kind as enum (
  'agent_commission',
  'agency_commission',
  'house_commission',
  'agency_override',
  'house_override'
);
create type public.payee_type as enum ('agent', 'agency', 'house');
create type public.payout_status as enum ('open', 'finalized', 'paid');

-- ---------------------------------------------------------------------------
-- payout_statements — created FIRST: ledger entries reference it. One row per
-- (payee, month) payout run; total_cents is rolled up when entries are
-- assigned. No 'house' payout statements exist — the house keeps its
-- remainder, it is never paid out.
-- ---------------------------------------------------------------------------
create table public.payout_statements (
  id uuid primary key default gen_random_uuid(),
  payee_type public.payee_type not null,
  agent_id uuid references public.agents (id) on delete restrict,
  agency_id uuid references public.agencies (id) on delete restrict,
  period_month date not null,
  status public.payout_status not null default 'open',
  total_cents bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payout_statements_payee_shape check (
    (payee_type = 'agent' and agent_id is not null and agency_id is null)
    or (payee_type = 'agency' and agency_id is not null and agent_id is null)
  )
);

create index idx_payout_statements_payee_period
  on public.payout_statements (payee_type, period_month);

create trigger trg_payout_statements_updated_at
before update on public.payout_statements
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ledger_entries — APPEND-ONLY: corrections are reversal inserts, never
-- updates; voiding a posted statement inserts offsetting rows. No updated_at
-- by design. applied_bps snapshots the cut in force at post time (audit);
-- null for house residual entries.
-- ---------------------------------------------------------------------------
create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  statement_line_id uuid not null references public.statement_lines (id) on delete restrict,
  policy_id uuid not null references public.policies (id) on delete restrict,
  entry_kind public.ledger_entry_kind not null,
  payee_type public.payee_type not null,
  agent_id uuid references public.agents (id) on delete restrict,
  agency_id uuid references public.agencies (id) on delete restrict,
  amount_cents integer not null,
  applied_bps integer check (applied_bps between 0 and 10000),
  period_month date not null,
  payout_statement_id uuid references public.payout_statements (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_ledger_entries_agent on public.ledger_entries (agent_id);
create index idx_ledger_entries_agency on public.ledger_entries (agency_id);
create index idx_ledger_entries_policy on public.ledger_entries (policy_id);
create index idx_ledger_entries_payee_period on public.ledger_entries (payee_type, period_month);
create index idx_ledger_entries_payout on public.ledger_entries (payout_statement_id);

-- ---------------------------------------------------------------------------
-- ledger_entries RLS. Select: staff see all; an agent sees exactly their own
-- shares (payee 'agent' rows bearing their agent_id — the engine also stamps
-- agent_id on agency and house rows for tracing, and those must NOT leak the
-- agency's or Findway's economics to the agent); an agency owner sees every
-- non-house row bearing their agency_id (the agency's cuts AND their agents'
-- shares). House rows are staff-only.
--
-- NO insert/update/delete policies for ANY role — writes happen exclusively
-- inside the security-definer RPCs below, so with RLS enabled every direct
-- write is denied. Keep it that way.
-- ---------------------------------------------------------------------------
alter table public.ledger_entries enable row level security;

create policy ledger_entries_select on public.ledger_entries
for select to authenticated
using (
  public.has_role('admin', 'manager')
  or (payee_type = 'agent' and agent_id = public.current_agent_id())
  or (
    payee_type <> 'house'
    and agency_id is not null
    and agency_id = public.current_agency_id()
  )
);

-- ---------------------------------------------------------------------------
-- payout_statements RLS: staff manage; a payee reads their own statements;
-- delete is admin-only and only while still open (finalized/paid payout runs
-- are part of the money audit trail).
-- ---------------------------------------------------------------------------
alter table public.payout_statements enable row level security;

create policy payout_statements_select on public.payout_statements
for select to authenticated
using (
  public.has_role('admin', 'manager')
  or (payee_type = 'agent' and agent_id = public.current_agent_id())
  or (payee_type = 'agency' and agency_id = public.current_agency_id())
);

create policy payout_statements_insert on public.payout_statements
for insert to authenticated
with check (public.has_role('admin', 'manager'));

create policy payout_statements_update on public.payout_statements
for update to authenticated
using (public.has_role('admin', 'manager'))
with check (public.has_role('admin', 'manager'));

create policy payout_statements_delete on public.payout_statements
for delete to authenticated
using (public.has_role('admin') and status = 'open');

-- ---------------------------------------------------------------------------
-- post_statement(p_statement_id, p_entries): atomically post a statement.
-- p_entries is the engine's allocation output (one element per ledger row):
--   [{ statement_line_id, policy_id, entry_kind, payee_type, agent_id,
--      agency_id, amount_cents, applied_bps, period_month }, ...]
-- SECURITY DEFINER because ledger_entries deliberately has no insert policy;
-- the explicit staff guard inside is therefore mandatory.
-- ---------------------------------------------------------------------------
create or replace function public.post_statement(p_statement_id uuid, p_entries jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.statement_status;
  v_bad bigint;
begin
  if not public.has_role('admin', 'manager') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Lock the statement so concurrent posts serialize on the status check.
  select status into v_status
  from public.commission_statements
  where id = p_statement_id
  for update;

  if not found then
    raise exception 'statement % does not exist', p_statement_id;
  end if;
  if v_status not in ('draft', 'matching') then
    raise exception 'statement % is not postable (status: %)', p_statement_id, v_status;
  end if;

  -- Every entry must point at an unposted line of THIS statement.
  select count(*) into v_bad
  from jsonb_to_recordset(p_entries) as e(statement_line_id uuid)
  where not exists (
    select 1
    from public.statement_lines l
    where l.id = e.statement_line_id
      and l.statement_id = p_statement_id
      and not l.posted
  );
  if v_bad > 0 then
    raise exception '% entries do not reference unposted lines of statement %',
      v_bad, p_statement_id;
  end if;

  insert into public.ledger_entries
    (statement_line_id, policy_id, entry_kind, payee_type, agent_id, agency_id,
     amount_cents, applied_bps, period_month)
  select
    e.statement_line_id, e.policy_id, e.entry_kind, e.payee_type, e.agent_id,
    e.agency_id, e.amount_cents, e.applied_bps, e.period_month
  from jsonb_to_recordset(p_entries) as e(
    statement_line_id uuid,
    policy_id uuid,
    entry_kind public.ledger_entry_kind,
    payee_type public.payee_type,
    agent_id uuid,
    agency_id uuid,
    amount_cents integer,
    applied_bps integer,
    period_month date
  );

  update public.statement_lines l
  set posted = true
  where l.statement_id = p_statement_id
    and l.id in (
      select e.statement_line_id
      from jsonb_to_recordset(p_entries) as e(statement_line_id uuid)
    );

  update public.commission_statements s
  set status = 'posted',
      line_count = (
        select count(*) from public.statement_lines l where l.statement_id = s.id
      ),
      total_amount_cents = coalesce(
        (select sum(l.amount_cents) from public.statement_lines l where l.statement_id = s.id),
        0
      )
  where s.id = p_statement_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- void_statement(p_statement_id): admin-only reversal of a posted statement.
-- Inserts one exact negation per existing ledger entry tied to the
-- statement's lines (same keys, applied_bps, period_month; negated
-- amount_cents), flips the lines back to unposted, and marks the statement
-- void. Double-voiding is impossible: the status check rejects anything that
-- is not currently 'posted'.
-- ---------------------------------------------------------------------------
create or replace function public.void_statement(p_statement_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.statement_status;
begin
  if not public.has_role('admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select status into v_status
  from public.commission_statements
  where id = p_statement_id
  for update;

  if not found then
    raise exception 'statement % does not exist', p_statement_id;
  end if;
  if v_status <> 'posted' then
    raise exception 'statement % is not voidable (status: %)', p_statement_id, v_status;
  end if;

  insert into public.ledger_entries
    (statement_line_id, policy_id, entry_kind, payee_type, agent_id, agency_id,
     amount_cents, applied_bps, period_month)
  select
    le.statement_line_id, le.policy_id, le.entry_kind, le.payee_type,
    le.agent_id, le.agency_id, -le.amount_cents, le.applied_bps, le.period_month
  from public.ledger_entries le
  where le.statement_line_id in (
    select l.id from public.statement_lines l where l.statement_id = p_statement_id
  );

  update public.statement_lines
  set posted = false
  where statement_id = p_statement_id;

  update public.commission_statements
  set status = 'void'
  where id = p_statement_id;
end;
$$;

-- The internal guards (42501) are the authorization layer; anon never executes.
revoke execute on function public.post_statement(uuid, jsonb) from public, anon;
revoke execute on function public.void_statement(uuid) from public, anon;
grant execute on function public.post_statement(uuid, jsonb) to authenticated, service_role;
grant execute on function public.void_statement(uuid) to authenticated, service_role;
