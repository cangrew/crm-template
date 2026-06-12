import { describe, expect, it, vi } from "vitest";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { createClient, getClient, listClients, listClientsByAgent } from "./clients";

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

describe("clients api", () => {
  it("listClients returns rows ordered by last name", async () => {
    const rows = [{ id: "c1", first_name: "Ada", last_name: "Lovelace", status: "prospect" }];
    const { client, from, builder } = stubClient({ data: rows, error: null });
    await expect(listClients(client)).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("clients");
    expect(builder.order).toHaveBeenCalledWith("last_name");
  });

  it("listClientsByAgent filters by agent and orders by last name", async () => {
    const rows = [{ id: "c1", first_name: "Ada", last_name: "Lovelace", agent_id: "a1" }];
    const { client, from, builder } = stubClient({ data: rows, error: null });
    await expect(listClientsByAgent(client, "a1")).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("clients");
    expect(builder.eq).toHaveBeenCalledWith("agent_id", "a1");
    expect(builder.order).toHaveBeenCalledWith("last_name");
  });

  it("getClient returns a single row from the clients table", async () => {
    const row = { id: "c1", first_name: "Ada", last_name: "Lovelace", status: "active" };
    const { client, from } = stubClient({ data: row, error: null });
    await expect(getClient(client, "c1")).resolves.toEqual(row);
    expect(from).toHaveBeenCalledWith("clients");
  });

  it("getClient throws when Supabase returns an error", async () => {
    const { client } = stubClient({ data: null, error: new Error("not found") });
    await expect(getClient(client, "missing")).rejects.toThrow("not found");
  });

  it("createClient inserts and returns the new row", async () => {
    const row = { id: "c2", first_name: "Grace", last_name: "Hopper", status: "prospect" };
    const { client, builder } = stubClient({ data: row, error: null });
    await expect(
      createClient(client, { first_name: "Grace", last_name: "Hopper", status: "prospect" }),
    ).resolves.toEqual(row);
    expect(builder.insert).toHaveBeenCalled();
  });
});
