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

/* ------------------------------------------------------------------------- *
 * EXAMPLE ENTITY (contacts) — safe to delete; see README "Removing the
 * example entity". Demonstrates the enum + label-map pattern every business
 * entity in this codebase follows.
 * ------------------------------------------------------------------------- */

export const CONTACT_STATUSES = ["lead", "active", "at_risk", "closed"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  lead: "Lead",
  active: "Active",
  at_risk: "At Risk",
  closed: "Closed",
};
