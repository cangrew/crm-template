import type {
  AgencyStatus,
  AgentStatus,
  CarrierStatus,
  ClientStatus,
  MatchStatus,
  PayoutStatus,
  PolicyStatus,
  StatementStatus,
} from "@/lib/domain/enums";

/** Badge tone tokens (see components/ui/badge.tsx). */
export type Tone =
  | "t-slate"
  | "t-orange"
  | "t-amber"
  | "t-green"
  | "t-red"
  | "t-blue"
  | "t-indigo"
  | "t-teal"
  | "t-violet"
  | "t-green-solid";

/* Each status enum gets a tone map so badges, pickers, and filter bars stay
 * visually consistent. */
export const clientTone: Record<ClientStatus, Tone> = {
  prospect: "t-amber",
  active: "t-green",
  inactive: "t-slate",
};

export const agencyTone: Record<AgencyStatus, Tone> = {
  active: "t-green",
  inactive: "t-slate",
};

export const agentTone: Record<AgentStatus, Tone> = {
  active: "t-green",
  inactive: "t-slate",
  terminated: "t-red",
};

export const carrierTone: Record<CarrierStatus, Tone> = {
  active: "t-green",
  inactive: "t-slate",
};

export const policyTone: Record<PolicyStatus, Tone> = {
  draft: "t-slate",
  submitted: "t-indigo",
  active: "t-green",
  grace: "t-amber",
  lapsed: "t-red",
  cancelled: "t-red",
  terminated: "t-slate",
  renewed: "t-teal",
};

export const statementTone: Record<StatementStatus, Tone> = {
  draft: "t-slate",
  matching: "t-amber",
  posted: "t-green",
  void: "t-red",
};

export const matchTone: Record<MatchStatus, Tone> = {
  unmatched: "t-red",
  auto_matched: "t-green",
  manual_matched: "t-teal",
  ignored: "t-slate",
};

export const payoutTone: Record<PayoutStatus, Tone> = {
  open: "t-amber",
  finalized: "t-blue",
  paid: "t-green",
};
