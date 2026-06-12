import type { AgencyStatus, AgentStatus, ClientStatus } from "@/lib/domain/enums";

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
