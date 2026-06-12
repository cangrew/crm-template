import type { AppRole } from "@/lib/domain/enums";

export type Resource = "clients" | "documents" | "users" | "agents" | "agencies";

export type Action = "create" | "read" | "update" | "delete";

const ALL: readonly Action[] = ["create", "read", "update", "delete"];

/**
 * Coarse resource/action permission matrix. Admins manage everything including
 * users; managers run Findway's day-to-day records but cannot delete records
 * or touch user accounts. Agents and agency owners are read-only tenants:
 * RLS narrows WHICH rows they see (their own book of business) while this
 * matrix gates the write affordances in the UI. Field-level nuances belong in
 * dedicated helpers and are always re-checked server-side / by RLS.
 */
const PERMISSIONS: Record<AppRole, Record<Resource, readonly Action[]>> = {
  admin: {
    clients: ALL,
    documents: ALL,
    users: ALL,
    agents: ALL,
    agencies: ALL,
  },
  manager: {
    clients: ["create", "read", "update"],
    documents: ALL,
    users: [],
    agents: ["create", "read", "update"],
    agencies: ["create", "read", "update"],
  },
  agent: {
    clients: ["read"],
    documents: ["read"],
    users: [],
    agents: ["read"],
    agencies: [],
  },
  agency_owner: {
    clients: ["read"],
    documents: ["read"],
    users: [],
    agents: ["read"],
    agencies: ["read"],
  },
};

export function can(role: AppRole, action: Action, resource: Resource): boolean {
  return PERMISSIONS[role][resource].includes(action);
}

export function isAdmin(role: AppRole): boolean {
  return role === "admin";
}

/** Findway staff roles — the internal users who run the agency's records. */
export function isStaff(role: AppRole): boolean {
  return role === "admin" || role === "manager";
}
