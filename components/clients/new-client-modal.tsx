"use client";
import { Input, Select, Textarea } from "@/components/ui/input";

/* Create-modal pattern: a raw string form schema (zod is the only validation
 * source) + FormModal + FormField, submitting through the entity's create
 * hook. */
import { z } from "zod";
import { FormModal } from "@/components/common/form-modal";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { useAgents, useCreateClient } from "@/lib/data/hooks";
import { useZodForm } from "@/lib/forms/use-zod-form";

/** Raw form values (all strings); the schema trims and checks them. */
const newClientFormSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required."),
  last_name: z.string().trim().min(1, "Last name is required."),
  dob: z.string().trim(),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address."),
  phone: z.string().trim(),
  address: z.string().trim(),
  agent_id: z.string(),
  notes: z.string().trim(),
});

const EMPTY = {
  first_name: "",
  last_name: "",
  dob: "",
  email: "",
  phone: "",
  address: "",
  agent_id: "",
  notes: "",
};

export function NewClientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createClient = useCreateClient();
  const agentsQ = useAgents();
  const toast = useToast();
  const form = useZodForm(newClientFormSchema, { defaultValues: EMPTY });
  const { errors } = form.formState;

  function close() {
    form.reset(EMPTY);
    onClose();
  }

  const submit = form.handleSubmit((values) => {
    createClient.mutate(
      {
        first_name: values.first_name,
        last_name: values.last_name,
        status: "prospect",
        dob: values.dob || null,
        email: values.email || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
        agent_id: values.agent_id || null,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          toast("Client added", "success");
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
      title="New client"
      onSubmit={submit}
      submitLabel="Create"
      isPending={createClient.isPending}
    >
      <FormField label="First name" required err={errors.first_name?.message}>
        <Input {...form.register("first_name")} />
      </FormField>
      <FormField label="Last name" required err={errors.last_name?.message}>
        <Input {...form.register("last_name")} />
      </FormField>
      <FormField label="Date of birth" err={errors.dob?.message}>
        <Input type="date" {...form.register("dob")} />
      </FormField>
      <FormField label="Email" err={errors.email?.message}>
        <Input {...form.register("email")} />
      </FormField>
      <FormField label="Phone" err={errors.phone?.message}>
        <Input {...form.register("phone")} />
      </FormField>
      <FormField label="Address" err={errors.address?.message}>
        <Input {...form.register("address")} />
      </FormField>
      <FormField label="Agent" err={errors.agent_id?.message}>
        <Select {...form.register("agent_id")}>
          <option value="">Unassigned</option>
          {(agentsQ.data ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Notes" err={errors.notes?.message}>
        <Textarea {...form.register("notes")} />
      </FormField>
    </FormModal>
  );
}
