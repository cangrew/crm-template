import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { useDetailEdit } from "./use-detail-edit";

type Draft = { name: string; rate: string };

const schema = z.object({
  name: z.string().min(1, "Name is required."),
  rate: z.number().positive("Enter a positive rate."),
});

function toPatch(draft: Draft) {
  return { name: draft.name.trim(), rate: Number(draft.rate) };
}

function setup() {
  const onValid = vi.fn<(patch: z.infer<typeof schema>) => void>();
  const onInvalid = vi.fn<() => void>();
  const hook = renderHook(() =>
    useDetailEdit<Draft, z.infer<typeof schema>>({
      toPatch,
      schema,
      onValid,
      onInvalid,
    }),
  );
  return { ...hook, onValid, onInvalid };
}

describe("useDetailEdit()", () => {
  it("starts closed with no draft and enters editing via start()", () => {
    const { result } = setup();
    expect(result.current.editing).toBe(false);
    expect(result.current.draft).toBeNull();

    act(() => result.current.start({ name: "Acme", rate: "100" }));
    expect(result.current.editing).toBe(true);
    expect(result.current.draft).toEqual({ name: "Acme", rate: "100" });
  });

  it("cancel() drops the draft and any errors", () => {
    const { result } = setup();
    act(() => result.current.start({ name: "", rate: "x" }));
    act(() => result.current.save());
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

    act(() => result.current.cancel());
    expect(result.current.editing).toBe(false);
    expect(result.current.draft).toBeNull();
    expect(result.current.errors).toEqual({});
  });

  it("setField() merges a single field into the draft", () => {
    const { result } = setup();
    act(() => result.current.start({ name: "Acme", rate: "100" }));
    act(() => result.current.setField("rate", "250"));
    expect(result.current.draft).toEqual({ name: "Acme", rate: "250" });
  });

  it("save() maps schema issues onto draft keys and reports invalid", () => {
    const { result, onValid, onInvalid } = setup();
    act(() => result.current.start({ name: "", rate: "-5" }));
    act(() => result.current.save());

    expect(onValid).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledTimes(1);
    expect(result.current.errors.name).toBe("Name is required.");
    expect(result.current.errors.rate).toBe("Enter a positive rate.");
  });

  it("save() hands the parsed patch to onValid when the schema passes", () => {
    const { result, onValid, onInvalid } = setup();
    act(() => result.current.start({ name: "  Acme  ", rate: "250" }));
    act(() => result.current.save());

    expect(onInvalid).not.toHaveBeenCalled();
    expect(onValid).toHaveBeenCalledWith({ name: "Acme", rate: 250 });
    // The page's mutation success handler closes the editor via finish().
    act(() => result.current.finish());
    expect(result.current.editing).toBe(false);
  });

  it("clears a field's error when that field changes", () => {
    const { result } = setup();
    act(() => result.current.start({ name: "", rate: "100" }));
    act(() => result.current.save());
    expect(result.current.errors.name).toBe("Name is required.");

    act(() => result.current.setField("name", "Acme"));
    expect(result.current.errors.name).toBeUndefined();
  });

  it("clears all errors once validation passes", () => {
    const { result, onValid } = setup();
    act(() => result.current.start({ name: "", rate: "-1" }));
    act(() => result.current.save());
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

    act(() => result.current.setField("name", "Acme"));
    act(() => result.current.setField("rate", "250"));
    act(() => result.current.save());
    expect(onValid).toHaveBeenCalledTimes(1);
    expect(result.current.errors).toEqual({});
  });

  it("runs the optional pre-schema draft validation first", () => {
    const onValid = vi.fn();
    const { result } = renderHook(() =>
      useDetailEdit<Draft, z.infer<typeof schema>>({
        toPatch,
        schema,
        onValid,
        validateDraft: (d) => (d.rate.includes("$") ? { rate: "No currency symbols." } : {}),
      }),
    );
    act(() => result.current.start({ name: "Acme", rate: "$250" }));
    act(() => result.current.save());

    expect(onValid).not.toHaveBeenCalled();
    expect(result.current.errors.rate).toBe("No currency symbols.");
  });
});
