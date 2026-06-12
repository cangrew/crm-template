import type { AppRole } from "@/lib/domain/enums";
import { isAdmin, isStaff } from "./roles";

const LOGIN_PATH = "/login";

/** Landing page for authenticated users who have no usable role yet. */
export const PENDING_PATH = "/pending";

/** Paths reachable without an authenticated session. */
export function isPublicPath(pathname: string): boolean {
  return pathname === LOGIN_PATH || pathname.startsWith("/auth");
}

/** Whether `pathname` is exactly `base` or a descendant route of it. Avoids
 * prefix collisions with unrelated siblings (e.g. `/settings-legacy`). */
function isRouteOrChild(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Areas only Findway staff (admin/manager) may view. */
const STAFF_ONLY_PATHS = ["/agents", "/agencies"] as const;

/**
 * Whether a role may view a given route. Mirrors the RBAC matrix: /settings
 * (user management) is admin-only; agency management areas are staff-only;
 * the remaining workspace pages are readable by every role — write
 * affordances inside them are gated per-action with can(), and RLS narrows
 * tenant roles (agent / agency_owner) to their own book of business. A null
 * role (session without a provisioned profile) is treated as having no
 * special access. Add a branch here for every new restricted area.
 */
export function canAccessPath(pathname: string, role: AppRole | null): boolean {
  if (isRouteOrChild(pathname, "/settings")) {
    return role !== null && isAdmin(role);
  }
  if (STAFF_ONLY_PATHS.some((base) => isRouteOrChild(pathname, base))) {
    return role !== null && isStaff(role);
  }
  return true;
}

export interface AuthRedirectInput {
  pathname: string;
  isAuthenticated: boolean;
  role: AppRole | null;
}

/**
 * Decide where a request should be redirected, or null to proceed. This is the
 * pure core of the proxy/middleware role guard so it can be unit-tested without
 * Next.js or Supabase.
 */
export function resolveAuthRedirect({
  pathname,
  isAuthenticated,
  role,
}: AuthRedirectInput): string | null {
  if (!isAuthenticated) {
    return isPublicPath(pathname) ? null : LOGIN_PATH;
  }

  // Let the OAuth callback finish regardless of provisioning state.
  if (pathname.startsWith("/auth")) {
    return null;
  }

  // Authenticated but with no usable role — pending a role assignment, or the
  // account was deactivated. The only page they may reach is the pending
  // screen (where they can read their status and sign out).
  if (role === null) {
    return pathname === PENDING_PATH ? null : PENDING_PATH;
  }

  // Provisioned users have no reason to sit on the login or pending screens.
  if (pathname === LOGIN_PATH || pathname === PENDING_PATH) {
    return "/";
  }

  if (!canAccessPath(pathname, role)) {
    return "/";
  }

  return null;
}
