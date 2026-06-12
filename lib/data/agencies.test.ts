import { describe, expect, it, vi } from "vitest";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { createAgency, getAgency, listAgencies, updateAgency } from "./agencies";

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

describe("agencies api", () => {
  it("listAgencies returns rows ordered by name", async () => {
    const rows = [{ id: "g1", name: "Harbor Agency", commission_cut_bps: 5000 }];
    const { client, from, builder } = stubClient({ data: rows, error: null });
    await expect(listAgencies(client)).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("agencies");
    expect(builder.order).toHaveBeenCalledWith("name");
  });

  it("getAgency returns a single row", async () => {
    const row = { id: "g1", name: "Harbor Agency" };
    const { client, from } = stubClient({ data: row, error: null });
    await expect(getAgency(client, "g1")).resolves.toEqual(row);
    expect(from).toHaveBeenCalledWith("agencies");
  });

  it("getAgency throws when Supabase returns an error", async () => {
    const { client } = stubClient({ data: null, error: new Error("not found") });
    await expect(getAgency(client, "missing")).rejects.toThrow("not found");
  });

  it("createAgency inserts and returns the new row", async () => {
    const row = { id: "g2", name: "Beacon Agency", commission_cut_bps: 0 };
    const { client, builder } = stubClient({ data: row, error: null });
    await expect(
      createAgency(client, {
        name: "Beacon Agency",
        status: "active",
        commission_cut_bps: 0,
        override_cut_bps: 0,
      }),
    ).resolves.toEqual(row);
    expect(builder.insert).toHaveBeenCalled();
  });

  it("updateAgency patches the adjustable cuts", async () => {
    const row = { id: "g1", commission_cut_bps: 5500, override_cut_bps: 3000 };
    const { client, builder } = stubClient({ data: row, error: null });
    await expect(
      updateAgency(client, "g1", { commission_cut_bps: 5500, override_cut_bps: 3000 }),
    ).resolves.toEqual(row);
    expect(builder.update).toHaveBeenCalledWith({
      commission_cut_bps: 5500,
      override_cut_bps: 3000,
    });
  });
});
