import { describe, expect, it, vi } from "vitest";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { createCsvMapping, deleteCsvMapping, listCsvMappingsByCarrier } from "./csv-mappings";

/** Minimal chainable Supabase query-builder stub (see clients.test.ts). */
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

describe("csv-mappings api", () => {
  it("listCsvMappingsByCarrier filters by carrier and orders by name", async () => {
    const rows = [{ id: "m1", carrier_id: "k1", name: "Ambetter monthly statement" }];
    const { client, from, builder } = stubClient({ data: rows, error: null });
    await expect(listCsvMappingsByCarrier(client, "k1")).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("carrier_csv_mappings");
    expect(builder.eq).toHaveBeenCalledWith("carrier_id", "k1");
    expect(builder.order).toHaveBeenCalledWith("name");
  });

  it("createCsvMapping inserts and returns the new row", async () => {
    const row = { id: "m2", carrier_id: "k1", name: "Oscar statement" };
    const { client, builder } = stubClient({ data: row, error: null });
    await expect(
      createCsvMapping(client, {
        carrier_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa",
        name: "Oscar statement",
        mapping: { policy_number: "Policy ID" },
      }),
    ).resolves.toEqual(row);
    expect(builder.insert).toHaveBeenCalled();
  });

  it("deleteCsvMapping deletes by id and throws on error", async () => {
    const { client, builder } = stubClient({ data: null, error: null });
    await expect(deleteCsvMapping(client, "m1")).resolves.toBeUndefined();
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "m1");

    const failing = stubClient({ data: null, error: new Error("denied") });
    await expect(deleteCsvMapping(failing.client, "m1")).rejects.toThrow("denied");
  });
});
