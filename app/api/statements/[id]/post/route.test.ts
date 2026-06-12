import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Hoisted mocks (must come before any import that transitively loads the SUT)
const mockRequireApiRole = vi.hoisted(() => vi.fn());
const mockGetStatement = vi.hoisted(() => vi.fn());
const mockListStatementLines = vi.hoisted(() => vi.fn());
const mockPostStatement = vi.hoisted(() => vi.fn());
const mockGetPolicy = vi.hoisted(() => vi.fn());
const mockGetAgent = vi.hoisted(() => vi.fn());
const mockGetAgency = vi.hoisted(() => vi.fn());
const mockCreateClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/authorize", () => ({
  STAFF: ["admin", "manager"],
  AUTH_ERROR: {
    401: { error: "Unauthorized" },
    403: { error: "Forbidden" },
  },
  requireApiRole: mockRequireApiRole,
}));

vi.mock("@/lib/data/statements", () => ({
  getStatement: mockGetStatement,
  listStatementLines: mockListStatementLines,
  postStatement: mockPostStatement,
}));

vi.mock("@/lib/data/policies", () => ({ getPolicy: mockGetPolicy }));
vi.mock("@/lib/data/agents", () => ({ getAgent: mockGetAgent }));
vi.mock("@/lib/data/agencies", () => ({ getAgency: mockGetAgency }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { POST } from "./route";

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/statements/${id}/post`, { method: "POST" });
}

function call(id: string) {
  return POST(makeRequest(id), { params: Promise.resolve({ id }) });
}

async function json(res: Response) {
  return res.json() as Promise<Record<string, unknown>>;
}

const stubSupabase = {};

function makeStatement(overrides: Record<string, unknown> = {}) {
  return {
    id: "st-1",
    carrier_id: "k1",
    period_month: "2026-05-01",
    status: "matching",
    ...overrides,
  };
}

function makeLine(overrides: Record<string, unknown> = {}) {
  return {
    id: "ln-1",
    statement_id: "st-1",
    row_index: 0,
    amount_cents: 10000,
    line_kind: "commission",
    match_status: "auto_matched",
    matched_policy_id: "pol-1",
    posted: false,
    ...overrides,
  };
}

const DIRECT_AGENT = { id: "ag-1", commission_split_bps: 8000, agency_id: null };
const AGENCY_AGENT = { id: "ag-2", commission_split_bps: 5000, agency_id: "agy-1" };
const AGENCY = { id: "agy-1", commission_cut_bps: 5000, override_cut_bps: 2000 };

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateClient.mockResolvedValue(stubSupabase);
  mockRequireApiRole.mockResolvedValue({ ok: true, profile: { id: "u1", role: "admin" } });
  mockGetStatement.mockResolvedValue(makeStatement());
  mockPostStatement.mockResolvedValue(undefined);
  mockGetPolicy.mockResolvedValue({ id: "pol-1", agent_id: "ag-1" });
  mockGetAgent.mockResolvedValue(DIRECT_AGENT);
});

describe("POST /api/statements/[id]/post", () => {
  it("returns 401 when requireApiRole reports no authenticated user", async () => {
    mockRequireApiRole.mockResolvedValue({ ok: false, status: 401 });

    const res = await call("st-1");

    expect(res.status).toBe(401);
    await expect(json(res)).resolves.toEqual({ error: "Unauthorized" });
    expect(mockPostStatement).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-staff caller", async () => {
    mockRequireApiRole.mockResolvedValue({ ok: false, status: 403 });

    const res = await call("st-1");

    expect(res.status).toBe(403);
    await expect(json(res)).resolves.toEqual({ error: "Forbidden" });
    expect(mockPostStatement).not.toHaveBeenCalled();
  });

  it("authorizes against the STAFF allow-list", async () => {
    mockListStatementLines.mockResolvedValue([makeLine()]);

    await call("st-1");

    expect(mockRequireApiRole).toHaveBeenCalledWith(stubSupabase, ["admin", "manager"]);
  });

  it("returns 404 when the statement does not exist", async () => {
    mockGetStatement.mockRejectedValue(new Error("not found"));

    const res = await call("missing");

    expect(res.status).toBe(404);
    await expect(json(res)).resolves.toEqual({ error: "Statement not found" });
  });

  it("returns 400 when the statement is already posted", async () => {
    mockGetStatement.mockResolvedValue(makeStatement({ status: "posted" }));

    const res = await call("st-1");

    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.error).toMatch(/not postable/);
    expect(mockPostStatement).not.toHaveBeenCalled();
  });

  it("returns 400 when there are zero matched lines", async () => {
    mockListStatementLines.mockResolvedValue([
      makeLine({ id: "ln-1", match_status: "unmatched", matched_policy_id: null }),
      makeLine({ id: "ln-2", match_status: "ignored", matched_policy_id: null }),
    ]);

    const res = await call("st-1");

    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.error).toMatch(/No matched lines/);
    expect(mockPostStatement).not.toHaveBeenCalled();
  });

  it("posts the matched lines: entries sum to the matched total, wire shape intact", async () => {
    mockListStatementLines.mockResolvedValue([
      makeLine({ id: "ln-1", amount_cents: 10000 }),
      makeLine({ id: "ln-2", amount_cents: -3333, match_status: "manual_matched" }),
      makeLine({
        id: "ln-3",
        amount_cents: 99999,
        match_status: "unmatched",
        matched_policy_id: null,
      }),
      makeLine({
        id: "ln-4",
        amount_cents: 55555,
        match_status: "ignored",
        matched_policy_id: null,
      }),
    ]);

    const res = await call("st-1");

    expect(res.status).toBe(200);
    expect(mockPostStatement).toHaveBeenCalledTimes(1);
    const [, statementId, entries] = mockPostStatement.mock.calls[0] as [
      unknown,
      string,
      Array<Record<string, unknown>>,
    ];
    expect(statementId).toBe("st-1");

    // The skipped lines never appear; the wires sum exactly to the matched total.
    const lineIds = new Set(entries.map((e) => e.statement_line_id));
    expect(lineIds).toEqual(new Set(["ln-1", "ln-2"]));
    const sum = entries.reduce((acc, e) => acc + (e.amount_cents as number), 0);
    expect(sum).toBe(10000 - 3333);

    for (const e of entries) {
      expect(e.policy_id).toBe("pol-1");
      expect(e.period_month).toBe("2026-05-01");
    }

    await expect(json(res)).resolves.toEqual({ posted: 2, entries: entries.length });
  });

  it("splits agency-bound agents across agent, agency, and house", async () => {
    mockListStatementLines.mockResolvedValue([makeLine({ amount_cents: 10000 })]);
    mockGetPolicy.mockResolvedValue({ id: "pol-1", agent_id: "ag-2" });
    mockGetAgent.mockResolvedValue(AGENCY_AGENT);
    mockGetAgency.mockResolvedValue(AGENCY);

    const res = await call("st-1");

    expect(res.status).toBe(200);
    const entries = mockPostStatement.mock.calls[0][2] as Array<Record<string, unknown>>;
    expect(entries.map((e) => e.entry_kind)).toEqual([
      "agent_commission",
      "agency_commission",
      "house_commission",
    ]);
    // 50% agent → 5000; agency takes 50% of the remainder → 2500; house keeps 2500.
    expect(entries.map((e) => e.amount_cents)).toEqual([5000, 2500, 2500]);
    expect(entries[1].agency_id).toBe("agy-1");
    const sum = entries.reduce((acc, e) => acc + (e.amount_cents as number), 0);
    expect(sum).toBe(10000);
  });

  it("skips lines already posted", async () => {
    mockListStatementLines.mockResolvedValue([
      makeLine({ id: "ln-1", posted: true }),
      makeLine({ id: "ln-2" }),
    ]);

    const res = await call("st-1");

    expect(res.status).toBe(200);
    const entries = mockPostStatement.mock.calls[0][2] as Array<Record<string, unknown>>;
    expect(new Set(entries.map((e) => e.statement_line_id))).toEqual(new Set(["ln-2"]));
    await expect(json(res)).resolves.toMatchObject({ posted: 1 });
  });

  it("returns 500 with the RPC error message when posting fails", async () => {
    mockListStatementLines.mockResolvedValue([makeLine()]);
    mockPostStatement.mockRejectedValue(new Error("forbidden"));

    const res = await call("st-1");

    expect(res.status).toBe(500);
    await expect(json(res)).resolves.toEqual({ error: "forbidden" });
  });
});
