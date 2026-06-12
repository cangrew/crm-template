/* Draft module backing useDetailEdit for carriers: string-only form state
 * seeded from the persisted row, converted back into a schema-validated patch
 * on save. */
import type { CarrierUpdate } from "@/lib/domain/schemas";
import type { Carrier } from "@/lib/supabase/types";

/** String-backed form state for editing a carrier's profile fields. */
export type CarrierDraft = {
  name: string;
  notes: string;
};

/** Seed an edit draft from a persisted carrier (nulls become empty strings). */
export function draftFromCarrier(carrier: Carrier): CarrierDraft {
  return {
    name: carrier.name ?? "",
    notes: carrier.notes ?? "",
  };
}

/**
 * Build a carrier-update patch from a draft: trim text and turn blank notes
 * into null. The name is left blank (not omitted) so `carrierUpdateSchema`
 * rejects it instead of silently clearing it.
 */
export function draftToPatch(draft: CarrierDraft): CarrierUpdate {
  return {
    name: draft.name.trim(),
    notes: draft.notes.trim() || null,
  };
}
