import { describe, expect, it, vi } from "vitest";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import {
  createCarrier,
  deleteCarrier,
  getCarrier,
  listCarriers,
  updateCarrierStatus,
} from "./carriers";

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

describe("carriers api", () => {
  it("listCarriers returns rows ordered by name", async () => {
    const rows = [{ id: "k1", name: "Ambetter Health", status: "active" }];
    const { client, from, builder } = stubClient({ data: rows, error: null });
    await expect(listCarriers(client)).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("carriers");
    expect(builder.order).toHaveBeenCalledWith("name");
  });

  it("getCarrier returns a single row and throws on error", async () => {
    const row = { id: "k1", name: "Oscar Health", status: "active" };
    const { client, from } = stubClient({ data: row, error: null });
    await expect(getCarrier(client, "k1")).resolves.toEqual(row);
    expect(from).toHaveBeenCalledWith("carriers");

    const failing = stubClient({ data: null, error: new Error("not found") });
    await expect(getCarrier(failing.client, "missing")).rejects.toThrow("not found");
  });

  it("createCarrier inserts and returns the new row", async () => {
    const row = { id: "k2", name: "Molina Healthcare", status: "active" };
    const { client, builder } = stubClient({ data: row, error: null });
    await expect(
      createCarrier(client, { name: "Molina Healthcare", status: "active" }),
    ).resolves.toEqual(row);
    expect(builder.insert).toHaveBeenCalled();
  });

  it("updateCarrierStatus patches the status column", async () => {
    const row = { id: "k1", name: "Ambetter Health", status: "inactive" };
    const { client, builder } = stubClient({ data: row, error: null });
    await expect(updateCarrierStatus(client, "k1", "inactive")).resolves.toEqual(row);
    expect(builder.update).toHaveBeenCalledWith({ status: "inactive" });
    expect(builder.eq).toHaveBeenCalledWith("id", "k1");
  });

  it("deleteCarrier deletes by id", async () => {
    const { client, builder } = stubClient({ data: null, error: null });
    await expect(deleteCarrier(client, "k1")).resolves.toBeUndefined();
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "k1");
  });
});
