/**
 * Pure helpers behind the import wizard's column-mapping step: a stable
 * header signature for recognizing a carrier file layout, and a best-effort
 * prefill of the statement-field → CSV-header mapping from the carrier's
 * saved mappings.
 */
import type { StatementFieldMapping } from "./statement-matching";

/** The statement fields a mapping may bind, in wizard display order. */
export const STATEMENT_FIELDS = [
  "policy_number",
  "carrier_member_id",
  "subscriber_name",
  "subscriber_dob",
  "member_count",
  "premium",
  "amount",
] as const satisfies readonly (keyof StatementFieldMapping)[];

export type StatementField = (typeof STATEMENT_FIELDS)[number];

export const STATEMENT_FIELD_LABELS: Record<StatementField, string> = {
  policy_number: "Policy number",
  carrier_member_id: "Member ID",
  subscriber_name: "Subscriber",
  subscriber_dob: "DOB",
  member_count: "Members",
  premium: "Premium",
  amount: "Amount paid",
};

/** The slice of a carrier_csv_mappings row the prefill reads. `mapping` is
 * typed loosely (the column is jsonb) and read defensively. */
export interface SavedMapping {
  mapping: unknown;
  header_signature: string | null;
}

/** Safe string lookup into an untrusted jsonb mapping value. */
function mappingValue(mapping: unknown, field: string): string | null {
  if (typeof mapping !== "object" || mapping === null || Array.isArray(mapping)) return null;
  const v = (mapping as Record<string, unknown>)[field];
  return typeof v === "string" && v.length > 0 ? v : null;
}

/** Headers joined with "|", lowercased and trimmed — a file-layout fingerprint. */
export function computeHeaderSignature(headers: readonly string[]): string {
  return headers.map((h) => h.trim().toLowerCase()).join("|");
}

export interface MappingPrefillResult {
  mapping: StatementFieldMapping;
  /** How the prefill was derived; "signature" means a saved mapping matched
   * this exact file layout (so re-saving it is redundant). */
  source: "signature" | "fuzzy" | "none";
}

/** Case-insensitive lookup of a saved header name among this file's headers. */
function resolveHeader(headers: readonly string[], wanted: string): string | undefined {
  const w = wanted.trim().toLowerCase();
  return headers.find((h) => h.trim().toLowerCase() === w);
}

/**
 * Prefill the column mapping for a freshly parsed file:
 *   1. a saved mapping whose header_signature equals this file's signature
 *      wins outright (values re-resolved against the actual headers);
 *   2. otherwise, per field, the first saved mapping (any of them) whose bound
 *      header exists in this file by case-insensitive exact name match;
 *   3. otherwise the field is left unmapped.
 */
export function prefillMapping(
  headers: readonly string[],
  savedMappings: readonly SavedMapping[],
): MappingPrefillResult {
  const signature = computeHeaderSignature(headers);

  const exact = savedMappings.find((m) => m.header_signature === signature);
  if (exact) {
    const mapping: StatementFieldMapping = {};
    for (const field of STATEMENT_FIELDS) {
      const wanted = mappingValue(exact.mapping, field);
      if (!wanted) continue;
      const header = resolveHeader(headers, wanted);
      if (header) mapping[field] = header;
    }
    return { mapping, source: "signature" };
  }

  const mapping: StatementFieldMapping = {};
  for (const field of STATEMENT_FIELDS) {
    for (const saved of savedMappings) {
      const wanted = mappingValue(saved.mapping, field);
      if (!wanted) continue;
      const header = resolveHeader(headers, wanted);
      if (header) {
        mapping[field] = header;
        break;
      }
    }
  }
  const any = STATEMENT_FIELDS.some((f) => mapping[f] !== undefined);
  return { mapping, source: any ? "fuzzy" : "none" };
}
