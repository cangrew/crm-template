import { describe, expect, it, vi } from "vitest";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { createContact, getContact, listContacts } from "./contacts";

/**
 * Minimal chainable Supabase query-builder stub: every builder method returns
 * the builder; awaiting it or calling .single() resolves the canned result.
 */
function stubClient(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "insert", "update", "delete", "eq", "order"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  const from = vi.fn(() => builder);
  return { client: { from } as unknown as TypedSupabaseClient, from, builder };
}

describe("contacts api", () => {
  it("listContacts returns rows ordered by name", async () => {
    const rows = [{ id: "c1", name: "Ada", status: "lead" }];
    const { client, from, builder } = stubClient({ data: rows, error: null });
    await expect(listContacts(client)).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("contacts");
    expect(builder.order).toHaveBeenCalledWith("name");
  });

  it("getContact returns a single row from the contacts table", async () => {
    const row = { id: "c1", name: "Ada", status: "active" };
    const { client, from } = stubClient({ data: row, error: null });
    await expect(getContact(client, "c1")).resolves.toEqual(row);
    expect(from).toHaveBeenCalledWith("contacts");
  });

  it("getContact throws when Supabase returns an error", async () => {
    const { client } = stubClient({ data: null, error: new Error("not found") });
    await expect(getContact(client, "missing")).rejects.toThrow("not found");
  });

  it("createContact inserts and returns the new row", async () => {
    const row = { id: "c2", name: "Grace", status: "lead" };
    const { client, builder } = stubClient({ data: row, error: null });
    await expect(createContact(client, { name: "Grace", status: "lead" })).resolves.toEqual(row);
    expect(builder.insert).toHaveBeenCalled();
  });
});
