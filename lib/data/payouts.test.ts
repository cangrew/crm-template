import { describe, expect, it, vi } from "vitest";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { createPayoutStatement, listPayoutStatements, updatePayoutStatus } from "./payouts";

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

describe("payouts api", () => {
  it("listPayoutStatements orders by period_month descending", async () => {
    const rows = [{ id: "po-1", payee_type: "agent" }];
    const { client, from, builder } = stubClient({ data: rows, error: null });
    await expect(listPayoutStatements(client)).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("payout_statements");
    expect(builder.order).toHaveBeenCalledWith("period_month", { ascending: false });
  });

  it("createPayoutStatement inserts and returns the new row", async () => {
    const row = { id: "po-2", payee_type: "agency" };
    const { client, builder } = stubClient({ data: row, error: null });
    await expect(
      createPayoutStatement(client, {
        payee_type: "agency",
        agency_id: "g-1",
        period_month: "2026-05-01",
      }),
    ).resolves.toEqual(row);
    expect(builder.insert).toHaveBeenCalled();
  });

  it("updatePayoutStatus patches the status", async () => {
    const row = { id: "po-1", status: "finalized" };
    const { client, builder } = stubClient({ data: row, error: null });
    await expect(updatePayoutStatus(client, "po-1", "finalized")).resolves.toEqual(row);
    expect(builder.update).toHaveBeenCalledWith({ status: "finalized" });
  });
});
