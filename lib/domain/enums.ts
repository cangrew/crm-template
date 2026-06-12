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
