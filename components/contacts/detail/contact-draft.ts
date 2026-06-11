/* EXAMPLE ENTITY — safe to delete; see README "Removing the example entity".
 * Draft modules back useDetailEdit: string-only form state seeded from the
 * persisted row, converted back into a schema-validated patch on save. */
import type { ContactUpdate } from "@/lib/domain/schemas";
import type { Contact } from "@/lib/supabase/types";

/** String-backed form state for editing a contact's profile fields. */
export type ContactDraft = {
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
};

/** Seed an edit draft from a persisted contact (nulls become empty strings). */
export function draftFromContact(contact: Contact): ContactDraft {
  return {
    name: contact.name ?? "",
    company: contact.company ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    notes: contact.notes ?? "",
  };
}

/**
 * Build a contact-update patch from a draft: trim text and turn blank optional
 * fields into nulls. The required `name` is left blank (not omitted) so
 * `contactUpdateSchema` rejects it instead of silently clearing it; the result
 * is validated before it reaches the database.
 */
export function draftToPatch(draft: ContactDraft): ContactUpdate {
  return {
    name: draft.name.trim(),
    company: draft.company.trim() || null,
    email: draft.email.trim() || null,
    phone: draft.phone.trim() || null,
    notes: draft.notes.trim() || null,
  };
}
