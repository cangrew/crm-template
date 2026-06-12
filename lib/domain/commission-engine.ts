/**
 * The commission allocation engine: given one matched statement-line amount
 * and the hierarchy economics in force, produce the ledger entries to persist.
 * Pure and synchronous — the posting API route loads inputs, runs this, and
 * saves the drafts atomically.
 *
 * Money invariants (enforced by tests):
 *   * Entries always sum EXACTLY to the input amount. Non-house shares round
 *     half away from zero; the house absorbs the residual.
 *   * Negative inputs (chargebacks) produce the exact mirror of the positive
 *     allocation — clawbacks reverse what was paid, penny for penny.
 *   * Zero-amount entries are dropped.
 *
 * Split rules:
 *   * commission / adjustment — the writing agent takes commissionSplitBps
 *     first; the remainder splits agency commissionCutBps vs house. A direct
 *     agent (no agency) splits agent vs house only.
 *   * override — Findway's upline earnings: the agency takes overrideCutBps,
 *     the house keeps the rest; all-house for a direct agent. Agents never
 *     share in overrides.
 */
import { applyBps } from "./money";

export type AllocationLineKind = "commission" | "override" | "adjustment";

export interface AllocationAgent {
  id: string;
  commissionSplitBps: number;
  agencyId: string | null;
}

export interface AllocationAgency {
  id: string;
  commissionCutBps: number;
  overrideCutBps: number;
}

export interface AllocationInput {
  /** Signed; negative = chargeback. */
  amountCents: number;
  lineKind: AllocationLineKind;
  agent: AllocationAgent;
  agency: AllocationAgency | null;
}

export type LedgerEntryKind =
  | "agent_commission"
  | "agency_commission"
  | "house_commission"
  | "agency_override"
  | "house_override";

export interface LedgerEntryDraft {
  entryKind: LedgerEntryKind;
  payeeType: "agent" | "agency" | "house";
  agentId: string | null;
  agencyId: string | null;
  amountCents: number;
  /** The cut applied at post time (audit snapshot); null for residual house entries. */
  appliedBps: number | null;
}

export function allocateLine(input: AllocationInput): LedgerEntryDraft[] {
  const { amountCents, lineKind, agent, agency } = input;

  if (!Number.isInteger(amountCents)) {
    throw new Error(`amountCents must be an integer number of cents, got ${amountCents}`);
  }
  if (agent.agencyId === null && agency !== null) {
    throw new Error(`direct agent ${agent.id} was allocated with agency ${agency.id}`);
  }
  if (agent.agencyId !== null && agency?.id !== agent.agencyId) {
    throw new Error(
      `agent ${agent.id} belongs to agency ${agent.agencyId} but was allocated with ${
        agency ? agency.id : "no agency"
      }`,
    );
  }

  const entries =
    lineKind === "override"
      ? allocateOverride(amountCents, agent, agency)
      : allocateCommission(amountCents, agent, agency);

  return entries.filter((e) => e.amountCents !== 0);
}

function allocateCommission(
  amountCents: number,
  agent: AllocationAgent,
  agency: AllocationAgency | null,
): LedgerEntryDraft[] {
  const agentShare = applyBps(amountCents, agent.commissionSplitBps);
  const remainder = amountCents - agentShare;
  const agencyShare = agency ? applyBps(remainder, agency.commissionCutBps) : 0;
  const houseShare = remainder - agencyShare;

  const entries: LedgerEntryDraft[] = [
    {
      entryKind: "agent_commission",
      payeeType: "agent",
      agentId: agent.id,
      agencyId: agent.agencyId,
      amountCents: agentShare,
      appliedBps: agent.commissionSplitBps,
    },
  ];
  if (agency) {
    entries.push({
      entryKind: "agency_commission",
      payeeType: "agency",
      agentId: agent.id,
      agencyId: agency.id,
      amountCents: agencyShare,
      appliedBps: agency.commissionCutBps,
    });
  }
  entries.push({
    entryKind: "house_commission",
    payeeType: "house",
    agentId: agent.id,
    agencyId: agent.agencyId,
    amountCents: houseShare,
    appliedBps: null,
  });
  return entries;
}

function allocateOverride(
  amountCents: number,
  agent: AllocationAgent,
  agency: AllocationAgency | null,
): LedgerEntryDraft[] {
  const agencyShare = agency ? applyBps(amountCents, agency.overrideCutBps) : 0;
  const houseShare = amountCents - agencyShare;

  const entries: LedgerEntryDraft[] = [];
  if (agency) {
    entries.push({
      entryKind: "agency_override",
      payeeType: "agency",
      agentId: agent.id,
      agencyId: agency.id,
      amountCents: agencyShare,
      appliedBps: agency.overrideCutBps,
    });
  }
  entries.push({
    entryKind: "house_override",
    payeeType: "house",
    agentId: agent.id,
    agencyId: agent.agencyId,
    amountCents: houseShare,
    appliedBps: null,
  });
  return entries;
}
