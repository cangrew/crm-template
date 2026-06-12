/* Draft module backing useDetailEdit for policies: string-only form state
 * seeded from the persisted row, converted back into a schema-validated patch
 * on save. */
import type { PolicyUpdate } from "@/lib/domain/schemas";
import type { Policy } from "@/lib/supabase/types";

/** String-backed form state for editing a policy's profile fields. The premium
 * is edited in dollars; member_count as a digit string. */
export type PolicyDraft = {
  client_id: string;
  carrier_id: string;
  agent_id: string;
  policy_number: string;
  carrier_member_id: string;
  plan_name: string;
  member_count: string;
  monthly_premium: string;
  effective_date: string;
  effectuated_at: string;
  termination_date: string;
  original_effective_date: string;
  notes: string;
};

const DOLLAR_RE = /^\d+(\.\d{1,2})?$/;

/** Seed an edit draft from a persisted policy (nulls become empty strings,
 * cents become a dollar string). */
export function draftFromPolicy(policy: Policy): PolicyDraft {
  return {
    client_id: policy.client_id,
    carrier_id: policy.carrier_id,
    agent_id: policy.agent_id,
    policy_number: policy.policy_number ?? "",
    carrier_member_id: policy.carrier_member_id ?? "",
    plan_name: policy.plan_name ?? "",
    member_count: String(policy.member_count),
    monthly_premium:
      policy.monthly_premium_cents == null ? "" : (policy.monthly_premium_cents / 100).toFixed(2),
    effective_date: policy.effective_date ?? "",
    effectuated_at: policy.effectuated_at ?? "",
    termination_date: policy.termination_date ?? "",
    original_effective_date: policy.original_effective_date ?? "",
    notes: policy.notes ?? "",
  };
}

/**
 * Build a policy-update patch from a draft: trim text and turn blank optional
 * fields into nulls. Invalid numeric strings convert to -1, which
 * policyUpdateSchema rejects (member_count min 1, premium min 0) so the form
 * surfaces the error instead of persisting garbage.
 */
export function draftToPatch(draft: PolicyDraft): PolicyUpdate {
  const memberCount = /^\d+$/.test(draft.member_count.trim())
    ? parseInt(draft.member_count.trim(), 10)
    : -1;
  const premium = draft.monthly_premium.trim();
  return {
    client_id: draft.client_id,
    carrier_id: draft.carrier_id,
    agent_id: draft.agent_id,
    policy_number: draft.policy_number.trim() || null,
    carrier_member_id: draft.carrier_member_id.trim() || null,
    plan_name: draft.plan_name.trim() || null,
    member_count: memberCount,
    monthly_premium_cents: premium
      ? DOLLAR_RE.test(premium)
        ? Math.round(parseFloat(premium) * 100)
        : -1
      : null,
    effective_date: draft.effective_date.trim() || null,
    effectuated_at: draft.effectuated_at.trim() || null,
    termination_date: draft.termination_date.trim() || null,
    original_effective_date: draft.original_effective_date.trim() || null,
    notes: draft.notes.trim() || null,
  };
}
