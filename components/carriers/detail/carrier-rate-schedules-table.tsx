"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EntityTable, type EntityColumn } from "@/components/common/entity-table";
import { Btn } from "@/components/ui/btn";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useDeleteRateSchedule } from "@/lib/data/hooks";
import { fmtMoneyCents } from "@/lib/design/format";
import { fmtBpsPercent } from "@/lib/domain/bps";
import { BUSINESS_TYPE_LABELS, RATE_TYPE_LABELS } from "@/lib/domain/enums";
import type { RateSchedule } from "@/lib/supabase/types";
import { NewRateScheduleModal } from "./new-rate-schedule-modal";

/** "$22.00 PMPM" for flat rates, "5%" for percent-of-premium rates.
 * fmtMoneyCents formats a dollar-valued number, so cents divide by 100. */
function rateValue(r: RateSchedule): string {
  if (r.rate_type === "pmpm" && r.pmpm_cents != null) {
    return `${fmtMoneyCents(r.pmpm_cents / 100)} PMPM`;
  }
  if (r.percent_bps != null) return fmtBpsPercent(r.percent_bps);
  return "—";
}

export function CarrierRateSchedulesTable({
  carrierId,
  schedules,
  canManage,
}: {
  carrierId: string;
  schedules: readonly RateSchedule[];
  /** Whether the current role may add/remove rates (staff only). */
  canManage: boolean;
}) {
  const deleteRate = useDeleteRateSchedule();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<RateSchedule | null>(null);

  function doDelete() {
    if (!pendingDelete) return;
    deleteRate.mutate(pendingDelete.id, {
      onSuccess: () => toast("Rate schedule removed", "success"),
      onError: (e) => toast(`Could not delete: ${e.message}`, "error"),
    });
    setPendingDelete(null);
  }

  const columns: EntityColumn<RateSchedule>[] = [
    {
      key: "type",
      label: "Type",
      className: "strong",
      render: (r) => RATE_TYPE_LABELS[r.rate_type],
    },
    {
      key: "business",
      label: "Business",
      className: "muted",
      render: (r) => BUSINESS_TYPE_LABELS[r.business_type],
    },
    { key: "rate", label: "Rate", align: "right", className: "cell-num", render: rateValue },
    {
      key: "window",
      label: "Effective",
      className: "muted",
      render: (r) => `${r.effective_from} → ${r.effective_to ?? "open"}`,
    },
    { key: "state", label: "State", className: "muted", render: (r) => r.state ?? "All" },
  ];

  if (canManage) {
    columns.push({
      key: "actions",
      label: "",
      align: "right",
      className: "text-right",
      render: (r) => (
        <Btn
          variant="ghost"
          size="sm"
          icon={<Trash2 size={14} />}
          aria-label="Delete rate schedule"
          disabled={deleteRate.isPending}
          onClick={() => setPendingDelete(r)}
        />
      ),
    });
  }

  return (
    <>
      <EntityTable
        title="Rate schedules"
        rows={schedules}
        columns={columns}
        emptyText="No rate schedules for this carrier yet."
        action={
          canManage ? (
            <Btn
              variant="outline"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setAddOpen(true)}
            >
              Add rate
            </Btn>
          ) : undefined
        }
      />

      <NewRateScheduleModal
        carrierId={carrierId}
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={doDelete}
        title="Delete rate schedule?"
        body="Permanently remove this rate window. Statements imported later will no longer match it."
        hint="This cannot be undone."
      />
    </>
  );
}
