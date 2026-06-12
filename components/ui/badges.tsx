import { Badge } from "@/components/ui/badge";
import {
  AGENCY_STATUS_LABELS,
  AGENT_STATUS_LABELS,
  CARRIER_STATUS_LABELS,
  CLIENT_STATUS_LABELS,
  POLICY_STATUS_LABELS,
  type AgencyStatus,
  type AgentStatus,
  type CarrierStatus,
  type ClientStatus,
  type PolicyStatus,
} from "@/lib/domain/enums";
import { agencyTone, agentTone, carrierTone, clientTone, policyTone } from "@/lib/design/tones";

export function AgencyBadge({ status }: { status: AgencyStatus }) {
  return (
    <Badge tone={agencyTone[status]}>
      <span className="bdot" />
      {AGENCY_STATUS_LABELS[status]}
    </Badge>
  );
}

export function AgentBadge({ status }: { status: AgentStatus }) {
  return (
    <Badge tone={agentTone[status]}>
      <span className="bdot" />
      {AGENT_STATUS_LABELS[status]}
    </Badge>
  );
}

/* Status badges compose the generic Badge atom with the entity's label map
 * and tone map; add one of these per status enum. */
export function ClientBadge({ status }: { status: ClientStatus }) {
  return (
    <Badge tone={clientTone[status]}>
      <span className="bdot" />
      {CLIENT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function CarrierBadge({ status }: { status: CarrierStatus }) {
  return (
    <Badge tone={carrierTone[status]}>
      <span className="bdot" />
      {CARRIER_STATUS_LABELS[status]}
    </Badge>
  );
}

export function PolicyBadge({ status }: { status: PolicyStatus }) {
  return (
    <Badge tone={policyTone[status]}>
      <span className="bdot" />
      {POLICY_STATUS_LABELS[status]}
    </Badge>
  );
}
