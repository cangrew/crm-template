"use client";
import { Select } from "@/components/ui/input";

import { useState } from "react";
import { FormModal } from "@/components/common/form-modal";
import { FormField as Field } from "@/components/ui/form-field";
import { Dropzone, FileCard } from "@/components/ui/dropzone";
import { useToast } from "@/components/ui/toast";
import { documentStoragePath } from "@/lib/data/documents";
import {
  useContacts,
  useCreateDocument,
  useCurrentProfile,
  useSignedUpload,
} from "@/lib/data/hooks";
import { DOCUMENT_KINDS, type DocumentKind } from "@/lib/domain/schemas";

const KIND_LABELS: Record<DocumentKind, string> = {
  contract: "Contract",
  invoice: "Invoice",
  other: "Other",
};

const ACCEPT = "application/pdf,image/png,image/jpeg";

export function UploadDocumentModal({
  open,
  onClose,
  defaultContactId,
}: {
  open: boolean;
  onClose: () => void;
  defaultContactId?: string;
}) {
  const toast = useToast();
  const contactsQ = useContacts();
  const profileQ = useCurrentProfile();
  const signedUpload = useSignedUpload();
  const createDocument = useCreateDocument();

  const [contactId, setContactId] = useState(defaultContactId ?? "");
  const [kind, setKind] = useState<DocumentKind>("contract");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const contacts = contactsQ.data ?? [];
  const pending = signedUpload.isPending || createDocument.isPending;

  function reset() {
    setContactId(defaultContactId ?? "");
    setKind("contract");
    setFile(null);
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function submit() {
    if (!file) return setError("Choose a file to upload.");
    setError(null);

    const path = documentStoragePath(contactId || "general", kind, file.name);
    try {
      await signedUpload.mutateAsync({ path, file });
      await createDocument.mutateAsync({
        contact_id: contactId || null,
        kind,
        storage_path: path,
        uploaded_by: profileQ.data?.id,
      });
      toast(`${KIND_LABELS[kind]} uploaded`, "success");
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    }
  }

  return (
    <FormModal
      open={open}
      onClose={close}
      title="Upload document"
      submitLabel="Upload"
      pendingLabel="Uploading…"
      isPending={pending}
      submitDisabled={!file}
      onSubmit={submit}
    >
      {error && (
        <div className="rounded-[var(--radius-md)] border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-[13px] text-[#b91c1c]">
          {error}
        </div>
      )}

      <Field label="Contact (optional)">
        <Select value={contactId} onChange={(e) => setContactId(e.target.value)}>
          <option value="">No linked contact</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name + (c.company ? ` · ${c.company}` : "")}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Type" required>
        <Select value={kind} onChange={(e) => setKind(e.target.value as DocumentKind)}>
          {DOCUMENT_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </Select>
      </Field>

      {file ? (
        <FileCard
          name={file.name}
          meta={`${(file.size / 1024).toFixed(0)} KB`}
          fmt={file.type.startsWith("image/") ? "img" : "pdf"}
          onRemove={() => setFile(null)}
        />
      ) : (
        <Dropzone onFile={setFile} accept={ACCEPT} />
      )}

      <p className="text-ink-500 m-0 text-[12.5px]">
        Files are stored privately; downloads are brokered through signed URLs. Linking a contact
        scopes the document to their record.
      </p>
    </FormModal>
  );
}
