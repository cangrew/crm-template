"use client";
import { Input, Select } from "@/components/ui/input";

import { z } from "zod";
import { FormModal } from "@/components/common/form-modal";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { useCreateRateSchedule } from "@/lib/data/hooks";
import { isValidPercentString, percentStringToBps } from "@/lib/domain/bps";
import {
  BUSINESS_TYPES,
  BUSINESS_TYPE_LABELS,
  RATE_TYPES,
  RATE_TYPE_LABELS,
} from "@/lib/domain/enums";
import { useZodForm } from "@/lib/forms/use-zod-form";

const DOLLAR_RE = /^\d+(\.\d{1,2})?$/;

/** Raw form values (all strings); the schema trims and checks them. The value
 * field is dollars for PMPM rates and a percentage for percent-of-premium. */
const newRateFormSchema = z
  .object({
    rate_type: z.enum(RATE_TYPES),
    business_type: z.enum(BUSINESS_TYPES),
    value: z.string().trim().min(1, "A rate value is required."),
    effective_from: z.string().trim().min(1, "An effective date is required."),
    effective_to: z.string().trim(),
    state: z.string().trim(),
  })
  .superRefine((val, ctx) => {
    if (!val.value) return;
    if (val.rate_type === "pmpm" && !DOLLAR_RE.test(val.value)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Enter a dollar amount." });
    }
    if (val.rate_type === "percent_of_premium" && !isValidPercentString(val.value)) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Enter a percentage from 0 to 100.",
      });
    }
  });

const EMPTY = {
  rate_type: "pmpm" as (typeof RATE_TYPES)[number],
  business_type: "new_business" as (typeof BUSINESS_TYPES)[number],
  value: "",
  effective_from: "",
  effective_to: "",
  state: "",
};

export function NewRateScheduleModal({
  carrierId,
  open,
  onClose,
}: {
  carrierId: string;
  open: boolean;
  onClose: () => void;
}) {
  const createRate = useCreateRateSchedule();
  const toast = useToast();
  const form = useZodForm(newRateFormSchema, { defaultValues: EMPTY });
  const { errors } = form.formState;
  const rateType = form.watch("rate_type");

  function close() {
    form.reset(EMPTY);
    onClose();
  }

  const submit = form.handleSubmit((values) => {
    const isPmpm = values.rate_type === "pmpm";
    createRate.mutate(
      {
        carrier_id: carrierId,
        rate_type: values.rate_type,
        business_type: values.business_type,
        pmpm_cents: isPmpm ? Math.round(parseFloat(values.value) * 100) : null,
        percent_bps: isPmpm ? null : percentStringToBps(values.value),
        effective_from: values.effective_from,
        effective_to: values.effective_to || null,
        state: values.state || null,
      },
      {
        onSuccess: () => {
          toast("Rate schedule added", "success");
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
      title="New rate schedule"
      onSubmit={submit}
      submitLabel="Create"
      isPending={createRate.isPending}
    >
      <FormField label="Rate type" required err={errors.rate_type?.message}>
        <Select {...form.register("rate_type")}>
          {RATE_TYPES.map((t) => (
            <option key={t} value={t}>
              {RATE_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Business type" required err={errors.business_type?.message}>
        <Select {...form.register("business_type")}>
          {BUSINESS_TYPES.map((t) => (
            <option key={t} value={t}>
              {BUSINESS_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField
        label={rateType === "pmpm" ? "Rate ($ per member per month)" : "Rate (% of premium)"}
        required
        err={errors.value?.message}
      >
        <Input
          placeholder={rateType === "pmpm" ? "e.g. 22.00" : "e.g. 5"}
          {...form.register("value")}
        />
      </FormField>
      <FormField label="Effective from" required err={errors.effective_from?.message}>
        <Input type="date" {...form.register("effective_from")} />
      </FormField>
      <FormField label="Effective to" err={errors.effective_to?.message}>
        <Input type="date" {...form.register("effective_to")} />
      </FormField>
      <FormField label="State" err={errors.state?.message}>
        <Input placeholder="Blank = all states" {...form.register("state")} />
      </FormField>
    </FormModal>
  );
}
