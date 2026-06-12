/* Draft modules back useDetailEdit: string-only form state seeded from the
 * persisted row, converted back into a schema-validated patch on save. */
import type { ClientUpdate } from "@/lib/domain/schemas";
import type { Client } from "@/lib/supabase/types";

/** String-backed form state for editing a client's profile fields. */
export type ClientDraft = {
  first_name: string;
  last_name: string;
  dob: string;
  email: string;
  phone: string;
  address: string;
  agent_id: string;
  notes: string;
};

/** Seed an edit draft from a persisted client (nulls become empty strings). */
export function draftFromClient(client: Client): ClientDraft {
  return {
    first_name: client.first_name ?? "",
    last_name: client.last_name ?? "",
    dob: client.dob ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    address: client.address ?? "",
    agent_id: client.agent_id ?? "",
    notes: client.notes ?? "",
  };
}

/**
 * Build a client-update patch from a draft: trim text and turn blank optional
 * fields into nulls (a blank dob or agent select also clears). The required
 * names are left blank (not omitted) so `clientUpdateSchema` rejects them
 * instead of silently clearing them; the result is validated before it
 * reaches the database.
 */
export function draftToPatch(draft: ClientDraft): ClientUpdate {
  return {
    first_name: draft.first_name.trim(),
    last_name: draft.last_name.trim(),
    dob: draft.dob.trim() || null,
    email: draft.email.trim() || null,
    phone: draft.phone.trim() || null,
    address: draft.address.trim() || null,
    agent_id: draft.agent_id || null,
    notes: draft.notes.trim() || null,
  };
}
