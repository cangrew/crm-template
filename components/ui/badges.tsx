import { Badge } from "@/components/ui/badge";
import {
  AGENCY_STATUS_LABELS,
  AGENT_STATUS_LABELS,
  CONTACT_STATUS_LABELS,
  type AgencyStatus,
  type AgentStatus,
  type ContactStatus,
} from "@/lib/domain/enums";
import { agencyTone, agentTone, contactTone } from "@/lib/design/tones";

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

/* EXAMPLE ENTITY (contacts) — safe to delete; see README "Removing the example
 * entity". Status badges compose the generic Badge atom with the entity's
 * label map and tone map; add one of these per status enum. */
export function ContactBadge({ status }: { status: ContactStatus }) {
  return (
    <Badge tone={contactTone[status]}>
      <span className="bdot" />
      {CONTACT_STATUS_LABELS[status]}
    </Badge>
  );
}
