"use client";

/* Mapping creation ships with the statement importer; until then this table
 * only lists and removes existing mappings. */
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { EntityTable, type EntityColumn } from "@/components/common/entity-table";
import { Btn } from "@/components/ui/btn";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useDeleteCsvMapping } from "@/lib/data/hooks";
import type { CarrierCsvMapping } from "@/lib/supabase/types";

export function CarrierCsvMappingsTable({
  mappings,
  canManage,
}: {
  mappings: readonly CarrierCsvMapping[];
  /** Whether the current role may remove mappings (staff only). */
  canManage: boolean;
}) {
  const deleteMapping = useDeleteCsvMapping();
  const toast = useToast();
  const [pendingDelete, setPendingDelete] = useState<CarrierCsvMapping | null>(null);

  function doDelete() {
    if (!pendingDelete) return;
    deleteMapping.mutate(pendingDelete.id, {
      onSuccess: () => toast("CSV mapping removed", "success"),
      onError: (e) => toast(`Could not delete: ${e.message}`, "error"),
    });
    setPendingDelete(null);
  }

  const columns: EntityColumn<CarrierCsvMapping>[] = [
    { key: "name", label: "Name", className: "strong", render: (m) => m.name },
    {
      key: "signature",
      label: "Header signature",
      className: "mono muted",
      render: (m) => (
        <div className="max-w-[280px] truncate text-[11.5px]">{m.header_signature ?? "—"}</div>
      ),
    },
    { key: "added", label: "Added", className: "muted", render: (m) => m.created_at.slice(0, 10) },
  ];

  if (canManage) {
    columns.push({
      key: "actions",
      label: "",
      align: "right",
      className: "text-right",
      render: (m) => (
        <Btn
          variant="ghost"
          size="sm"
          icon={<Trash2 size={14} />}
          aria-label="Delete CSV mapping"
          disabled={deleteMapping.isPending}
          onClick={() => setPendingDelete(m)}
        />
      ),
    });
  }

  return (
    <>
      <EntityTable
        title="CSV mappings"
        rows={mappings}
        columns={columns}
        emptyText="No statement mappings yet — the statement importer creates them on first upload."
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={doDelete}
        title="Delete CSV mapping?"
        body={`Permanently remove ${pendingDelete?.name ?? "this mapping"}. Future statement uploads will no longer auto-match it.`}
        hint="This cannot be undone."
      />
    </>
  );
}
