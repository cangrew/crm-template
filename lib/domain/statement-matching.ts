/**
 * Carrier-statement parsing and policy matching. parseStatementCsv applies a
 * carrier_csv_mappings.mapping (statement field → CSV header) to raw rows;
 * matchLine resolves a parsed row against the carrier's policies.
 *
 * Match precedence (industry-standard exception flow):
 *   1. policy number  — exact after normalization → auto-match
 *   2. carrier member id — exact after normalization → auto-match
 *   3. subscriber name + DOB — low confidence: surfaced as a SUGGESTION on an
 *      unmatched line for a human to confirm, never auto-matched.
 * An ambiguous key (two policies sharing it) never auto-matches.
 */

export interface ParsedStatementLine {
  rowIndex: number;
  policyNumber: string | null;
  carrierMemberId: string | null;
  subscriberName: string | null;
  /** ISO date when parseable. */
  subscriberDob: string | null;
  memberCount: number | null;
  premiumCents: number | null;
  /** Signed; negative = chargeback. */
  amountCents: number;
  /** The untouched source row, kept for audit. */
  raw: Record<string, string>;
}

export interface MatchCandidate {
  policyId: string;
  policyNumber: string | null;
  carrierMemberId: string | null;
  clientFirstName: string;
  clientLastName: string;
  clientDob: string | null;
}

export type MatchResult =
  | { status: "auto_matched"; policyId: string; reason: "policy_number" | "member_id" }
  | { status: "unmatched"; suggestion?: { policyId: string; reason: "name_dob" } };

const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();

/** Single unambiguous candidate whose `key` matches `value`, or null. */
function uniqueMatch(
  candidates: readonly MatchCandidate[],
  value: string | null,
  key: (c: MatchCandidate) => string | null,
): MatchCandidate | null {
  const v = norm(value);
  if (!v) return null;
  const hits = candidates.filter((c) => norm(key(c)) === v);
  return hits.length === 1 ? hits[0] : null;
}

export function matchLine(
  line: ParsedStatementLine,
  candidates: readonly MatchCandidate[],
): MatchResult {
  const byPolicyNumber = uniqueMatch(candidates, line.policyNumber, (c) => c.policyNumber);
  if (byPolicyNumber) {
    return { status: "auto_matched", policyId: byPolicyNumber.policyId, reason: "policy_number" };
  }

  const byMemberId = uniqueMatch(candidates, line.carrierMemberId, (c) => c.carrierMemberId);
  if (byMemberId) {
    return { status: "auto_matched", policyId: byMemberId.policyId, reason: "member_id" };
  }

  if (line.subscriberName && line.subscriberDob) {
    const nameKey = normalizedNameKey(line.subscriberName);
    const hits = candidates.filter(
      (c) =>
        c.clientDob === line.subscriberDob &&
        nameKey === `${norm(c.clientLastName)}|${norm(c.clientFirstName)}`,
    );
    if (hits.length === 1) {
      return {
        status: "unmatched",
        suggestion: { policyId: hits[0].policyId, reason: "name_dob" },
      };
    }
  }

  return { status: "unmatched" };
}

/** "Last, First" or "First Last" → "last|first". */
function normalizedNameKey(name: string): string {
  const trimmed = name.trim();
  if (trimmed.includes(",")) {
    const [last, first] = trimmed.split(",", 2);
    return `${norm(last)}|${norm(first)}`;
  }
  const parts = trimmed.split(/\s+/);
  const first = parts.slice(0, -1).join(" ");
  const last = parts[parts.length - 1] ?? "";
  return `${norm(last)}|${norm(first)}`;
}

/**
 * "$1,234.56" / "-22.00" / "($86.00)" → signed cents; null when unparseable.
 */
export function parseAmountCents(value: string | null | undefined): number | null {
  if (value == null) return null;
  let s = value.trim();
  if (!s) return null;
  let negative = false;
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[$,\s]/g, "");
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const cents = Math.round(parseFloat(s) * 100);
  return negative ? -cents : cents;
}

/** "12/10/1990" or "1990-12-10" → "1990-12-10"; null when unparseable. */
export function parseDateIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const s = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const [, m, d, y] = us;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

/** Statement-field keys a carrier mapping may bind to CSV headers. */
export type StatementFieldMapping = Partial<
  Record<
    | "policy_number"
    | "carrier_member_id"
    | "subscriber_name"
    | "subscriber_dob"
    | "member_count"
    | "premium"
    | "amount",
    string
  >
>;

/**
 * Apply a carrier column mapping to raw CSV rows. Rows whose amount column is
 * blank or unparseable are dropped (subtotal/footer rows); everything else is
 * normalized but kept verbatim in `raw` for audit.
 */
export function parseStatementCsv(
  rows: readonly Record<string, string>[],
  mapping: StatementFieldMapping,
): ParsedStatementLine[] {
  const col = (row: Record<string, string>, field: keyof StatementFieldMapping) => {
    const header = mapping[field];
    return header ? (row[header] ?? null) : null;
  };

  const parsed: ParsedStatementLine[] = [];
  rows.forEach((row, rowIndex) => {
    const amountCents = parseAmountCents(col(row, "amount"));
    if (amountCents === null) return;

    const memberCountRaw = (col(row, "member_count") ?? "").trim();
    const memberCount = /^\d+$/.test(memberCountRaw) ? parseInt(memberCountRaw, 10) : null;

    parsed.push({
      rowIndex,
      policyNumber: (col(row, "policy_number") ?? "").trim() || null,
      carrierMemberId: (col(row, "carrier_member_id") ?? "").trim() || null,
      subscriberName: (col(row, "subscriber_name") ?? "").trim() || null,
      subscriberDob: parseDateIso(col(row, "subscriber_dob")),
      memberCount,
      premiumCents: parseAmountCents(col(row, "premium")),
      amountCents,
      raw: row,
    });
  });
  return parsed;
}
