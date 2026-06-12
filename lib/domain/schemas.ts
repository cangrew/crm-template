import { z } from "zod";
import {
  AGENCY_STATUSES,
  AGENT_STATUSES,
  APP_ROLES,
  BUSINESS_TYPES,
  CARRIER_STATUSES,
  CLIENT_STATUSES,
  LINE_KINDS,
  MATCH_STATUSES,
  PAYEE_TYPES,
  POLICY_STATUSES,
  RATE_TYPES,
  type RateType,
} from "./enums";

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

/* clients — policyholders. Inserts apply defaults, updates are fully partial
 * patches with nullable clears. */
export const clientInsertSchema = z.object({
  first_name: nonEmpty,
  last_name: nonEmpty,
  dob: z.iso.date().nullable().optional(),
  email: z.email().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  status: z.enum(CLIENT_STATUSES).default("prospect"),
  agent_id: uuid.nullable().optional(),
  notes: z.string().trim().optional(),
});

export const clientUpdateSchema = z
  .object({
    first_name: nonEmpty,
    last_name: nonEmpty,
    dob: z.iso.date().nullable(),
    email: z.email().nullable(),
    phone: z.string().trim().nullable(),
    address: z.string().trim().nullable(),
    status: z.enum(CLIENT_STATUSES),
    agent_id: uuid.nullable(),
    notes: z.string().trim().nullable(),
  })
  .partial();

/* carriers */
export const carrierInsertSchema = z.object({
  name: nonEmpty,
  status: z.enum(CARRIER_STATUSES).default("active"),
  notes: z.string().trim().optional(),
});

export const carrierUpdateSchema = z
  .object({
    name: nonEmpty,
    status: z.enum(CARRIER_STATUSES),
    notes: z.string().trim().nullable(),
  })
  .partial();

/* rate schedules — exactly the value column matching rate_type must be
 * populated (mirrors the rate_schedules_value_matches_type SQL check). The
 * helper skips patches that do not touch rate_type. */
function enforceRateValueRule(
  val: { rate_type?: RateType; pmpm_cents?: number | null; percent_bps?: number | null },
  ctx: z.RefinementCtx,
) {
  if (val.rate_type === undefined) return;
  if (val.rate_type === "pmpm") {
    if (val.pmpm_cents == null) {
      ctx.addIssue({ code: "custom", path: ["pmpm_cents"], message: "A PMPM rate needs a value." });
    }
    if (val.percent_bps != null) {
      ctx.addIssue({
        code: "custom",
        path: ["percent_bps"],
        message: "A PMPM rate cannot carry a percent value.",
      });
    }
  } else {
    if (val.percent_bps == null) {
      ctx.addIssue({
        code: "custom",
        path: ["percent_bps"],
        message: "A percent-of-premium rate needs a value.",
      });
    }
    if (val.pmpm_cents != null) {
      ctx.addIssue({
        code: "custom",
        path: ["pmpm_cents"],
        message: "A percent-of-premium rate cannot carry a PMPM value.",
      });
    }
  }
}

export const rateScheduleInsertSchema = z
  .object({
    carrier_id: uuid,
    rate_type: z.enum(RATE_TYPES),
    business_type: z.enum(BUSINESS_TYPES),
    pmpm_cents: z.number().int().min(0).nullable().optional(),
    percent_bps: bps.nullable().optional(),
    effective_from: z.iso.date(),
    effective_to: z.iso.date().nullable().optional(),
    state: z.string().trim().nullable().optional(),
  })
  .superRefine(enforceRateValueRule);

export const rateScheduleUpdateSchema = z
  .object({
    rate_type: z.enum(RATE_TYPES),
    business_type: z.enum(BUSINESS_TYPES),
    pmpm_cents: z.number().int().min(0).nullable(),
    percent_bps: bps.nullable(),
    effective_from: z.iso.date(),
    effective_to: z.iso.date().nullable(),
    state: z.string().trim().nullable(),
  })
  .partial()
  .superRefine(enforceRateValueRule);

/* carrier CSV mappings — statement-field -> CSV-header maps for the importer */
export const csvMappingInsertSchema = z.object({
  carrier_id: uuid,
  name: nonEmpty,
  mapping: z.record(z.string(), z.string()),
  header_signature: z.string().trim().nullable().optional(),
});

export const csvMappingUpdateSchema = z
  .object({
    name: nonEmpty,
    mapping: z.record(z.string(), z.string()),
    header_signature: z.string().trim().nullable(),
  })
  .partial();

/* policies — inserts apply defaults, updates are fully partial patches with
 * nullable clears. */
export const policyInsertSchema = z.object({
  client_id: uuid,
  carrier_id: uuid,
  agent_id: uuid,
  policy_number: z.string().trim().nullable().optional(),
  carrier_member_id: z.string().trim().nullable().optional(),
  plan_name: z.string().trim().nullable().optional(),
  status: z.enum(POLICY_STATUSES).default("draft"),
  member_count: z.number().int().min(1).default(1),
  monthly_premium_cents: z.number().int().min(0).nullable().optional(),
  effective_date: z.iso.date().nullable().optional(),
  effectuated_at: z.iso.date().nullable().optional(),
  termination_date: z.iso.date().nullable().optional(),
  original_effective_date: z.iso.date().nullable().optional(),
  notes: z.string().trim().optional(),
});

