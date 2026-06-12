# Phase 5 — Payouts, reconciliation, dashboard (remaining work)

The final phase of the Findway build plan. Phases 0–4 are complete on this
branch: rebrand, roles/hierarchy (agencies/agents + `can_access_agent` RLS),
clients/carriers/rate-schedules/policies, the commission engine
(`lib/domain/commission-engine.ts`), and the statement import wizard with the
engine-backed posting route (`app/api/statements/[id]/post/route.ts`) writing
the append-only ledger via the `post_statement` RPC.

Everything Phase 5 needs already exists below the UI:

- **Ledger reads:** `useLedgerByAgent/Agency/Policy/Period` (lib/data/hooks.ts);
  RLS already scopes tenants (agents see their `payee_type='agent'` rows,
  owners see their agency's non-house rows, staff see all) — the same
  components serve staff and tenants, RLS narrows the data.
- **Payout statements:** `payout_statements` table (0009) with payee-shape
  check + status lifecycle `open → finalized → paid`; hooks
  `usePayoutStatements`, `useCreatePayoutStatement`, `useUpdatePayoutStatus`,
  `useDeletePayoutStatement`. Assigning entries to a payout statement means
  setting `ledger_entries.payout_statement_id` — note the ledger has NO update
  policy, so assignment needs a new security-definer RPC (see task 2).
- **Reconciliation math:** `pickRate` + `expectedCommissionCents`
  (lib/domain/rates.ts) against `useRateSchedulesByCarrier`.
- **Domain enums/tones/schemas:** `PAYOUT_STATUSES`, `payoutTone`,
  `payoutStatementInsertSchema` all in place; `payouts` resource already in
  the `can()` matrix (staff CRU/admin delete, tenants read) and `/payouts` is
  an open route (all provisioned roles).
- **Notifications:** the `payout_finalized` notification type exists in the
  enum and `lib/domain/notifications.ts` (audience: all roles, entity route
  `/payouts`). There is no per-user notify helper yet — `notify_roles` fans
  out by role, which would leak payout events to every tenant. See task 4.

## Tasks

1. **/payouts page** (`app/(app)/payouts/page.tsx` + components/payouts/):
   nav entry in the existing "Commissions" group (icon: Wallet). Period picker
   (`<input type="month">`, default latest ledger period) → grouped totals per
   payee from `useLedgerByPeriod` (group non-house entries by
   `payee_type`+`agent_id`/`agency_id`; resolve names via useAgents/useAgencies;
   columns: Payee, Entries, Total `fmtMoneyCents(cents/100)`, payout status if a
   payout statement exists for that payee+period). Staff get a "Finalize"
   action per row; tenants just see their own rows (RLS). CSV export of the
   visible rows via `lib/design/download.ts`.
2. **Finalize flow:** new migration `0010_payout_assignment.sql` with a
   security-definer RPC `finalize_payout(p_payee_type, p_agent_id, p_agency_id,
p_period_month)` (staff guard like `post_statement`): creates the
   payout_statements row (or reuses an existing `open` one), stamps
   `payout_statement_id` on all matching unassigned non-house ledger entries
   (direct UPDATE inside the definer — RLS has no update policy, which is the
   point), rolls up `total_cents`, sets status `finalized`. Add `Functions`
   entry to the hand-maintained `lib/supabase/database.types.ts`, a data fn +
   hook (invalidate payouts + ledger), and pgTAP coverage in a new
   `payouts_test.sql` (staff-only guard, totals exact, tenant visibility,
   deactivated user sees nothing — follow `supabase/tests/ledger_test.sql`).
   "Mark paid" is a plain status update via `useUpdatePayoutStatus`.
3. **Reconciliation view** (suggested: a tab or section on `/statements/[id]`
   or a `/payouts/reconciliation` page): per matched line compare
   `amount_cents` against `expectedCommissionCents(pickRate(...), {memberCount,
premiumCents})` using the policy's `original_effective_date` vs
   `effective_date` to choose new_business/renewal and the statement's
   `period_month`. Flag variance rows. Pure helper + unit tests in
   `lib/domain/` first (TDD).
4. **Payee notifications:** add a `notify_user(p_user_id, ...)` SQL helper in
   migration 0010 (mirror `notify_roles` in 0002 but targeting one profile,
   honoring `notification_preferences`), call it from `finalize_payout` for the
   payee's linked profile (`agents.profile_id` / `agencies.owner_profile_id`,
   skip when null). Keep `payout_finalized` audience metadata in
   `lib/domain/notifications.ts` consistent.
5. **Dashboard** (`app/(app)/page.tsx`): replace the client-only stub with
   StatCards: active policies + covered members (usePolicies), MTD commission
   (useLedgerByPeriod for the current month, summing the viewer-visible rows —
   RLS makes this per-role automatically), unmatched lines across draft
   statements (staff only). Update `app/(app)/page.test.tsx`.
6. **E2E:** `e2e/payouts.spec.ts` smoke following the bypass-mode chrome
   pattern in `e2e/clients.spec.ts`.

## Verification

`pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`,
`pnpm build`; pgTAP (`pnpm db:test`) needs Docker — CI's `rls` job runs it.
After migration 0010, regenerate types with `pnpm db:types` against a local
stack (the file is hand-maintained in its absence). Conventions per
`.claude/rules/development-conventions.md` (TDD, conventional commits).

Delete this file when Phase 5 lands.
