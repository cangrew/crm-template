import { describe, expect, it, vi } from "vitest";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { documentStoragePath, getDocument } from "./documents";

/**
 * Minimal chainable Supabase query-builder stub (mirrors contacts.test.ts):
 * every builder method returns the builder; awaiting it or calling .single()
 * resolves the canned result.
 */
function stubClient(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "insert", "delete", "eq", "order"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  const from = vi.fn(() => builder);
  return { client: { from } as unknown as TypedSupabaseClient, from, builder };
}

describe("documents api", () => {
  it("getDocument returns a single row from the documents table", async () => {
    const row = { id: "d1", contact_id: "c1", kind: "contract", storage_path: "c1/contract.pdf" };
    const { client, from } = stubClient({ data: row, error: null });
    await expect(getDocument(client, "d1")).resolves.toEqual(row);
    expect(from).toHaveBeenCalledWith("documents");
  });

  it("getDocument throws when Supabase returns an error", async () => {
    const { client } = stubClient({ data: null, error: new Error("not found") });
    await expect(getDocument(client, "missing")).rejects.toThrow("not found");
  });
});

describe("documentStoragePath", () => {
  it("namespaces the object under its prefix and tags it with kind and timestamp", () => {
    const path = documentStoragePath("contact-1", "contract", "Agreement.pdf", 1700);
    expect(path).toBe("contact-1/contract-1700-agreement.pdf");
  });

  it("sanitizes whitespace and unsafe characters in the file name", () => {
    const path = documentStoragePath("general", "invoice", "Q2 scan (final)!.PNG", 42);
    expect(path).toBe("general/invoice-42-q2-scan-final-.png");
  });

  it("falls back to a generic name when the file name has no usable characters", () => {
    const path = documentStoragePath("general", "other", "***", 9);
    expect(path).toBe("general/other-9-file");
  });

  it("keeps each upload unique via the timestamp", () => {
    const a = documentStoragePath("c1", "invoice", "x.pdf", 1);
    const b = documentStoragePath("c1", "invoice", "x.pdf", 2);
    expect(a).not.toBe(b);
  });
});
