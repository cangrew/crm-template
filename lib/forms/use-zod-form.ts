"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldValues, type UseFormProps, type UseFormReturn } from "react-hook-form";
import type { z } from "zod";

/**
 * react-hook-form wired to a zod schema. The schema is the single source of
 * validation truth (reuse the domain schemas in lib/domain/schemas.ts where
 * the form shape matches); submit handlers receive the schema's parsed output,
 * so trims/coercions declared there apply before any mutation runs.
 */
export function useZodForm<TSchema extends z.ZodType<FieldValues, FieldValues>>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.input<TSchema>, unknown, z.output<TSchema>>, "resolver">,
): UseFormReturn<z.input<TSchema>, unknown, z.output<TSchema>> {
  return useForm<z.input<TSchema>, unknown, z.output<TSchema>>({
    resolver: zodResolver(schema),
    ...options,
  });
}
