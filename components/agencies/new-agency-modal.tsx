"use client";
import { Input, Textarea } from "@/components/ui/input";

import { z } from "zod";
import { FormModal } from "@/components/common/form-modal";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { useCreateAgency } from "@/lib/data/hooks";
import { isValidPercentString, percentStringToBps } from "@/lib/domain/bps";
import { useZodForm } from "@/lib/forms/use-zod-form";

const percent = z
  .string()
  .trim()
  .refine((v) => v === "" || isValidPercentString(v), "Enter a percentage from 0 to 100.");

/** Raw form values (all strings); the schema trims and checks them. */
const newAgencyFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  commission_cut_pct: percent,
  override_cut_pct: percent,
  notes: z.string().trim(),
});

const EMPTY = { name: "", commission_cut_pct: "", override_cut_pct: "", notes: "" };

export function NewAgencyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createAgency = useCreateAgency();
  const toast = useToast();
  const form = useZodForm(newAgencyFormSchema, { defaultValues: EMPTY });
  const { errors } = form.formState;

  function close() {
    form.reset(EMPTY);
    onClose();
  }

  const submit = form.handleSubmit((values) => {
    createAgency.mutate(
      {
        name: values.name,
        status: "active",
        commission_cut_bps: values.commission_cut_pct
          ? percentStringToBps(values.commission_cut_pct)
          : 0,
        override_cut_bps: values.override_cut_pct ? percentStringToBps(values.override_cut_pct) : 0,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          toast("Agency added", "success");
          close();
        },
        onError: (e) => toast(`Could not add: ${e.message}`, "error"),
      },
    );
  });

  return (
    <FormModal
      open={open}
      onClose={close}
      title="New agency"
      onSubmit={submit}
      submitLabel="Create"
      isPending={createAgency.isPending}
    >
      <FormField label="Name" required err={errors.name?.message}>
        <Input {...form.register("name")} />
      </FormField>
      <FormField label="Commission cut (%)" err={errors.commission_cut_pct?.message}>
        <Input placeholder="e.g. 50" {...form.register("commission_cut_pct")} />
      </FormField>
      <FormField label="Override cut (%)" err={errors.override_cut_pct?.message}>
        <Input placeholder="e.g. 30" {...form.register("override_cut_pct")} />
      </FormField>
      <FormField label="Notes" err={errors.notes?.message}>
        <Textarea {...form.register("notes")} />
      </FormField>
    </FormModal>
  );
}
