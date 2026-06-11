/**
 * Validate the bearer token Vercel Cron attaches to scheduled invocations.
 * Returns false unless a secret is configured and the header matches exactly,
 * so the cron endpoints cannot be triggered by anonymous public requests.
 */
export function isAuthorizedCron(authHeader: string | null, secret: string | undefined): boolean {
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
