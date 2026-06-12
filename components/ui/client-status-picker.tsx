"use client";

/* Inline status picker pattern: generic StatusPicker + the entity's status
 * mutation + a toast; add one of these per status-bearing entity. */
import { StatusPicker, type StatusOption } from "@/components/ui/status-picker";
import { useToast } from "@/components/ui/toast";
import { useUpdateClientStatus } from "@/lib/data/hooks";
import { clientTone } from "@/lib/design/tones";
import { CLIENT_STATUSES, CLIENT_STATUS_LABELS, type ClientStatus } from "@/lib/domain/enums";

type Props = {
  clientId: string;
  clientLabel: string;
  status: ClientStatus;
};

const OPTIONS: StatusOption<ClientStatus>[] = CLIENT_STATUSES.map((s) => ({
  value: s,
  label: CLIENT_STATUS_LABELS[s],
  tone: clientTone[s],
}));

export function ClientStatusPicker({ clientId, clientLabel, status }: Props) {
  const updateStatus = useUpdateClientStatus();
  const toast = useToast();

  function onChange(next: ClientStatus) {
    if (next === status || updateStatus.isPending) return;
    updateStatus.mutate(
      { id: clientId, status: next },
      {
        onSuccess: () => toast(`${clientLabel} marked ${CLIENT_STATUS_LABELS[next]}`, "success"),
        onError: (e) => toast(`Could not update status: ${e.message}`, "error"),
      },
    );
  }

  return (
    <StatusPicker
      value={status}
      options={OPTIONS}
      ariaLabel={`Status for ${clientLabel}`}
      pending={updateStatus.isPending}
      onSelect={onChange}
    />
  );
}
