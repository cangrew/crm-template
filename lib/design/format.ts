export function fmtUSD(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

/**
 * Money with explicit cents for statements and PDFs. Negative amounts render in
 * accounting style, e.g. -860 -> "($860.00)".
 */
export function fmtMoneyCents(n: number): string {
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `($${abs})` : `$${abs}`;
}

/** Render a fraction (0.08) as a percentage string ("8%"). */
export function fmtPct(fraction: number): string {
  return `${Number((fraction * 100).toFixed(2))}%`;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * Statement period months ("2026-05-01" or "2026-05") rendered as "May 2026".
 * String-parsed (no Date) so timezones can never shift the month.
 */
export function fmtMonth(iso: string | null | undefined): string {
  const m = (iso ?? "").match(/^(\d{4})-(\d{2})/);
  if (!m) return "—";
  const idx = Number(m[2]) - 1;
  if (idx < 0 || idx > 11) return "—";
  return `${MONTH_NAMES[idx]} ${m[1]}`;
}

export function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  return iso.slice(5);
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

/**
 * Compact relative time for notification feeds: "just now", "15m ago", "3h
 * ago", "2d ago", then a short MM-DD date past a week. `now` is injectable for
 * deterministic tests.
 */
export function fmtRelativeTime(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "";
  const diff = now - Date.parse(iso);
  if (diff < MINUTE_MS) return "just now";
  if (diff < HOUR_MS) return `${Math.floor(diff / MINUTE_MS)}m ago`;
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)}h ago`;
  if (diff < WEEK_MS) return `${Math.floor(diff / DAY_MS)}d ago`;
  // Older than a week: show MM-DD from the ISO timestamp.
  return iso.slice(5, 10);
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
