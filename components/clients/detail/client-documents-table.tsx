"use client";

/* Related-records table pattern: EntityTable with a column config (never
 * hand-rolled <table> markup on detail pages). */
import { Download } from "lucide-react";
import { EntityTable, type EntityColumn } from "@/components/common/entity-table";
import { Badge } from "@/components/ui/badge";
import { Btn } from "@/components/ui/btn";
import { useToast } from "@/components/ui/toast";
import { useSignedDownload } from "@/lib/data/hooks";
import type { DocumentRow } from "@/lib/supabase/types";

function fileNameOf(path: string): string {
  return path.split("/").pop() ?? path;
}

export function ClientDocumentsTable({ documents }: { documents: readonly DocumentRow[] }) {
  const signedDownload = useSignedDownload();
  const toast = useToast();

  function download(id: string) {
    signedDownload.mutate(id, {
      onSuccess: (url) => window.open(url, "_blank", "noopener"),
      onError: (e) => toast(e.message, "error"),
    });
  }

  const columns: readonly EntityColumn<DocumentRow>[] = [
    {
      key: "file",
      label: "File",
      className: "strong",
      render: (d) => <span className="mono text-[12.5px]">{fileNameOf(d.storage_path)}</span>,
    },
    {
      key: "kind",
      label: "Kind",
      render: (d) => (
        <Badge tone="t-slate">
          <span className="bdot" />
          {d.kind}
        </Badge>
      ),
    },
    {
      key: "uploaded",
      label: "Uploaded",
      className: "muted",
      render: (d) => d.created_at.slice(0, 10),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      className: "text-right",
      render: (d) => (
        <Btn
          variant="ghost"
          size="sm"
          icon={<Download size={14} />}
          disabled={signedDownload.isPending}
          onClick={() => download(d.id)}
        >
          Download
        </Btn>
      ),
    },
  ];

  return (
    <EntityTable
      title="Documents"
      rows={documents}
      columns={columns}
      emptyText="No documents attached to this client yet."
    />
  );
}
