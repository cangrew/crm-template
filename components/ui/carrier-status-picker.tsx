"use client";

/* Inline status picker pattern: generic StatusPicker + the entity's status
 * mutation + a toast (see client-status-picker.tsx). */
import { StatusPicker, type StatusOption } from "@/components/ui/status-picker";
import { useToast } from "@/components/ui/toast";
import { useUpdateCarrierStatus } from "@/lib/data/hooks";
import { carrierTone } from "@/lib/design/tones";
import { CARRIER_STATUSES, CARRIER_STATUS_LABELS, type CarrierStatus } from "@/lib/domain/enums";

type Props = {
  carrierId: string;
  carrierLabel: string;
  status: CarrierStatus;
};

const OPTIONS: StatusOption<CarrierStatus>[] = CARRIER_STATUSES.map((s) => ({
  value: s,
  label: CARRIER_STATUS_LABELS[s],
  tone: carrierTone[s],
}));

export function CarrierStatusPicker({ carrierId, carrierLabel, status }: Props) {
  const updateStatus = useUpdateCarrierStatus();
  const toast = useToast();

  function onChange(next: CarrierStatus) {
    if (next === status || updateStatus.isPending) return;
    updateStatus.mutate(
      { id: carrierId, status: next },
      {
        onSuccess: () => toast(`${carrierLabel} marked ${CARRIER_STATUS_LABELS[next]}`, "success"),
        onError: (e) => toast(`Could not update status: ${e.message}`, "error"),
      },
    );
  }

  return (
    <StatusPicker
      value={status}
      options={OPTIONS}
      ariaLabel={`Status for ${carrierLabel}`}
      pending={updateStatus.isPending}
      onSelect={onChange}
    />
  );
}
