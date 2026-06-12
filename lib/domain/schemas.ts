import { z } from "zod";
import { AGENCY_STATUSES, AGENT_STATUSES, APP_ROLES, CONTACT_STATUSES } from "./enums";

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

/* Basis points (hundredths of a percent, 0–10000). All commission cuts and
 * splits are stored this way so penny math stays integer-exact. */
const bps = z.number().int().min(0).max(10000);

/* agencies */
export const agencyInsertSchema = z.object({
  name: nonEmpty,
  status: z.enum(AGENCY_STATUSES).default("active"),
  commission_cut_bps: bps.default(0),
  override_cut_bps: bps.default(0),
  owner_profile_id: uuid.nullable().optional(),
  notes: z.string().trim().optional(),
});

export const agencyUpdateSchema = z
  .object({
    name: nonEmpty,
    status: z.enum(AGENCY_STATUSES),
    commission_cut_bps: bps,
    override_cut_bps: bps,
    owner_profile_id: uuid.nullable(),
    notes: z.string().trim().nullable(),
  })
  .partial();

/* agents */
export const agentInsertSchema = z.object({
  full_name: nonEmpty,
  email: z.email().nullable().optional(),
  npn: z.string().trim().nullable().optional(),
  status: z.enum(AGENT_STATUSES).default("active"),
  agency_id: uuid.nullable().optional(),
  commission_split_bps: bps.default(8000),
  profile_id: uuid.nullable().optional(),
});

export const agentUpdateSchema = z
  .object({
    full_name: nonEmpty,
    email: z.email().nullable(),
    npn: z.string().trim().nullable(),
    status: z.enum(AGENT_STATUSES),
    agency_id: uuid.nullable(),
    commission_split_bps: bps,
    profile_id: uuid.nullable(),
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
export type AgencyInput = z.infer<typeof agencyInsertSchema>;
export type AgencyUpdate = z.infer<typeof agencyUpdateSchema>;
export type AgentInput = z.infer<typeof agentInsertSchema>;
export type AgentUpdate = z.infer<typeof agentUpdateSchema>;
export type ContactInput = z.infer<typeof contactInsertSchema>;
export type ContactUpdate = z.infer<typeof contactUpdateSchema>;
export type DocumentInput = z.infer<typeof documentInsertSchema>;
