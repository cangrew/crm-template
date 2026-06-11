/**
 * Whether the local auth-bypass is in effect.
 *
 * The bypass exists only for local design QA and E2E (it renders the app shell
 * for a stub admin without a real session) and must NEVER take effect in a real
 * deployment, even if `NEXT_PUBLIC_BYPASS_AUTH` leaks into the build.
 *
 * Rule (single source of truth for `proxy.ts` and the app layout):
 *  - `NEXT_PUBLIC_BYPASS_AUTH=1` is the base flag, AND
 *  - one of:
 *      • `NODE_ENV !== "production"` — local `next dev` / unit runs, OR
 *      • `NEXT_PUBLIC_E2E=1` — the Playwright harness, which serves a *production*
 *        build (`next start`) and so needs an explicit, separate opt-in.
 *
 * A production deployment sets neither escape hatch, so the bypass stays off
 * regardless of host (no reliance on a Vercel-specific signal).
 */
export function isAuthBypassEnabled(
  env: {
    NEXT_PUBLIC_BYPASS_AUTH?: string;
    NEXT_PUBLIC_E2E?: string;
    NODE_ENV?: string;
  } = process.env,
): boolean {
  if (env.NEXT_PUBLIC_BYPASS_AUTH !== "1") return false;
  return env.NODE_ENV !== "production" || env.NEXT_PUBLIC_E2E === "1";
}
