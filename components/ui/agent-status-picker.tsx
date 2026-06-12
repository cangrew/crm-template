"use client";

import { StatusPicker, type StatusOption } from "@/components/ui/status-picker";
import { useToast } from "@/components/ui/toast";
import { useUpdateAgentStatus } from "@/lib/data/hooks";
import { agentTone } from "@/lib/design/tones";
import { AGENT_STATUSES, AGENT_STATUS_LABELS, type AgentStatus } from "@/lib/domain/enums";

type Props = {
  agentId: string;
  agentLabel: string;
  status: AgentStatus;
};

const OPTIONS: StatusOption<AgentStatus>[] = AGENT_STATUSES.map((s) => ({
  value: s,
  label: AGENT_STATUS_LABELS[s],
  tone: agentTone[s],
}));

export function AgentStatusPicker({ agentId, agentLabel, status }: Props) {
  const updateStatus = useUpdateAgentStatus();
  const toast = useToast();

  function onChange(next: AgentStatus) {
    if (next === status || updateStatus.isPending) return;
    updateStatus.mutate(
      { id: agentId, status: next },
      {
        onSuccess: () => toast(`${agentLabel} marked ${AGENT_STATUS_LABELS[next]}`, "success"),
        onError: (e) => toast(`Could not update status: ${e.message}`, "error"),
      },
    );
  }

  return (
    <StatusPicker
      value={status}
      options={OPTIONS}
      ariaLabel={`Status for ${agentLabel}`}
      pending={updateStatus.isPending}
      onSelect={onChange}
    />
  );
}
