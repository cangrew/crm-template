import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { useZodForm } from "./use-zod-form";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  capacity: z
    .string()
    .refine(
      (v) => !v.trim() || (Number.isInteger(Number(v)) && Number(v) > 0),
      "Capacity must be a positive whole number.",
    ),
});

describe("useZodForm()", () => {
  it("blocks submit and exposes schema messages for invalid values", async () => {
    const onValid = vi.fn();
    const { result } = renderHook(() => {
      const form = useZodForm(schema, { defaultValues: { name: "", capacity: "x" } });
      // formState is a subscription proxy: touch errors during render so the
      // hook re-renders when validation writes them.
      return { form, errors: form.formState.errors };
    });

    await act(async () => {
      await result.current.form.handleSubmit(onValid)();
    });

    expect(onValid).not.toHaveBeenCalled();
    expect(result.current.errors.name?.message).toBe("Name is required.");
    expect(result.current.errors.capacity?.message).toBe(
      "Capacity must be a positive whole number.",
    );
  });

  it("submits parsed values when the schema passes", async () => {
    const onValid = vi.fn();
    const { result } = renderHook(() =>
      useZodForm(schema, { defaultValues: { name: "  Pat  ", capacity: "9" } }),
    );

    await act(async () => {
      await result.current.handleSubmit(onValid)();
    });

    expect(onValid).toHaveBeenCalledTimes(1);
    // The resolver hands the handler the schema's parsed output (trimmed).
    expect(onValid.mock.calls[0][0]).toEqual({ name: "Pat", capacity: "9" });
  });
});
