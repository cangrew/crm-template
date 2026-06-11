import type { AppRole } from "@/lib/domain/enums";

export type Resource = "contacts" | "documents" | "users";

export type Action = "create" | "read" | "update" | "delete";

const ALL: readonly Action[] = ["create", "read", "update", "delete"];

/**
 * Coarse resource/action permission matrix. Admins manage everything including
 * users; managers run day-to-day records but cannot delete contacts or touch
 * user accounts (the worked example of a scoped mid-tier role); members are
 * read-only. Field-level nuances belong in dedicated helpers and are always
 * re-checked server-side / by RLS.
 */
const PERMISSIONS: Record<AppRole, Record<Resource, readonly Action[]>> = {
  admin: {
    contacts: ALL,
    documents: ALL,
    users: ALL,
  },
  manager: {
    contacts: ["create", "read", "update"],
    documents: ALL,
    users: [],
  },
  member: {
    contacts: ["read"],
    documents: ["read"],
    users: [],
  },
};

export function can(role: AppRole, action: Action, resource: Resource): boolean {
  return PERMISSIONS[role][resource].includes(action);
}

export function isAdmin(role: AppRole): boolean {
  return role === "admin";
}
