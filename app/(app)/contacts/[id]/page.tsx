"use client";

/* EXAMPLE ENTITY — safe to delete; see README "Removing the example entity".
 * Detail-page pattern: PageHeader with edit/delete actions, useDetailEdit +
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
  type ContactDraft,
  draftFromContact,
  draftToPatch,
} from "@/components/contacts/detail/contact-draft";
import { ContactDocumentsTable } from "@/components/contacts/detail/contact-documents-table";
import { ContactProfileCard } from "@/components/contacts/detail/contact-profile-card";
import { ContactBadge } from "@/components/ui/badges";
import { Btn } from "@/components/ui/btn";
import { ContactStatusPicker } from "@/components/ui/contact-status-picker";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { can } from "@/lib/auth/roles";
import {
  useContact,
  useCurrentProfile,
  useDeleteContact,
  useDocumentsByContact,
  useUpdateContact,
} from "@/lib/data/hooks";
import { contactUpdateSchema, type ContactUpdate } from "@/lib/domain/schemas";
import { useDetailEdit } from "@/lib/forms/use-detail-edit";

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const contactQ = useContact(id);
  const documentsQ = useDocumentsByContact(id);
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const profileQ = useCurrentProfile();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const edit = useDetailEdit<ContactDraft, ContactUpdate>({
    toPatch: draftToPatch,
    schema: contactUpdateSchema,
    onInvalid: () => toast("Please fix the highlighted fields.", "error"),
    onValid: (patch) => {
      const current = contactQ.data;
      if (!current) return;
      updateContact.mutate(
        { id: current.id, patch },
        {
          onSuccess: () => {
            edit.finish();
            toast("Contact updated", "success");
          },
          onError: (e) => toast(`Could not save: ${e.message}`, "error"),
        },
      );
    },
  });

  const role = profileQ.data?.role ?? null;
  const canUpdate = role != null && can(role, "update", "contacts");
  const canDelete = role != null && can(role, "delete", "contacts");

  if (contactQ.isError) {
    return (
      <PageErrorState body="Failed to load this contact." onRetry={() => contactQ.refetch()} />
    );
  }

  if (contactQ.isLoading || !contactQ.data) {
    return <PageDetailLoading rows={5} />;
  }

  const c = contactQ.data;

  function doDelete() {
    deleteContact.mutate(c.id, {
      onSuccess: () => {
        toast("Contact removed", "success");
        router.push("/contacts");
      },
      onError: (e) => toast(`Could not delete: ${e.message}`, "error"),
    });
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        backHref="/contacts"
        backLabel="Back to Contacts"
        title={c.name}
        subtitle={
          <>
            <span className="mono">{c.id.slice(0, 8)}</span>
            {c.company ? ` · ${c.company}` : ""}
          </>
        }
        badges={
          canUpdate ? (
            <ContactStatusPicker contactId={c.id} contactLabel={c.name} status={c.status} />
          ) : (
            <ContactBadge status={c.status} />
          )
        }
        actions={
          !edit.editing ? (
            <>
              {canUpdate && (
                <Btn
                  variant="outline"
                  icon={<Edit2 size={15} />}
                  onClick={() => edit.start(draftFromContact(c))}
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
                disabled={updateContact.isPending}
                onClick={edit.save}
              >
                {updateContact.isPending ? "Saving…" : "Save"}
              </Btn>
            </>
          )
        }
      />

      <TwoColumnLayout
        left={
          <ContactProfileCard
            contact={c}
            editing={edit.editing}
            draft={edit.draft ?? undefined}
            errors={edit.errors}
            onField={edit.setField}
          />
        }
        right={<ContactDocumentsTable documents={documentsQ.data ?? []} />}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doDelete}
        title="Delete contact?"
        body={`Permanently remove ${c.name}. Attached documents will be deleted with it.`}
        hint="This cannot be undone."
      />
    </div>
  );
}
