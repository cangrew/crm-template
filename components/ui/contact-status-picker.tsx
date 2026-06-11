"use client";

/* EXAMPLE ENTITY — safe to delete; see README "Removing the example entity".
 * Inline status picker pattern: generic StatusPicker + the entity's status
 * mutation + a toast; add one of these per status-bearing entity. */
import { StatusPicker, type StatusOption } from "@/components/ui/status-picker";
import { useToast } from "@/components/ui/toast";
import { useUpdateContactStatus } from "@/lib/data/hooks";
import { contactTone } from "@/lib/design/tones";
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS, type ContactStatus } from "@/lib/domain/enums";

type Props = {
  contactId: string;
  contactLabel: string;
  status: ContactStatus;
};

const OPTIONS: StatusOption<ContactStatus>[] = CONTACT_STATUSES.map((s) => ({
  value: s,
  label: CONTACT_STATUS_LABELS[s],
  tone: contactTone[s],
}));

export function ContactStatusPicker({ contactId, contactLabel, status }: Props) {
  const updateStatus = useUpdateContactStatus();
  const toast = useToast();

  function onChange(next: ContactStatus) {
    if (next === status || updateStatus.isPending) return;
    updateStatus.mutate(
      { id: contactId, status: next },
      {
        onSuccess: () => toast(`${contactLabel} marked ${CONTACT_STATUS_LABELS[next]}`, "success"),
        onError: (e) => toast(`Could not update status: ${e.message}`, "error"),
      },
    );
  }

  return (
    <StatusPicker
      value={status}
      options={OPTIONS}
      ariaLabel={`Status for ${contactLabel}`}
      pending={updateStatus.isPending}
      onSelect={onChange}
    />
  );
}