export const policyUpdateSchema = z
  .object({
    client_id: uuid,
    carrier_id: uuid,
    agent_id: uuid,
    policy_number: z.string().trim().nullable(),
    carrier_member_id: z.string().trim().nullable(),
    plan_name: z.string().trim().nullable(),
    status: z.enum(POLICY_STATUSES),
    member_count: z.number().int().min(1),
    monthly_premium_cents: z.number().int().min(0).nullable(),
    effective_date: z.iso.date().nullable(),
    effectuated_at: z.iso.date().nullable(),
    termination_date: z.iso.date().nullable(),
    original_effective_date: z.iso.date().nullable(),
    notes: z.string().trim().nullable(),
  })
  .partial();

/* commission statements — one uploaded carrier CSV per (carrier, period).
 * status / rollup columns are server-managed (post_statement), so inserts
 * carry only the import metadata. */
export const statementInsertSchema = z.object({
  carrier_id: uuid,
  /* First day of the commission month the statement covers. */
  period_month: z.iso.date(),
  /* Raw CSV audit copy; null until uploaded. */
  storage_path: z.string().trim().nullable().optional(),
  uploaded_by: uuid.optional(),
});

/* statement lines — parsed CSV rows. amount_cents is signed (negative =
 * chargeback); the parsed identity fields are nullable because carrier files
 * are messy. `raw` keeps the original row verbatim for audit. */
export const statementLineInsertSchema = z.object({
  statement_id: uuid,
  row_index: z.number().int().min(0),
  raw: z.record(z.string(), z.string()),
  policy_number: z.string().trim().nullable().optional(),
  carrier_member_id: z.string().trim().nullable().optional(),
  subscriber_name: z.string().trim().nullable().optional(),
  subscriber_dob: z.iso.date().nullable().optional(),
  member_count: z.number().int().nullable().optional(),
  premium_cents: z.number().int().nullable().optional(),
  amount_cents: z.number().int(),
  line_kind: z.enum(LINE_KINDS).default("commission"),
  business_type: z.enum(BUSINESS_TYPES).nullable().optional(),
  match_status: z.enum(MATCH_STATUSES).default("unmatched"),
  matched_policy_id: uuid.nullable().optional(),
  match_reason: z.string().trim().nullable().optional(),
});

/* payout statements — exactly one payee id matching payee_type must be set
 * (mirrors the payout_statements_payee_shape SQL check). The house never
 * receives a payout statement; it keeps the remainder. */
export const payoutStatementInsertSchema = z
  .object({
    payee_type: z.enum(PAYEE_TYPES),
    agent_id: uuid.nullable().optional(),
    agency_id: uuid.nullable().optional(),
    period_month: z.iso.date(),
  })
  .superRefine((val, ctx) => {
    if (val.payee_type === "house") {
      ctx.addIssue({
        code: "custom",
        path: ["payee_type"],
        message: "The house keeps its remainder; it never receives a payout statement.",
      });
      return;
    }
    if (val.payee_type === "agent") {
      if (val.agent_id == null) {
        ctx.addIssue({
          code: "custom",
          path: ["agent_id"],
          message: "An agent payout statement needs an agent.",
        });
      }
      if (val.agency_id != null) {
        ctx.addIssue({
          code: "custom",
          path: ["agency_id"],
          message: "An agent payout statement cannot carry an agency.",
        });
      }
      return;
    }
    if (val.agency_id == null) {
      ctx.addIssue({
        code: "custom",
        path: ["agency_id"],
        message: "An agency payout statement needs an agency.",
      });
    }
    if (val.agent_id != null) {
      ctx.addIssue({
        code: "custom",
        path: ["agent_id"],
        message: "An agency payout statement cannot carry an agent.",
      });
    }
  });

/* documents */
export const documentInsertSchema = z.object({
  // Documents can stand alone or attach to a client record.
  client_id: uuid.nullable().optional(),
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
export type ClientInput = z.infer<typeof clientInsertSchema>;
export type ClientUpdate = z.infer<typeof clientUpdateSchema>;
export type CarrierInput = z.infer<typeof carrierInsertSchema>;
export type CarrierUpdate = z.infer<typeof carrierUpdateSchema>;
export type RateScheduleInput = z.infer<typeof rateScheduleInsertSchema>;
export type RateScheduleUpdate = z.infer<typeof rateScheduleUpdateSchema>;
export type CsvMappingInput = z.infer<typeof csvMappingInsertSchema>;
export type CsvMappingUpdate = z.infer<typeof csvMappingUpdateSchema>;
export type PolicyInput = z.infer<typeof policyInsertSchema>;
export type PolicyUpdate = z.infer<typeof policyUpdateSchema>;
export type StatementInput = z.infer<typeof statementInsertSchema>;
export type StatementLineInput = z.infer<typeof statementLineInsertSchema>;
export type PayoutStatementInput = z.infer<typeof payoutStatementInsertSchema>;
export type DocumentInput = z.infer<typeof documentInsertSchema>;
