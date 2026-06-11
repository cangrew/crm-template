import { Badge } from "@/components/ui/badge";
import { CONTACT_STATUS_LABELS, type ContactStatus } from "@/lib/domain/enums";
import { contactTone } from "@/lib/design/tones";

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
