import { APP_ROLES, type AppRole } from "@/lib/domain/enums";

export const DEV_PASSWORD = "dev-password";
export const DEV_ROLE_STORAGE_KEY = "findway-dev-role";

export const DEV_USERS: Record<AppRole, { email: string; label: string }> = {
  admin: { email: "admin@example.com", label: "Avery Admin" },
  manager: { email: "manager@example.com", label: "Morgan Manager" },
  agent: { email: "agent@example.com", label: "Casey Agent" },
  agency_owner: { email: "owner@example.com", label: "Quinn Owner" },
};

export const DEV_FALLBACK_ROLE: AppRole = "admin";

export function isDevRole(value: unknown): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}

export function readStoredDevRole(): AppRole {
  if (typeof window === "undefined") return DEV_FALLBACK_ROLE;
  const stored = window.localStorage.getItem(DEV_ROLE_STORAGE_KEY);
  return isDevRole(stored) ? stored : DEV_FALLBACK_ROLE;
}

export function writeStoredDevRole(role: AppRole) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEV_ROLE_STORAGE_KEY, role);
}
