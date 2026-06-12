"use client";

import { Edit2, Save, Trash2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { PageDetailLoading, PageErrorState } from "@/components/common/page-states";
import { TwoColumnLayout } from "@/components/common/two-column-layout";
import {
  type AgencyDraft,
  draftFromAgency,
  draftToPatch,
} from "@/components/agencies/detail/agency-draft";
import { AgencyAgentsTable } from "@/components/agencies/detail/agency-agents-table";
import { AgencyProfileCard } from "@/components/agencies/detail/agency-profile-card";
import { AgencyBadge } from "@/components/ui/badges";
import { Btn } from "@/components/ui/btn";
import { AgencyStatusPicker } from "@/components/ui/agency-status-picker";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { can } from "@/lib/auth/roles";
import {
  useAgency,
  useAgentsByAgency,
  useCurrentProfile,
  useDeleteAgency,
  useUpdateAgency,
} from "@/lib/data/hooks";
import { agencyUpdateSchema, type AgencyUpdate } from "@/lib/domain/schemas";
import { useDetailEdit } from "@/lib/forms/use-detail-edit";

export default function AgencyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const agencyQ = useAgency(id);
  const agentsQ = useAgentsByAgency(id);
  const updateAgency = useUpdateAgency();
  const deleteAgency = useDeleteAgency();
  const profileQ = useCurrentProfile();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const edit = useDetailEdit<AgencyDraft, AgencyUpdate>({
    toPatch: draftToPatch,
    schema: agencyUpdateSchema,
    onInvalid: () => toast("Please fix the highlighted fields.", "error"),
    onValid: (patch) => {
      const current = agencyQ.data;
      if (!current) return;
      updateAgency.mutate(
        { id: current.id, patch },
        {
          onSuccess: () => {
            edit.finish();
            toast("Agency updated", "success");
          },
          onError: (e) => toast(`Could not save: ${e.message}`, "error"),
        },
      );
    },
  });

  const role = profileQ.data?.role ?? null;
  const canUpdate = role != null && can(role, "update", "agencies");
  const canDelete = role != null && can(role, "delete", "agencies");

  if (agencyQ.isError) {
    return <PageErrorState body="Failed to load this agency." onRetry={() => agencyQ.refetch()} />;
  }

  if (agencyQ.isLoading || !agencyQ.data) {
    return <PageDetailLoading rows={5} />;
  }

  const g = agencyQ.data;

  function doDelete() {
    deleteAgency.mutate(g.id, {
      onSuccess: () => {
        toast("Agency removed", "success");
        router.push("/agencies");
      },
      onError: (e) => toast(`Could not delete: ${e.message}`, "error"),
    });
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        backHref="/agencies"
        backLabel="Back to Agencies"
        title={g.name}
        subtitle={<span className="mono">{g.id.slice(0, 8)}</span>}
        badges={
          canUpdate ? (
            <AgencyStatusPicker agencyId={g.id} agencyLabel={g.name} status={g.status} />
          ) : (
            <AgencyBadge status={g.status} />
          )
        }
        actions={
          !edit.editing ? (
            <>
              {canUpdate && (
                <Btn
                  variant="outline"
                  icon={<Edit2 size={15} />}
                  onClick={() => edit.start(draftFromAgency(g))}
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
                disabled={updateAgency.isPending}
                onClick={edit.save}
              >
                {updateAgency.isPending ? "Saving…" : "Save"}
              </Btn>
            </>
          )
        }
      />

      <TwoColumnLayout
        left={
          <AgencyProfileCard
            agency={g}
            editing={edit.editing}
            draft={edit.draft ?? undefined}
            errors={edit.errors}
            onField={edit.setField}
          />
        }
        right={<AgencyAgentsTable agents={agentsQ.data ?? []} />}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doDelete}
        title="Delete agency?"
        body={`Permanently remove ${g.name}. Its agents must be moved or removed first.`}
        hint="This cannot be undone."
      />
    </div>
  );
}
