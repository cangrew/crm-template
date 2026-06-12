"use client";
import { Input, Select } from "@/components/ui/input";

import { z } from "zod";
import { FormModal } from "@/components/common/form-modal";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { useAgents, useCarriers, useClients, useCreatePolicy } from "@/lib/data/hooks";
import { useZodForm } from "@/lib/forms/use-zod-form";

const DOLLAR_RE = /^\d+(\.\d{1,2})?$/;

/** Raw form values (all strings); the schema trims and checks them. The
 * premium is edited in dollars and converted to cents on submit. */
const newPolicyFormSchema = z.object({
  client_id: z.string().min(1, "Choose a client."),
  carrier_id: z.string().min(1, "Choose a carrier."),
  agent_id: z.string().min(1, "Choose an agent."),
  policy_number: z.string().trim(),
  carrier_member_id: z.string().trim(),
  plan_name: z.string().trim(),
  member_count: z
    .string()
    .trim()
    .refine((v) => /^\d+$/.test(v) && parseInt(v, 10) >= 1, "Enter a member count of 1 or more."),
  monthly_premium: z
    .string()
    .trim()
    .refine((v) => v === "" || DOLLAR_RE.test(v), "Enter a dollar amount."),
  effective_date: z.string().trim(),
});

const EMPTY = {
  client_id: "",
  carrier_id: "",
  agent_id: "",
  policy_number: "",
  carrier_member_id: "",
  plan_name: "",
  member_count: "1",
  monthly_premium: "",
  effective_date: "",
};

export function NewPolicyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createPolicy = useCreatePolicy();
  const clientsQ = useClients();
  const carriersQ = useCarriers();
  const agentsQ = useAgents();
  const toast = useToast();
  const form = useZodForm(newPolicyFormSchema, { defaultValues: EMPTY });
  const { errors } = form.formState;

  const clients = [...(clientsQ.data ?? [])].sort((a, b) => a.last_name.localeCompare(b.last_name));
  const activeAgents = (agentsQ.data ?? []).filter((a) => a.status === "active");

  function close() {
    form.reset(EMPTY);
    onClose();
  }

  const submit = form.handleSubmit((values) => {
    createPolicy.mutate(
      {
        client_id: values.client_id,
        carrier_id: values.carrier_id,
        agent_id: values.agent_id,
        status: "draft",
        policy_number: values.policy_number || null,
        carrier_member_id: values.carrier_member_id || null,
        plan_name: values.plan_name || null,
        member_count: parseInt(values.member_count, 10),
        monthly_premium_cents: values.monthly_premium
          ? Math.round(parseFloat(values.monthly_premium) * 100)
          : null,
        effective_date: values.effective_date || null,
      },
      {
        onSuccess: () => {
          toast("Policy added", "success");
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
      title="New policy"
      onSubmit={submit}
      submitLabel="Create"
      isPending={createPolicy.isPending}
    >
      <FormField label="Client" required err={errors.client_id?.message}>
        <Select {...form.register("client_id")}>
          <option value="">Choose a client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.last_name}, {c.first_name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Carrier" required err={errors.carrier_id?.message}>
        <Select {...form.register("carrier_id")}>
          <option value="">Choose a carrier…</option>
          {(carriersQ.data ?? []).map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Agent" required err={errors.agent_id?.message}>
        <Select {...form.register("agent_id")}>
          <option value="">Choose an agent…</option>
          {activeAgents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Policy number" err={errors.policy_number?.message}>
        <Input {...form.register("policy_number")} />
      </FormField>
      <FormField label="Carrier member ID" err={errors.carrier_member_id?.message}>
        <Input {...form.register("carrier_member_id")} />
      </FormField>
      <FormField label="Plan name" err={errors.plan_name?.message}>
        <Input {...form.register("plan_name")} />
      </FormField>
      <FormField label="Member count" err={errors.member_count?.message}>
        <Input type="number" min={1} {...form.register("member_count")} />
      </FormField>
      <FormField label="Monthly premium ($)" err={errors.monthly_premium?.message}>
        <Input placeholder="e.g. 450.00" {...form.register("monthly_premium")} />
      </FormField>
      <FormField label="Effective date" err={errors.effective_date?.message}>
        <Input type="date" {...form.register("effective_date")} />
      </FormField>
    </FormModal>
  );
}
