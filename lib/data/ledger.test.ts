import { describe, expect, it, vi } from "vitest";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { listLedgerByAgent, listLedgerByPeriod, listLedgerByPolicy } from "./ledger";

function stubClient(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  const from = vi.fn(() => builder);
  return { client: { from } as unknown as TypedSupabaseClient, from, builder };
}

describe("ledger api", () => {
  it("listLedgerByAgent filters on agent_id, newest first", async () => {
    const rows = [{ id: "le-1", agent_id: "ag-1", amount_cents: 8000 }];
    const { client, from, builder } = stubClient({ data: rows, error: null });
    await expect(listLedgerByAgent(client, "ag-1")).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("ledger_entries");
    expect(builder.eq).toHaveBeenCalledWith("agent_id", "ag-1");
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("listLedgerByPolicy filters on policy_id", async () => {
    const { client, builder } = stubClient({ data: [], error: null });
    await expect(listLedgerByPolicy(client, "pol-1")).resolves.toEqual([]);
    expect(builder.eq).toHaveBeenCalledWith("policy_id", "pol-1");
  });

  it("listLedgerByPeriod surfaces errors", async () => {
    const { client } = stubClient({ data: null, error: new Error("denied") });
    await expect(listLedgerByPeriod(client, "2026-05-01")).rejects.toThrow("denied");
  });
});
