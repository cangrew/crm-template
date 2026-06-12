"use client";

/* Detail-page pattern: PageHeader with edit/delete actions, useDetailEdit +
 * draft module for the edit flow, InfoCard/KvList for fields, EntityTable for
 * related records, ConfirmDialog for destructive actions, and can()-gated
 * affordances per role. */
import { Edit2, Save, Trash2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { PageDetailLoading, PageErrorState } from "@/components/common/page-states";
import { TwoColumnLayout } from "@/components/common/two-column-layout";
import {
  type ClientDraft,
  draftFromClient,
  draftToPatch,
} from "@/components/clients/detail/client-draft";
import { ClientDocumentsTable } from "@/components/clients/detail/client-documents-table";
import { ClientProfileCard } from "@/components/clients/detail/client-profile-card";
import { ClientBadge } from "@/components/ui/badges";
import { Btn } from "@/components/ui/btn";
import { ClientStatusPicker } from "@/components/ui/client-status-picker";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { can } from "@/lib/auth/roles";
import {
  useAgents,
  useClient,
  useCurrentProfile,
  useDeleteClient,
  useDocumentsByClient,
  useUpdateClient,
} from "@/lib/data/hooks";
import { clientUpdateSchema, type ClientUpdate } from "@/lib/domain/schemas";
import { useDetailEdit } from "@/lib/forms/use-detail-edit";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const clientQ = useClient(id);
  const documentsQ = useDocumentsByClient(id);
  const agentsQ = useAgents();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const profileQ = useCurrentProfile();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const edit = useDetailEdit<ClientDraft, ClientUpdate>({
    toPatch: draftToPatch,
    schema: clientUpdateSchema,
    onInvalid: () => toast("Please fix the highlighted fields.", "error"),
    onValid: (patch) => {
      const current = clientQ.data;
      if (!current) return;
      updateClient.mutate(
        { id: current.id, patch },
        {
          onSuccess: () => {
            edit.finish();
            toast("Client updated", "success");
          },
          onError: (e) => toast(`Could not save: ${e.message}`, "error"),
        },
      );
    },
  });

  const role = profileQ.data?.role ?? null;
  const canUpdate = role != null && can(role, "update", "clients");
  const canDelete = role != null && can(role, "delete", "clients");

  if (clientQ.isError) {
    return <PageErrorState body="Failed to load this client." onRetry={() => clientQ.refetch()} />;
  }

  if (clientQ.isLoading || !clientQ.data) {
    return <PageDetailLoading rows={5} />;
  }

  const c = clientQ.data;
  const fullName = `${c.first_name} ${c.last_name}`;

  function doDelete() {
    deleteClient.mutate(c.id, {
      onSuccess: () => {
        toast("Client removed", "success");
        router.push("/clients");
      },
      onError: (e) => toast(`Could not delete: ${e.message}`, "error"),
    });
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        backHref="/clients"
        backLabel="Back to Clients"
        title={fullName}
        subtitle={<span className="mono">{c.id.slice(0, 8)}</span>}
        badges={
          canUpdate ? (
            <ClientStatusPicker clientId={c.id} clientLabel={fullName} status={c.status} />
          ) : (
            <ClientBadge status={c.status} />
          )
        }
        actions={
          !edit.editing ? (
            <>
              {canUpdate && (
                <Btn
                  variant="outline"
                  icon={<Edit2 size={15} />}
                  onClick={() => edit.start(draftFromClient(c))}
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
                disabled={updateClient.isPending}
                onClick={edit.save}
              >
                {updateClient.isPending ? "Saving…" : "Save"}
              </Btn>
            </>
          )
        }
      />

      <TwoColumnLayout
        left={
          <ClientProfileCard
            client={c}
            agents={agentsQ.data ?? []}
            editing={edit.editing}
            draft={edit.draft ?? undefined}
            errors={edit.errors}
            onField={edit.setField}
          />
        }
        right={<ClientDocumentsTable documents={documentsQ.data ?? []} />}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doDelete}
        title="Delete client?"
        body={`Permanently remove ${fullName}. Attached documents will be deleted with it.`}
        hint="This cannot be undone."
      />
    </div>
  );
}
