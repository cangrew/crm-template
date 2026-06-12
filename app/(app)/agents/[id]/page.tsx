"use client";

import { Edit2, Save, Trash2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { PageDetailLoading, PageErrorState } from "@/components/common/page-states";
import { TwoColumnLayout } from "@/components/common/two-column-layout";
import {
  type AgentDraft,
  draftFromAgent,
  draftToPatch,
} from "@/components/agents/detail/agent-draft";
import { AgentPoliciesTable } from "@/components/agents/detail/agent-policies-table";
import { AgentProfileCard } from "@/components/agents/detail/agent-profile-card";
import { AgentBadge } from "@/components/ui/badges";
import { Btn } from "@/components/ui/btn";
import { AgentStatusPicker } from "@/components/ui/agent-status-picker";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { can } from "@/lib/auth/roles";
import {
  useAgencies,
  useAgent,
  useCurrentProfile,
  useDeleteAgent,
  usePoliciesByAgent,
  useUpdateAgent,
} from "@/lib/data/hooks";
import { agentUpdateSchema, type AgentUpdate } from "@/lib/domain/schemas";
import { useDetailEdit } from "@/lib/forms/use-detail-edit";

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const agentQ = useAgent(id);
  const agenciesQ = useAgencies();
  const policiesQ = usePoliciesByAgent(id);
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const profileQ = useCurrentProfile();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const edit = useDetailEdit<AgentDraft, AgentUpdate>({
    toPatch: draftToPatch,
    schema: agentUpdateSchema,
    onInvalid: () => toast("Please fix the highlighted fields.", "error"),
    onValid: (patch) => {
      const current = agentQ.data;
      if (!current) return;
      updateAgent.mutate(
        { id: current.id, patch },
        {
          onSuccess: () => {
            edit.finish();
            toast("Agent updated", "success");
          },
          onError: (e) => toast(`Could not save: ${e.message}`, "error"),
        },
      );
    },
  });

  const role = profileQ.data?.role ?? null;
  const canUpdate = role != null && can(role, "update", "agents");
  const canDelete = role != null && can(role, "delete", "agents");

  if (agentQ.isError) {
    return <PageErrorState body="Failed to load this agent." onRetry={() => agentQ.refetch()} />;
  }

  if (agentQ.isLoading || !agentQ.data) {
    return <PageDetailLoading rows={5} />;
  }

  const a = agentQ.data;

  function doDelete() {
    deleteAgent.mutate(a.id, {
      onSuccess: () => {
        toast("Agent removed", "success");
        router.push("/agents");
      },
      onError: (e) => toast(`Could not delete: ${e.message}`, "error"),
    });
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        backHref="/agents"
        backLabel="Back to Agents"
        title={a.full_name}
        subtitle={
          <>
            <span className="mono">{a.id.slice(0, 8)}</span>
            {a.npn ? ` · NPN ${a.npn}` : ""}
          </>
        }
        badges={
          canUpdate ? (
            <AgentStatusPicker agentId={a.id} agentLabel={a.full_name} status={a.status} />
          ) : (
            <AgentBadge status={a.status} />
          )
        }
        actions={
          !edit.editing ? (
            <>
              {canUpdate && (
                <Btn
                  variant="outline"
                  icon={<Edit2 size={15} />}
                  onClick={() => edit.start(draftFromAgent(a))}
                >
                  Edit
                </Btn>
              )}
              {canDelete && (
                <Btn
                  variant="danger"
                  icon={<Trash2 size={15} />}
                  onClick={() => setConfirmOpen(true)}
                >
                  Delete
                </Btn>
              )}
            </>
          ) : (
            <>
              <Btn variant="ghost" icon={<X size={15} />} onClick={edit.cancel}>
                Cancel
              </Btn>
              <Btn
                variant="primary"
                icon={<Save size={15} />}
                disabled={updateAgent.isPending}
                onClick={edit.save}
              >
                {updateAgent.isPending ? "Saving…" : "Save"}
              </Btn>
            </>
          )
        }
      />

      <TwoColumnLayout
        left={
          <AgentProfileCard
            agent={a}
            agencies={agenciesQ.data ?? []}
            editing={edit.editing}
            draft={edit.draft ?? undefined}
            errors={edit.errors}
            onField={edit.setField}
          />
        }
        right={<AgentPoliciesTable policies={policiesQ.data ?? []} />}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doDelete}
        title="Delete agent?"
        body={`Permanently remove ${a.full_name}.`}
        hint="This cannot be undone."
      />
    </div>
  );
}
