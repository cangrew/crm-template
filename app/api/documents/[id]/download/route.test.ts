import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Hoisted mocks (must come before any import that transitively loads the SUT)
const mockRequireApiRole = vi.hoisted(() => vi.fn());
const mockGetDocument = vi.hoisted(() => vi.fn());
const mockCreateSignedDownloadUrl = vi.hoisted(() => vi.fn());
const mockCreateClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/authorize", () => ({
  ALL_ROLES: ["admin", "manager", "member"],
  AUTH_ERROR: {
    401: { error: "Unauthorized" },
    403: { error: "Forbidden" },
  },
  requireApiRole: mockRequireApiRole,
}));

vi.mock("@/lib/data/documents", () => ({
  getDocument: mockGetDocument,
  createSignedDownloadUrl: mockCreateSignedDownloadUrl,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { GET } from "./route";

/** Build a minimal NextRequest pointing at the download route. */
function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/documents/${id}/download`);
}

/** Unwrap the JSON body of a NextResponse. */
async function json(res: Response) {
  return res.json() as Promise<Record<string, unknown>>;
}

const stubSupabase = {};

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateClient.mockResolvedValue(stubSupabase);
});

describe("GET /api/documents/[id]/download", () => {
  it("returns 401 when requireApiRole reports no authenticated user", async () => {
    mockRequireApiRole.mockResolvedValue({ ok: false, status: 401 });

    const res = await GET(makeRequest("doc-1"), { params: Promise.resolve({ id: "doc-1" }) });

    expect(res.status).toBe(401);
    await expect(json(res)).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when requireApiRole reports insufficient permissions", async () => {
    mockRequireApiRole.mockResolvedValue({ ok: false, status: 403 });

    const res = await GET(makeRequest("doc-2"), { params: Promise.resolve({ id: "doc-2" }) });

    expect(res.status).toBe(403);
    await expect(json(res)).resolves.toEqual({ error: "Forbidden" });
  });

  it("returns 404 when the document is not found", async () => {
    mockRequireApiRole.mockResolvedValue({ ok: true, profile: { id: "u1", role: "member" } });
    mockGetDocument.mockRejectedValue(new Error("not found"));

    const res = await GET(makeRequest("missing"), { params: Promise.resolve({ id: "missing" }) });

    expect(res.status).toBe(404);
    await expect(json(res)).resolves.toEqual({ error: "Document not found" });
  });

  it("returns the signed URL for an authorised request", async () => {
    mockRequireApiRole.mockResolvedValue({ ok: true, profile: { id: "u1", role: "admin" } });
    mockGetDocument.mockResolvedValue({ id: "doc-3", storage_path: "general/contract.pdf" });
    mockCreateSignedDownloadUrl.mockResolvedValue("https://storage.example.com/signed-url");

    const res = await GET(makeRequest("doc-3"), { params: Promise.resolve({ id: "doc-3" }) });

    expect(res.status).toBe(200);
    await expect(json(res)).resolves.toEqual({ url: "https://storage.example.com/signed-url" });
  });

  it("calls requireApiRole with ALL_ROLES so any active role is allowed to download", async () => {
    mockRequireApiRole.mockResolvedValue({ ok: true, profile: { id: "u1", role: "member" } });
    mockGetDocument.mockResolvedValue({ id: "doc-4", storage_path: "general/file.pdf" });
    mockCreateSignedDownloadUrl.mockResolvedValue("https://example.com/url");

    await GET(makeRequest("doc-4"), { params: Promise.resolve({ id: "doc-4" }) });

    expect(mockRequireApiRole).toHaveBeenCalledWith(stubSupabase, ["admin", "manager", "member"]);
  });

  it("passes the document storage_path to createSignedDownloadUrl", async () => {
    const storagePath = "contacts/abc-123/invoice-2024.pdf";
    mockRequireApiRole.mockResolvedValue({ ok: true, profile: { id: "u1", role: "admin" } });
    mockGetDocument.mockResolvedValue({ id: "doc-5", storage_path: storagePath });
    mockCreateSignedDownloadUrl.mockResolvedValue("https://example.com/url");

    await GET(makeRequest("doc-5"), { params: Promise.resolve({ id: "doc-5" }) });

    expect(mockCreateSignedDownloadUrl).toHaveBeenCalledWith(stubSupabase, storagePath);
  });

  it("creates a supabase client for each request", async () => {
    mockRequireApiRole.mockResolvedValue({ ok: false, status: 401 });

    await GET(makeRequest("doc-6"), { params: Promise.resolve({ id: "doc-6" }) });

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
  });
});
