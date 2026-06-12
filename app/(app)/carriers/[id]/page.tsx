"use client";

import { Edit2, Save, Trash2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { PageDetailLoading, PageErrorState } from "@/components/common/page-states";
import { TwoColumnLayout } from "@/components/common/two-column-layout";
import {
  type CarrierDraft,
  draftFromCarrier,
  draftToPatch,
} from "@/components/carriers/detail/carrier-draft";
import { CarrierCsvMappingsTable } from "@/components/carriers/detail/carrier-csv-mappings-table";
import { CarrierProfileCard } from "@/components/carriers/detail/carrier-profile-card";
import { CarrierRateSchedulesTable } from "@/components/carriers/detail/carrier-rate-schedules-table";
import { CarrierBadge } from "@/components/ui/badges";
import { Btn } from "@/components/ui/btn";
import { CarrierStatusPicker } from "@/components/ui/carrier-status-picker";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { can } from "@/lib/auth/roles";
import {
  useCarrier,
  useCsvMappingsByCarrier,
  useCurrentProfile,
  useDeleteCarrier,
  useRateSchedulesByCarrier,
  useUpdateCarrier,
} from "@/lib/data/hooks";
import { carrierUpdateSchema, type CarrierUpdate } from "@/lib/domain/schemas";
import { useDetailEdit } from "@/lib/forms/use-detail-edit";

export default function CarrierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const carrierQ = useCarrier(id);
  const ratesQ = useRateSchedulesByCarrier(id);
  const mappingsQ = useCsvMappingsByCarrier(id);
  const updateCarrier = useUpdateCarrier();
  const deleteCarrier = useDeleteCarrier();
  const profileQ = useCurrentProfile();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const edit = useDetailEdit<CarrierDraft, CarrierUpdate>({
    toPatch: draftToPatch,
    schema: carrierUpdateSchema,
    onInvalid: () => toast("Please fix the highlighted fields.", "error"),
    onValid: (patch) => {
      const current = carrierQ.data;
      if (!current) return;
      updateCarrier.mutate(
        { id: current.id, patch },
        {
          onSuccess: () => {
            edit.finish();
            toast("Carrier updated", "success");
          },
          onError: (e) => toast(`Could not save: ${e.message}`, "error"),
        },
      );
    },
  });

  const role = profileQ.data?.role ?? null;
  const canUpdate = role != null && can(role, "update", "carriers");
  const canDelete = role != null && can(role, "delete", "carriers");

  if (carrierQ.isError) {
    return (
      <PageErrorState body="Failed to load this carrier." onRetry={() => carrierQ.refetch()} />
    );
  }

  if (carrierQ.isLoading || !carrierQ.data) {
    return <PageDetailLoading rows={5} />;
  }

  const k = carrierQ.data;

  function doDelete() {
    deleteCarrier.mutate(k.id, {
      onSuccess: () => {
        toast("Carrier removed", "success");
        router.push("/carriers");
      },
      onError: (e) => toast(`Could not delete: ${e.message}`, "error"),
    });
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        backHref="/carriers"
        backLabel="Back to Carriers"
        title={k.name}
        subtitle={<span className="mono">{k.id.slice(0, 8)}</span>}
        badges={
          canUpdate ? (
            <CarrierStatusPicker carrierId={k.id} carrierLabel={k.name} status={k.status} />
          ) : (
            <CarrierBadge status={k.status} />
          )
        }
        actions={
          !edit.editing ? (
            <>
              {canUpdate && (
                <Btn
                  variant="outline"
                  icon={<Edit2 size={15} />}
                  onClick={() => edit.start(draftFromCarrier(k))}
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
                disabled={updateCarrier.isPending}
                onClick={edit.save}
              >
                {updateCarrier.isPending ? "Saving…" : "Save"}
              </Btn>
            </>
          )
        }
      />

      <TwoColumnLayout
        left={
          <CarrierProfileCard
            carrier={k}
            editing={edit.editing}
            draft={edit.draft ?? undefined}
            errors={edit.errors}
            onField={edit.setField}
          />
        }
        right={
          <div className="grid gap-6">
            <CarrierRateSchedulesTable
              carrierId={k.id}
              schedules={ratesQ.data ?? []}
              canManage={canUpdate}
            />
            <CarrierCsvMappingsTable mappings={mappingsQ.data ?? []} canManage={canUpdate} />
          </div>
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doDelete}
        title="Delete carrier?"
        body={`Permanently remove ${k.name}. Its rate schedules and CSV mappings will be deleted with it; policies written with it must be moved or removed first.`}
        hint="This cannot be undone."
      />
    </div>
  );
}
