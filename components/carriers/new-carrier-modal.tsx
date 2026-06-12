"use client";
import { Input, Textarea } from "@/components/ui/input";

import { z } from "zod";
import { FormModal } from "@/components/common/form-modal";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { useCreateCarrier } from "@/lib/data/hooks";
import { useZodForm } from "@/lib/forms/use-zod-form";

/** Raw form values (all strings); the schema trims and checks them. */
const newCarrierFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  notes: z.string().trim(),
});

const EMPTY = { name: "", notes: "" };

export function NewCarrierModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createCarrier = useCreateCarrier();
  const toast = useToast();
  const form = useZodForm(newCarrierFormSchema, { defaultValues: EMPTY });
  const { errors } = form.formState;

  function close() {
    form.reset(EMPTY);
    onClose();
  }

  const submit = form.handleSubmit((values) => {
    createCarrier.mutate(
      {
        name: values.name,
        status: "active",
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          toast("Carrier added", "success");
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
      title="New carrier"
      onSubmit={submit}
      submitLabel="Create"
      isPending={createCarrier.isPending}
    >
      <FormField label="Name" required err={errors.name?.message}>
        <Input {...form.register("name")} />
      </FormField>
      <FormField label="Notes" err={errors.notes?.message}>
        <Textarea {...form.register("notes")} />
      </FormField>
    </FormModal>
  );
}
