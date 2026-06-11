import { type NextRequest, NextResponse } from "next/server";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { resolveAuthRedirect } from "@/lib/auth/route-access";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 renamed the `middleware` convention to `proxy`. This runs on every
// matched request: it refreshes the Supabase session and enforces the role
// guard. Server Components and RLS re-check authorization independently.
// NEXT_PUBLIC_BYPASS_AUTH=1 skips the auth redirect for local design QA / E2E.
// isAuthBypassEnabled hard-disables it in production, so a leaked env var can
// never open the app in a real deploy.
const BYPASS = isAuthBypassEnabled();

export async function proxy(request: NextRequest) {
  const { supabaseResponse, isAuthenticated, role } = await updateSession(request);

  // API routes authorize themselves (e.g. the CRON_SECRET bearer on /api/cron,
  // or getCurrentProfile inside the handler). The page-redirect guard must not
  // 307 them — a cookie-less cron request would otherwise be sent to /login.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  const redirectTo = BYPASS
    ? null
    : resolveAuthRedirect({
        pathname: request.nextUrl.pathname,
        isAuthenticated,
        role,
      });

  if (redirectTo && redirectTo !== request.nextUrl.pathname) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    // Carry the refreshed auth cookies onto the redirect response.
    for (const cookie of supabaseResponse.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on all routes except Next internals and static asset files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
