"use client";

import { StatusPicker, type StatusOption } from "@/components/ui/status-picker";
import { useToast } from "@/components/ui/toast";
import { useUpdateAgencyStatus } from "@/lib/data/hooks";
import { agencyTone } from "@/lib/design/tones";
import { AGENCY_STATUSES, AGENCY_STATUS_LABELS, type AgencyStatus } from "@/lib/domain/enums";

type Props = {
  agencyId: string;
  agencyLabel: string;
  status: AgencyStatus;
};

const OPTIONS: StatusOption<AgencyStatus>[] = AGENCY_STATUSES.map((s) => ({
  value: s,
  label: AGENCY_STATUS_LABELS[s],
  tone: agencyTone[s],
}));

export function AgencyStatusPicker({ agencyId, agencyLabel, status }: Props) {
  const updateStatus = useUpdateAgencyStatus();
  const toast = useToast();

  function onChange(next: AgencyStatus) {
    if (next === status || updateStatus.isPending) return;
    updateStatus.mutate(
      { id: agencyId, status: next },
      {
        onSuccess: () => toast(`${agencyLabel} marked ${AGENCY_STATUS_LABELS[next]}`, "success"),
        onError: (e) => toast(`Could not update status: ${e.message}`, "error"),
      },
    );
  }

  return (
    <StatusPicker
      value={status}
      options={OPTIONS}
      ariaLabel={`Status for ${agencyLabel}`}
      pending={updateStatus.isPending}
      onSelect={onChange}
    />
  );
}
