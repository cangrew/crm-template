import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { AppRole } from "@/lib/domain/enums";
import type { Database } from "./database.types";

export interface SessionResult {
  supabaseResponse: NextResponse;
  isAuthenticated: boolean;
  role: AppRole | null;
}

/**
 * Refresh the Supabase auth session on the incoming request and resolve the
 * caller's app role. Used by the root proxy (Next 16's renamed middleware) to
 * keep cookies fresh and to drive the role guard. Always returns a response
 * whose cookies must be forwarded to the client.
 */
export async function updateSession(request: NextRequest): Promise<SessionResult> {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without configured credentials the Supabase client cannot run. Treat the
  // request as unauthenticated rather than throwing, which would surface as a
  // 500 on every route (the proxy runs site-wide). The role guard then sends
  // the visitor to /login instead of crashing the deployment.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY; " +
        "auth session refresh skipped. Set these env vars in the deployment environment.",
    );
    return { supabaseResponse, isAuthenticated: false, role: null };
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // Do not run code between createServerClient and getUser(): it must run first
  // so the session cookie is refreshed before any redirect decision. A failure
  // here (e.g. an unreachable Supabase host) must not 500 the whole site, so we
  // fall back to an unauthenticated result and let the guard redirect to login.
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let role: AppRole | null = null;
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .single();
      // A deactivated profile (or one still pending a role assignment) resolves
      // to no role, so the guard treats it as having no access — matching the
      // is_active filter in the database's current_app_role().
      role = data?.is_active ? ((data.role as AppRole | null) ?? null) : null;
    }

    return { supabaseResponse, isAuthenticated: Boolean(user), role };
  } catch (error) {
    console.error("[supabase] Auth session refresh failed:", error);
    return { supabaseResponse, isAuthenticated: false, role: null };
  }
}
