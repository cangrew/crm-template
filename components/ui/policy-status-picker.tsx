"use client";

/* Inline status picker pattern: generic StatusPicker + the entity's status
 * mutation + a toast (see client-status-picker.tsx). */
import { StatusPicker, type StatusOption } from "@/components/ui/status-picker";
import { useToast } from "@/components/ui/toast";
import { useUpdatePolicyStatus } from "@/lib/data/hooks";
import { policyTone } from "@/lib/design/tones";
import { POLICY_STATUSES, POLICY_STATUS_LABELS, type PolicyStatus } from "@/lib/domain/enums";

type Props = {
  policyId: string;
  policyLabel: string;
  status: PolicyStatus;
};

const OPTIONS: StatusOption<PolicyStatus>[] = POLICY_STATUSES.map((s) => ({
  value: s,
  label: POLICY_STATUS_LABELS[s],
  tone: policyTone[s],
}));

export function PolicyStatusPicker({ policyId, policyLabel, status }: Props) {
  const updateStatus = useUpdatePolicyStatus();
  const toast = useToast();

  function onChange(next: PolicyStatus) {
    if (next === status || updateStatus.isPending) return;
    updateStatus.mutate(
      { id: policyId, status: next },
      {
        onSuccess: () => toast(`${policyLabel} marked ${POLICY_STATUS_LABELS[next]}`, "success"),
        onError: (e) => toast(`Could not update status: ${e.message}`, "error"),
      },
    );
  }

  return (
    <StatusPicker
      value={status}
      options={OPTIONS}
      ariaLabel={`Status for ${policyLabel}`}
      pending={updateStatus.isPending}
      onSelect={onChange}
    />
  );
}
