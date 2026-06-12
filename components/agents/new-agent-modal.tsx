"use client";
import { Input, Select } from "@/components/ui/input";

import { z } from "zod";
import { FormModal } from "@/components/common/form-modal";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { useAgencies, useCreateAgent } from "@/lib/data/hooks";
import { isValidPercentString, percentStringToBps } from "@/lib/domain/bps";
import { useZodForm } from "@/lib/forms/use-zod-form";

/** Raw form values (all strings); the schema trims and checks them. */
const newAgentFormSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required."),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address."),
  npn: z.string().trim(),
  agency_id: z.string(),
  commission_split_pct: z
    .string()
    .trim()
    .refine((v) => v === "" || isValidPercentString(v), "Enter a percentage from 0 to 100."),
});

const EMPTY = { full_name: "", email: "", npn: "", agency_id: "", commission_split_pct: "" };

export function NewAgentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createAgent = useCreateAgent();
  const agenciesQ = useAgencies();
  const toast = useToast();
  const form = useZodForm(newAgentFormSchema, { defaultValues: EMPTY });
  const { errors } = form.formState;

  function close() {
    form.reset(EMPTY);
    onClose();
  }

  const submit = form.handleSubmit((values) => {
    createAgent.mutate(
      {
        full_name: values.full_name,
        status: "active",
        email: values.email || undefined,
        npn: values.npn || undefined,
        agency_id: values.agency_id || null,
        commission_split_bps: values.commission_split_pct
          ? percentStringToBps(values.commission_split_pct)
          : 8000,
      },
      {
        onSuccess: () => {
          toast("Agent added", "success");
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
      title="New agent"
      onSubmit={submit}
      submitLabel="Create"
      isPending={createAgent.isPending}
    >
      <FormField label="Full name" required err={errors.full_name?.message}>
        <Input {...form.register("full_name")} />
      </FormField>
      <FormField label="Email" err={errors.email?.message}>
        <Input {...form.register("email")} />
      </FormField>
      <FormField label="NPN" err={errors.npn?.message}>
        <Input placeholder="National Producer Number" {...form.register("npn")} />
      </FormField>
      <FormField label="Agency" err={errors.agency_id?.message}>
        <Select {...form.register("agency_id")}>
          <option value="">Findway (direct)</option>
          {(agenciesQ.data ?? []).map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Commission split (%)" err={errors.commission_split_pct?.message}>
        <Input placeholder="Defaults to 80" {...form.register("commission_split_pct")} />
      </FormField>
    </FormModal>
  );
}
