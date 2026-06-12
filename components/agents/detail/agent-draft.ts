/* Draft module backing useDetailEdit for agents: string-only form state
 * seeded from the persisted row, converted back into a schema-validated patch
 * on save. */
import { bpsToPercentString, isValidPercentString, percentStringToBps } from "@/lib/domain/bps";
import type { AgentUpdate } from "@/lib/domain/schemas";
import type { Agent } from "@/lib/supabase/types";

/** String-backed form state for editing an agent's profile fields. */
export type AgentDraft = {
  full_name: string;
  email: string;
  npn: string;
  agency_id: string;
  commission_split_pct: string;
};

/** Seed an edit draft from a persisted agent (nulls become empty strings). */
export function draftFromAgent(agent: Agent): AgentDraft {
  return {
    full_name: agent.full_name ?? "",
    email: agent.email ?? "",
    npn: agent.npn ?? "",
    agency_id: agent.agency_id ?? "",
    commission_split_pct: bpsToPercentString(agent.commission_split_bps),
  };
}

/**
 * Build an agent-update patch from a draft. An invalid split converts to -1,
 * which agentUpdateSchema rejects (bps range 0–10000) so the form surfaces the
 * error instead of persisting garbage. A blank agency means direct (null).
 */
export function draftToPatch(draft: AgentDraft): AgentUpdate {
  const split = draft.commission_split_pct.trim();
  return {
    full_name: draft.full_name.trim(),
    email: draft.email.trim() || null,
    npn: draft.npn.trim() || null,
    agency_id: draft.agency_id || null,
    commission_split_bps: isValidPercentString(split) ? percentStringToBps(split) : -1,
  };
}
