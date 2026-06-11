import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- hoisted mocks ---
const { requireApiRole, mockCreateClient } = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  mockCreateClient: vi.fn(),
}));
const { getDocument, createSignedDownloadUrl } = vi.hoisted(() => ({
  getDocument: vi.fn(),
  createSignedDownloadUrl: vi.fn(),
}));

vi.mock("@/lib/auth/authorize", () => ({
  ALL_ROLES: ["admin", "manager", "member"],
  AUTH_ERROR: {
    401: { error: "Unauthorized" },
    403: { error: "Forbidden" },
  },
  requireApiRole,
}));

vi.mock("@/lib/data/documents", () => ({
  getDocument,
  createSignedDownloadUrl,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { GET } from "./route";

const supabase = {} as never;

function makeRequest(id = "doc-123") {
  return {
    req: new NextRequest("http://localhost/api/documents/" + id + "/download"),
    params: Promise.resolve({ id }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateClient.mockResolvedValue(supabase);
});

describe("GET /api/documents/[id]/download", () => {
  describe("authentication & authorization", () => {
    it("returns 401 when the caller is not authenticated", async () => {
      requireApiRole.mockResolvedValueOnce({ ok: false, status: 401 });

      const { req, params } = makeRequest();
      const res = await GET(req, { params });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: "Unauthorized" });
    });

    it("returns 403 when the caller is authenticated but forbidden", async () => {
      requireApiRole.mockResolvedValueOnce({ ok: false, status: 403 });

      const { req, params } = makeRequest();
      const res = await GET(req, { params });

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body).toEqual({ error: "Forbidden" });
    });

    it("passes ALL_ROLES to requireApiRole so every active role can download", async () => {
      requireApiRole.mockResolvedValueOnce({ ok: true, profile: { id: "u1", role: "member" } });
      getDocument.mockResolvedValueOnce({ id: "doc-1", storage_path: "path/file.pdf" });
      createSignedDownloadUrl.mockResolvedValueOnce("https://signed.url/file.pdf");

      const { req, params } = makeRequest("doc-1");
      await GET(req, { params });

      expect(requireApiRole).toHaveBeenCalledWith(supabase, ["admin", "manager", "member"]);
    });
  });

  describe("document lookup", () => {
    it("returns 404 when the document does not exist", async () => {
      requireApiRole.mockResolvedValueOnce({ ok: true, profile: { id: "u1", role: "admin" } });
      getDocument.mockRejectedValueOnce(new Error("Row not found"));

      const { req, params } = makeRequest("nonexistent");
      const res = await GET(req, { params });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toEqual({ error: "Document not found" });
    });

    it("calls getDocument with the id from the route params", async () => {
      requireApiRole.mockResolvedValueOnce({ ok: true, profile: { id: "u1", role: "admin" } });
      getDocument.mockResolvedValueOnce({ id: "doc-42", storage_path: "docs/file.pdf" });
      createSignedDownloadUrl.mockResolvedValueOnce("https://signed.url/file.pdf");

      const { req, params } = makeRequest("doc-42");
      await GET(req, { params });

      expect(getDocument).toHaveBeenCalledWith(supabase, "doc-42");
    });
  });

  describe("signed URL generation", () => {
    it("returns 200 with a signed URL on success", async () => {
      requireApiRole.mockResolvedValueOnce({ ok: true, profile: { id: "u1", role: "member" } });
      getDocument.mockResolvedValueOnce({ id: "doc-1", storage_path: "contracts/nda.pdf" });
      createSignedDownloadUrl.mockResolvedValueOnce("https://cdn.example.com/signed/nda.pdf");

      const { req, params } = makeRequest("doc-1");
      const res = await GET(req, { params });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ url: "https://cdn.example.com/signed/nda.pdf" });
    });

    it("passes the document storage_path to createSignedDownloadUrl", async () => {
      requireApiRole.mockResolvedValueOnce({ ok: true, profile: { id: "u1", role: "admin" } });
      getDocument.mockResolvedValueOnce({ id: "doc-5", storage_path: "invoices/invoice-001.pdf" });
      createSignedDownloadUrl.mockResolvedValueOnce("https://signed.url");

      const { req, params } = makeRequest("doc-5");
      await GET(req, { params });

      expect(createSignedDownloadUrl).toHaveBeenCalledWith(supabase, "invoices/invoice-001.pdf");
    });

    it("uses the supabase client from createClient for all operations", async () => {
      requireApiRole.mockResolvedValueOnce({ ok: true, profile: { id: "u1", role: "admin" } });
      getDocument.mockResolvedValueOnce({ id: "doc-7", storage_path: "path/file.pdf" });
      createSignedDownloadUrl.mockResolvedValueOnce("https://signed.url");

      const { req, params } = makeRequest("doc-7");
      await GET(req, { params });

      expect(mockCreateClient).toHaveBeenCalledTimes(1);
    });
  });

  describe("edge cases", () => {
    it("returns 404 even when getDocument throws a non-Error rejection", async () => {
      requireApiRole.mockResolvedValueOnce({ ok: true, profile: { id: "u1", role: "admin" } });
      getDocument.mockRejectedValueOnce("string error");

      const { req, params } = makeRequest("bad-id");
      const res = await GET(req, { params });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toEqual({ error: "Document not found" });
    });
  });
});
