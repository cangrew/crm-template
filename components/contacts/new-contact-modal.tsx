"use client";
import { Input, Textarea } from "@/components/ui/input";

/* EXAMPLE ENTITY — safe to delete; see README "Removing the example entity".
 * Create-modal pattern: a raw string form schema (zod is the only validation
 * source) + FormModal + FormField, submitting through the entity's create
 * hook. */
import { z } from "zod";
import { FormModal } from "@/components/common/form-modal";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { useCreateContact } from "@/lib/data/hooks";
import { useZodForm } from "@/lib/forms/use-zod-form";

/** Raw form values (all strings); the schema trims and checks them. */
const newContactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  company: z.string().trim(),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address."),
  phone: z.string().trim(),
  notes: z.string().trim(),
});

const EMPTY = { name: "", company: "", email: "", phone: "", notes: "" };

export function NewContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createContact = useCreateContact();
  const toast = useToast();
  const form = useZodForm(newContactFormSchema, { defaultValues: EMPTY });
  const { errors } = form.formState;

  function close() {
    form.reset(EMPTY);
    onClose();
  }

  const submit = form.handleSubmit((values) => {
    createContact.mutate(
      {
        name: values.name,
        status: "lead",
        company: values.company || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          toast("Contact added", "success");
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
      title="New contact"
      onSubmit={submit}
      submitLabel="Create"
      isPending={createContact.isPending}
    >
      <FormField label="Name" required err={errors.name?.message}>
        <Input {...form.register("name")} />
      </FormField>
      <FormField label="Company" err={errors.company?.message}>
        <Input {...form.register("company")} />
      </FormField>
      <FormField label="Email" err={errors.email?.message}>
        <Input {...form.register("email")} />
      </FormField>
      <FormField label="Phone" err={errors.phone?.message}>
        <Input {...form.register("phone")} />
      </FormField>
      <FormField label="Notes" err={errors.notes?.message}>
        <Textarea {...form.register("notes")} />
      </FormField>
    </FormModal>
  );
}
