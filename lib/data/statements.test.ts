import { describe, expect, it, vi } from "vitest";
import type { StatementLineInput } from "@/lib/domain/schemas";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import {
  bulkInsertLines,
  getStatement,
  listStatements,
  postStatement,
  setLineMatch,
  updateLine,
  updateStatement,
  voidStatement,
} from "./statements";

function stubClient(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "insert", "update", "delete", "eq", "order"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  const from = vi.fn(() => builder);
  const rpc = vi.fn(() => Promise.resolve(result));
  return { client: { from, rpc } as unknown as TypedSupabaseClient, from, rpc, builder };
}

function makeLine(rowIndex: number): StatementLineInput {
  return {
    statement_id: "st-1",
    row_index: rowIndex,
    raw: { col: String(rowIndex) },
    amount_cents: 100,
    line_kind: "commission",
    match_status: "unmatched",
  };
}

describe("statements api", () => {
  it("listStatements orders by period_month descending", async () => {
    const rows = [{ id: "st-1", period_month: "2026-05-01" }];
    const { client, from, builder } = stubClient({ data: rows, error: null });
    await expect(listStatements(client)).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith("commission_statements");
    expect(builder.order).toHaveBeenCalledWith("period_month", { ascending: false });
  });

  it("getStatement throws when Supabase returns an error", async () => {
    const { client } = stubClient({ data: null, error: new Error("not found") });
    await expect(getStatement(client, "missing")).rejects.toThrow("not found");
  });

  it("bulkInsertLines chunks inserts at 500 rows", async () => {
    const { client, builder } = stubClient({ data: null, error: null });
    const lines = Array.from({ length: 1200 }, (_, i) => makeLine(i));
    await bulkInsertLines(client, lines);
    const insert = builder.insert as ReturnType<typeof vi.fn>;
    expect(insert).toHaveBeenCalledTimes(3);
    expect(insert.mock.calls[0][0]).toHaveLength(500);
    expect(insert.mock.calls[2][0]).toHaveLength(200);
  });

  it("setLineMatch patches the match fields", async () => {
    const row = { id: "ln-1", match_status: "manual_matched" };
    const { client, builder } = stubClient({ data: row, error: null });
    await expect(
      setLineMatch(client, "ln-1", {
        match_status: "manual_matched",
        matched_policy_id: "pol-1",
        match_reason: "manual",
      }),
    ).resolves.toEqual(row);
    expect(builder.update).toHaveBeenCalledWith({
      match_status: "manual_matched",
      matched_policy_id: "pol-1",
      match_reason: "manual",
    });
  });

  it("updateStatement patches the statement and returns the row", async () => {
    const row = { id: "st-1", storage_path: "st-1/file.csv" };
    const { client, from, builder } = stubClient({ data: row, error: null });
    await expect(
      updateStatement(client, "st-1", { storage_path: "st-1/file.csv" }),
    ).resolves.toEqual(row);
    expect(from).toHaveBeenCalledWith("commission_statements");
    expect(builder.update).toHaveBeenCalledWith({ storage_path: "st-1/file.csv" });
    expect(builder.eq).toHaveBeenCalledWith("id", "st-1");
  });

  it("updateStatement throws when Supabase returns an error", async () => {
    const { client } = stubClient({ data: null, error: new Error("forbidden") });
    await expect(updateStatement(client, "st-1", { storage_path: "x" })).rejects.toThrow(
      "forbidden",
    );
  });

  it("updateLine patches editable line columns (including line_kind)", async () => {
    const row = { id: "ln-1", line_kind: "override" };
    const { client, from, builder } = stubClient({ data: row, error: null });
    await expect(updateLine(client, "ln-1", { line_kind: "override" })).resolves.toEqual(row);
    expect(from).toHaveBeenCalledWith("statement_lines");
    expect(builder.update).toHaveBeenCalledWith({ line_kind: "override" });
    expect(builder.eq).toHaveBeenCalledWith("id", "ln-1");
  });

  it("postStatement calls the RPC with the wire entries", async () => {
    const { client, rpc } = stubClient({ data: null, error: null });
    const entries = [
      {
        statement_line_id: "ln-1",
        policy_id: "pol-1",
        entry_kind: "agent_commission",
        payee_type: "agent",
        agent_id: "ag-1",
        agency_id: null,
        amount_cents: 8000,
        applied_bps: 8000,
        period_month: "2026-05-01",
      },
    ];
    await postStatement(client, "st-1", entries);
    expect(rpc).toHaveBeenCalledWith("post_statement", {
      p_statement_id: "st-1",
      p_entries: entries,
    });
  });

  it("postStatement throws when the RPC errors", async () => {
    const { client } = stubClient({ data: null, error: new Error("forbidden") });
    await expect(postStatement(client, "st-1", [])).rejects.toThrow("forbidden");
  });

  it("voidStatement calls the RPC", async () => {
    const { client, rpc } = stubClient({ data: null, error: null });
    await voidStatement(client, "st-1");
    expect(rpc).toHaveBeenCalledWith("void_statement", { p_statement_id: "st-1" });
  });
});
