import { describe, expect, it, vi } from "vitest";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { createAgent, getAgent, listAgents, listAgentsByAgency } from "./agents";

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

describe("agents api", () => {
  it("listAgents returns rows ordered by full_name", async () => {
    const rows = [{ id: "a1", full_name: "Andy Agent", commission_split_bps: 8000 }];
    const { client, from, builder } = stubClient({ data: rows, error: null });
    await expect(listAgents(client)).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("agents");
    expect(builder.order).toHaveBeenCalledWith("full_name");
  });

  it("listAgentsByAgency filters on agency_id", async () => {
    const rows = [{ id: "a1", full_name: "Andy Agent", agency_id: "g1" }];
    const { client, builder } = stubClient({ data: rows, error: null });
    await expect(listAgentsByAgency(client, "g1")).resolves.toEqual(rows);
    expect(builder.eq).toHaveBeenCalledWith("agency_id", "g1");
  });

  it("getAgent throws when Supabase returns an error", async () => {
    const { client } = stubClient({ data: null, error: new Error("not found") });
    await expect(getAgent(client, "missing")).rejects.toThrow("not found");
  });

  it("createAgent inserts and returns the new row", async () => {
    const row = { id: "a2", full_name: "Dina Direct", agency_id: null };
    const { client, builder } = stubClient({ data: row, error: null });
    await expect(
      createAgent(client, {
        full_name: "Dina Direct",
        status: "active",
        commission_split_bps: 7500,
      }),
    ).resolves.toEqual(row);
    expect(builder.insert).toHaveBeenCalled();
  });
});
