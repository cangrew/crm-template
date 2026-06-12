import { z } from "zod";
import { APP_ROLES, CONTACT_STATUSES } from "./enums";

export const DOCUMENT_KINDS = ["contract", "invoice", "other"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

const uuid = z.uuid();
const nonEmpty = z.string().trim().min(1);

/* profiles */
export const profileSchema = z.object({
  id: uuid,
  full_name: nonEmpty,
  email: z.email(),
  role: z.enum(APP_ROLES),
  is_active: z.boolean(),
  created_at: z.iso.datetime(),
});

export const profileInsertSchema = z.object({
  id: uuid,
  full_name: nonEmpty,
  email: z.email(),
  role: z.enum(APP_ROLES).default("agent"),
  is_active: z.boolean().default(true),
});

export const profileUpdateSchema = z
  .object({
    full_name: nonEmpty,
    role: z.enum(APP_ROLES),
    is_active: z.boolean(),
  })
  .partial();

/* contacts — EXAMPLE ENTITY, safe to delete; see README "Removing the example
 * entity". The insert/update pair is the pattern every entity follows: inserts
 * apply defaults, updates are fully partial patches with nullable clears. */
export const contactInsertSchema = z.object({
  name: nonEmpty,
  company: z.string().trim().nullable().optional(),
  email: z.email().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  status: z.enum(CONTACT_STATUSES).default("lead"),
  notes: z.string().trim().optional(),
});

export const contactUpdateSchema = z
  .object({
    name: nonEmpty,
    company: z.string().trim().nullable(),
    email: z.email().nullable(),
    phone: z.string().trim().nullable(),
    status: z.enum(CONTACT_STATUSES),
    notes: z.string().trim().nullable(),
  })
  .partial();

/* documents */
export const documentInsertSchema = z.object({
  // Documents can stand alone or attach to a contact (the example entity).
  contact_id: uuid.nullable().optional(),
  kind: z.enum(DOCUMENT_KINDS),
  storage_path: nonEmpty,
  uploaded_by: uuid.optional(),
});

export type ProfileInput = z.infer<typeof profileInsertSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type ContactInput = z.infer<typeof contactInsertSchema>;
export type ContactUpdate = z.infer<typeof contactUpdateSchema>;
export type DocumentInput = z.infer<typeof documentInsertSchema>;
