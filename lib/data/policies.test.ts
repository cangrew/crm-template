import { describe, expect, it, vi } from "vitest";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import {
  createPolicy,
  getPolicy,
  listPolicies,
  listPoliciesByAgent,
  listPoliciesByClient,
  updatePolicyStatus,
} from "./policies";

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

describe("policies api", () => {
  it("listPolicies returns rows newest first", async () => {
    const rows = [{ id: "p1", policy_number: "AMB-1001", status: "active" }];
    const { client, from, builder } = stubClient({ data: rows, error: null });
    await expect(listPolicies(client)).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("policies");
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("listPoliciesByClient filters by client", async () => {
    const rows = [{ id: "p1", client_id: "c1" }];
    const { client, builder } = stubClient({ data: rows, error: null });
    await expect(listPoliciesByClient(client, "c1")).resolves.toEqual(rows);
    expect(builder.eq).toHaveBeenCalledWith("client_id", "c1");
  });

  it("listPoliciesByAgent filters by agent", async () => {
    const rows = [{ id: "p1", agent_id: "a1" }];
    const { client, builder } = stubClient({ data: rows, error: null });
    await expect(listPoliciesByAgent(client, "a1")).resolves.toEqual(rows);
    expect(builder.eq).toHaveBeenCalledWith("agent_id", "a1");
  });

  it("getPolicy returns a single row and throws on error", async () => {
    const row = { id: "p1", policy_number: "AMB-1001" };
    const { client } = stubClient({ data: row, error: null });
    await expect(getPolicy(client, "p1")).resolves.toEqual(row);

    const failing = stubClient({ data: null, error: new Error("not found") });
    await expect(getPolicy(failing.client, "missing")).rejects.toThrow("not found");
  });

  it("createPolicy inserts and returns the new row", async () => {
    const row = { id: "p2", status: "draft" };
    const { client, builder } = stubClient({ data: row, error: null });
    await expect(
      createPolicy(client, {
        client_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1aa",
        carrier_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1ab",
        agent_id: "5c0e8c1e-95a1-4f44-9d0a-7d3a44d2b1ac",
        status: "draft",
        member_count: 1,
      }),
    ).resolves.toEqual(row);
    expect(builder.insert).toHaveBeenCalled();
  });

  it("updatePolicyStatus patches the status column", async () => {
    const row = { id: "p1", status: "lapsed" };
    const { client, builder } = stubClient({ data: row, error: null });
    await expect(updatePolicyStatus(client, "p1", "lapsed")).resolves.toEqual(row);
    expect(builder.update).toHaveBeenCalledWith({ status: "lapsed" });
    expect(builder.eq).toHaveBeenCalledWith("id", "p1");
  });
});
