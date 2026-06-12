/* Draft module backing useDetailEdit for agencies: string-only form state
 * seeded from the persisted row, converted back into a schema-validated patch
 * on save. */
import { bpsToPercentString, isValidPercentString, percentStringToBps } from "@/lib/domain/bps";
import type { AgencyUpdate } from "@/lib/domain/schemas";
import type { Agency } from "@/lib/supabase/types";

/** String-backed form state for editing an agency's profile fields. */
export type AgencyDraft = {
  name: string;
  commission_cut_pct: string;
  override_cut_pct: string;
  notes: string;
};

/** Seed an edit draft from a persisted agency (bps become percent strings). */
export function draftFromAgency(agency: Agency): AgencyDraft {
  return {
    name: agency.name ?? "",
    commission_cut_pct: bpsToPercentString(agency.commission_cut_bps),
    override_cut_pct: bpsToPercentString(agency.override_cut_bps),
    notes: agency.notes ?? "",
  };
}

/**
 * Build an agency-update patch from a draft. Invalid percent strings convert
 * to -1, which agencyUpdateSchema rejects (bps range 0–10000) so the form
 * surfaces the error instead of persisting garbage.
 */
export function draftToPatch(draft: AgencyDraft): AgencyUpdate {
  const toBps = (pct: string) =>
    isValidPercentString(pct.trim()) ? percentStringToBps(pct.trim()) : -1;
  return {
    name: draft.name.trim(),
    commission_cut_bps: toBps(draft.commission_cut_pct),
    override_cut_bps: toBps(draft.override_cut_pct),
    notes: draft.notes.trim() || null,
  };
}
