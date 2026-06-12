"use client";

import { Edit2, Save, Trash2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { PageDetailLoading, PageErrorState } from "@/components/common/page-states";
import { TwoColumnLayout } from "@/components/common/two-column-layout";
import {
  type PolicyDraft,
  draftFromPolicy,
  draftToPatch,
} from "@/components/policies/detail/policy-draft";
import { PolicyProfileCard } from "@/components/policies/detail/policy-profile-card";
import { policyLabel } from "@/components/policies/policies-table";
import { InfoCard } from "@/components/common/info-card";
import { PolicyBadge } from "@/components/ui/badges";
import { Btn } from "@/components/ui/btn";
import { PolicyStatusPicker } from "@/components/ui/policy-status-picker";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { can } from "@/lib/auth/roles";
import {
  useAgents,
  useCarriers,
  useClients,
  useCurrentProfile,
  useDeletePolicy,
  usePolicy,
  useUpdatePolicy,
} from "@/lib/data/hooks";
import { policyUpdateSchema, type PolicyUpdate } from "@/lib/domain/schemas";
import { useDetailEdit } from "@/lib/forms/use-detail-edit";

export default function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const policyQ = usePolicy(id);
  const clientsQ = useClients();
  const carriersQ = useCarriers();
  const agentsQ = useAgents();
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();
  const profileQ = useCurrentProfile();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const edit = useDetailEdit<PolicyDraft, PolicyUpdate>({
    toPatch: draftToPatch,
    schema: policyUpdateSchema,
    onInvalid: () => toast("Please fix the highlighted fields.", "error"),
    onValid: (patch) => {
      const current = policyQ.data;
      if (!current) return;
      updatePolicy.mutate(
        { id: current.id, patch },
        {
          onSuccess: () => {
            edit.finish();
            toast("Policy updated", "success");
          },
          onError: (e) => toast(`Could not save: ${e.message}`, "error"),
        },
      );
    },
  });

  const role = profileQ.data?.role ?? null;
  const canUpdate = role != null && can(role, "update", "policies");
  const canDelete = role != null && can(role, "delete", "policies");

  if (policyQ.isError) {
    return <PageErrorState body="Failed to load this policy." onRetry={() => policyQ.refetch()} />;
  }

  if (policyQ.isLoading || !policyQ.data) {
    return <PageDetailLoading rows={5} />;
  }

  const p = policyQ.data;
  const label = policyLabel(p);

  function doDelete() {
    deletePolicy.mutate(p.id, {
      onSuccess: () => {
        toast("Policy removed", "success");
        router.push("/policies");
      },
      onError: (e) => toast(`Could not delete: ${e.message}`, "error"),
    });
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        backHref="/policies"
        backLabel="Back to Policies"
        title={label}
        subtitle={
          <>
            <span className="mono">{p.id.slice(0, 8)}</span>
            {p.plan_name ? ` · ${p.plan_name}` : ""}
          </>
        }
        badges={
          canUpdate ? (
            <PolicyStatusPicker policyId={p.id} policyLabel={label} status={p.status} />
          ) : (
            <PolicyBadge status={p.status} />
          )
        }
        actions={
          !edit.editing ? (
            <>
              {canUpdate && (
                <Btn
                  variant="outline"
                  icon={<Edit2 size={15} />}
                  onClick={() => edit.start(draftFromPolicy(p))}
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
                disabled={updatePolicy.isPending}
                onClick={edit.save}
              >
                {updatePolicy.isPending ? "Saving…" : "Save"}
              </Btn>
            </>
          )
        }
      />

      <TwoColumnLayout
        left={
          <PolicyProfileCard
            policy={p}
            clients={clientsQ.data ?? []}
            carriers={carriersQ.data ?? []}
            agents={agentsQ.data ?? []}
            editing={edit.editing}
            draft={edit.draft ?? undefined}
            errors={edit.errors}
            onField={edit.setField}
          />
        }
        right={
          <InfoCard title="Commissions">
            <p className="muted text-[13.5px]">
              Commission history will appear here once statements land.
            </p>
          </InfoCard>
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doDelete}
        title="Delete policy?"
        body={`Permanently remove ${label}.`}
        hint="This cannot be undone."
      />
    </div>
  );
}
