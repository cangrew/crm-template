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
