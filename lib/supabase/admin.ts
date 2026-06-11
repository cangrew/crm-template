import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { TypedSupabaseClient } from "./types";

/**
 * Privileged service-role client for server-side scheduled jobs (Vercel Cron).
 * It bypasses Row-Level Security, so it must NEVER be imported into Client
 * Components or any code path reachable from the browser — the service-role key
 * is server-only. User-facing reads use the cookie/anon client instead.
 */
export function createAdminClient(): TypedSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase service-role configuration (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
    );
  }
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
