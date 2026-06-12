/**
 * Canonical domain enums. Values are stable snake_case identifiers shared by
 * the Postgres enum types, the zod schemas, and the UI. Human-readable display
 * labels live in the *_LABELS maps so display text never leaks into stored data.
 */

export const APP_ROLES = ["admin", "manager", "agent", "agency_owner"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  manager: "Manager",
  agent: "Agent",
  agency_owner: "Agency Owner",
};

/* agencies — Findway's sub-agencies (values mirror public.agency_status) */
export const AGENCY_STATUSES = ["active", "inactive"] as const;
export type AgencyStatus = (typeof AGENCY_STATUSES)[number];

export const AGENCY_STATUS_LABELS: Record<AgencyStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

/* agents — writing agents under Findway or a sub-agency (public.agent_status) */
export const AGENT_STATUSES = ["active", "inactive", "terminated"] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  terminated: "Terminated",
};

/* clients — policyholders in the book of business (public.client_status) */
export const CLIENT_STATUSES = ["prospect", "active", "inactive"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  prospect: "Prospect",
  active: "Active",
  inactive: "Inactive",
};

/* carriers — insurance carriers we place business with (public.carrier_status) */
export const CARRIER_STATUSES = ["active", "inactive"] as const;
export type CarrierStatus = (typeof CARRIER_STATUSES)[number];

export const CARRIER_STATUS_LABELS: Record<CarrierStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

/* rate schedules — how a carrier pays commissions (public.rate_type) */
export const RATE_TYPES = ["pmpm", "percent_of_premium"] as const;
export type RateType = (typeof RATE_TYPES)[number];

export const RATE_TYPE_LABELS: Record<RateType, string> = {
  pmpm: "Flat PMPM",
  percent_of_premium: "% of premium",
};

/* rate schedules — new-business vs renewal rates (public.business_type) */
export const BUSINESS_TYPES = ["new_business", "renewal"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  new_business: "New business",
  renewal: "Renewal",
};

/* policies — lifecycle order, mirrors public.policy_status */
export const POLICY_STATUSES = [
  "draft",
  "submitted",
  "active",
  "grace",
  "lapsed",
  "cancelled",
  "terminated",
  "renewed",
] as const;
export type PolicyStatus = (typeof POLICY_STATUSES)[number];

export const POLICY_STATUS_LABELS: Record<PolicyStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  active: "Active",
  grace: "Grace",
  lapsed: "Lapsed",
  cancelled: "Cancelled",
  terminated: "Terminated",
  renewed: "Renewed",
};

/* commission statements — import lifecycle (public.statement_status) */
export const STATEMENT_STATUSES = ["draft", "matching", "posted", "void"] as const;
export type StatementStatus = (typeof STATEMENT_STATUSES)[number];

export const STATEMENT_STATUS_LABELS: Record<StatementStatus, string> = {
  draft: "Draft",
  matching: "Matching",
  posted: "Posted",
  void: "Void",
};

/* statement lines — what kind of money the carrier row is (public.line_kind) */
export const LINE_KINDS = ["commission", "override", "adjustment"] as const;
export type LineKind = (typeof LINE_KINDS)[number];

export const LINE_KIND_LABELS: Record<LineKind, string> = {
  commission: "Commission",
  override: "Override",
  adjustment: "Adjustment",
};

/* statement lines — policy-matching resolution (public.match_status) */
export const MATCH_STATUSES = ["unmatched", "auto_matched", "manual_matched", "ignored"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  unmatched: "Unmatched",
  auto_matched: "Auto-matched",
  manual_matched: "Manually matched",
  ignored: "Ignored",
};

/* ledger — who earns each allocated share (public.ledger_entry_kind, mirrors
 * commission-engine.ts) */
export const LEDGER_ENTRY_KINDS = [
  "agent_commission",
  "agency_commission",
  "house_commission",
  "agency_override",
  "house_override",
] as const;
export type LedgerEntryKind = (typeof LEDGER_ENTRY_KINDS)[number];

export const LEDGER_ENTRY_KIND_LABELS: Record<LedgerEntryKind, string> = {
  agent_commission: "Agent commission",
  agency_commission: "Agency commission",
  house_commission: "House commission",
  agency_override: "Agency override",
  house_override: "House override",
};

/* ledger / payouts — the payee a ledger entry belongs to (public.payee_type) */
export const PAYEE_TYPES = ["agent", "agency", "house"] as const;
export type PayeeType = (typeof PAYEE_TYPES)[number];

export const PAYEE_TYPE_LABELS: Record<PayeeType, string> = {
  agent: "Agent",
  agency: "Agency",
  house: "House",
};

/* payout statements — payout run lifecycle (public.payout_status) */
export const PAYOUT_STATUSES = ["open", "finalized", "paid"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  open: "Open",
  finalized: "Finalized",
  paid: "Paid",
};
