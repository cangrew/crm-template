import { getCurrentProfile } from "@/lib/data/profiles";
import type { AppRole } from "@/lib/domain/enums";
import type { Profile, TypedSupabaseClient } from "@/lib/supabase/types";

/**
 * API route authorization. The proxy's role guard deliberately skips /api/*
 * (cookie-less cron requests must not be redirected to /login), so every route
 * handler authorizes itself. These helpers are the one place that logic lives:
 * always an allow-list, and always treating a deactivated or pending (role
 * null) profile as having no access — mirroring current_app_role() in the
 * database and the page guard in lib/auth/route-access.ts.
 */

export const ALL_ROLES = [
  "admin",
  "manager",
  "agent",
  "agency_owner",
] as const satisfies readonly AppRole[];
export const ADMIN_MANAGER = ["admin", "manager"] as const satisfies readonly AppRole[];
/** Findway staff — the allow-list most write APIs use. */
export const STAFF = ADMIN_MANAGER;

/** The slice of a profile row that authorization decisions read. */
export type AuthorizableProfile = Pick<Profile, "role" | "is_active">;

/** Whether the profile is active and its role is in the allow-list. */
export function isAuthorizedProfile(
  profile: AuthorizableProfile | null,
  roles: readonly AppRole[],
): boolean {
  if (!profile || !profile.is_active || profile.role === null) return false;
  return roles.includes(profile.role);
}

export type ApiAuthResult = { ok: true; profile: Profile } | { ok: false; status: 401 | 403 };

/** Response bodies matching requireApiRole's failure statuses. */
export const AUTH_ERROR: Record<401 | 403, { error: string }> = {
  401: { error: "Unauthorized" },
  403: { error: "Forbidden" },
};

/**
 * Resolve the caller's profile and check it against an allow-list.
 * 401 when there is no authenticated profile at all; 403 when there is one
 * but it is deactivated, pending, or outside the allow-list. Callers map the
 * status to a NextResponse so this stays framework-free and unit-testable.
 */
export async function requireApiRole(
  supabase: TypedSupabaseClient,
  roles: readonly AppRole[],
): Promise<ApiAuthResult> {
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false, status: 401 };
  if (!isAuthorizedProfile(profile, roles)) return { ok: false, status: 403 };
  return { ok: true, profile };
}
