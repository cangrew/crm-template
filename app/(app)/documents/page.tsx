"use client";

import { FileText, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { CardGrid } from "@/components/common/card-grid";
import { PageHeader } from "@/components/common/page-header";
import { PageErrorState } from "@/components/common/page-states";
import { DocumentCard } from "@/components/documents/document-card";
import { DocumentsFilterBar } from "@/components/documents/documents-filter-bar";
import { UploadDocumentModal } from "@/components/documents/upload-document-modal";
import { Btn } from "@/components/ui/btn";
import { EmptyState } from "@/components/ui/states";
import { can } from "@/lib/auth/roles";
import { useCurrentProfile, useDocuments } from "@/lib/data/hooks";

const SKELETON_COUNT = 8;

export default function DocumentsPage() {
  const docsQ = useDocuments();
  const profileQ = useCurrentProfile();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  const role = profileQ.data?.role ?? null;
  const canUpload = role != null && can(role, "create", "documents");

  const docs = docsQ.data;

  const allKinds = useMemo(() => {
    const set = new Set<string>();
    for (const d of docs ?? []) set.add(d.kind);
    return Array.from(set).sort();
  }, [docs]);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return (docs ?? []).filter((d) => {
      if (ql && !(d.kind.toLowerCase().includes(ql) || d.storage_path.toLowerCase().includes(ql)))
        return false;
      if (kind && d.kind !== kind) return false;
      return true;
    });
  }, [docs, q, kind]);

  const all = docs ?? [];

  if (docsQ.isError) {
    return <PageErrorState body="Failed to fetch documents." onRetry={() => docsQ.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        title="Documents"
        subtitle={`${all.length} file${all.length === 1 ? "" : "s"} on record`}
        actions={
          canUpload ? (
            <Btn variant="primary" icon={<Upload size={17} />} onClick={() => setUploadOpen(true)}>
              Upload
            </Btn>
          ) : undefined
        }
      />

      <DocumentsFilterBar q={q} onQ={setQ} kind={kind} onKind={setKind} kinds={allKinds} />

      {docsQ.isLoading ? (
        <CardGrid>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div
              key={i}
              className="border-border bg-bg min-h-[140px] rounded-[var(--radius-lg)] border p-[18px] shadow-[var(--shadow-card)]"
            >
              <div className="skel h-[14px] w-[60%]" />
              <div className="skel mt-2.5 h-3 w-[80%]" />
            </div>
          ))}
        </CardGrid>
      ) : filtered.length === 0 ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <EmptyState
            icon={FileText}
            title={all.length === 0 ? "No documents yet" : "No documents match these filters"}
            body={
              all.length === 0
                ? "Contracts and invoices will land here once teammates upload them."
                : "Try clearing a filter."
            }
            action={
              canUpload ? (
                <Btn
                  variant="primary"
                  icon={<Upload size={15} />}
                  onClick={() => setUploadOpen(true)}
                >
                  Upload document
                </Btn>
              ) : undefined
            }
          />
        </div>
      ) : (
        <CardGrid>
          {filtered.map((d) => (
            <DocumentCard key={d.id} doc={d} />
          ))}
        </CardGrid>
      )}

      <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
