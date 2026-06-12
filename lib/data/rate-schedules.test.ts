import { describe, expect, it, vi } from "vitest";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import {
  createRateSchedule,
  deleteRateSchedule,
  listRateSchedulesByCarrier,
} from "./rate-schedules";

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

describe("rate-schedules api", () => {
  it("listRateSchedulesByCarrier filters by carrier, newest window first", async () => {
    const rows = [{ id: "r1", carrier_id: "k1", rate_type: "pmpm", pmpm_cents: 2200 }];
    const { client, from, builder } = stubClient({ data: rows, error: null });
    await expect(listRateSchedulesByCarrier(client, "k1")).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("rate_schedules");
    expect(builder.eq).toHaveBeenCalledWith("carrier_id", "k1");
    expect(builder.order).toHaveBeenCalledWith("effective_from", { ascending: false });
  });

  it("createRateSchedule inserts and returns the new row", async () => {
    const row = { id: "r2", carrier_id: "k1", rate_type: "percent_of_premium", percent_bps: 500 };
    const { client, builder } = stubClient({ data: row, error: null });
    await expect(
      createRateSchedule(client, {
        carrier_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa",
        rate_type: "percent_of_premium",
        business_type: "new_business",
        percent_bps: 500,
        effective_from: "2026-01-01",
      }),
    ).resolves.toEqual(row);
    expect(builder.insert).toHaveBeenCalled();
  });

  it("createRateSchedule throws when Supabase returns an error", async () => {
    const { client } = stubClient({ data: null, error: new Error("denied") });
    await expect(
      createRateSchedule(client, {
        carrier_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa",
        rate_type: "pmpm",
        business_type: "renewal",
        pmpm_cents: 1100,
        effective_from: "2026-01-01",
      }),
    ).rejects.toThrow("denied");
  });

  it("deleteRateSchedule deletes by id", async () => {
    const { client, builder } = stubClient({ data: null, error: null });
    await expect(deleteRateSchedule(client, "r1")).resolves.toBeUndefined();
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "r1");
  });
});
