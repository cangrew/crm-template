import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockRefetch = vi.fn();
let docsData: unknown[] | undefined = undefined;
let docsIsLoading = false;
let docsIsError = false;
let profileData: { role: string | null } | undefined = { role: "admin" };

vi.mock("@/lib/data/hooks", () => ({
  useDocuments: () => ({
    data: docsData,
    isLoading: docsIsLoading,
    isError: docsIsError,
    refetch: mockRefetch,
  }),
  useCurrentProfile: () => ({ data: profileData }),
}));

vi.mock("@/lib/auth/roles", () => ({
  can: (role: string, action: string) => {
    if (role === "admin" || role === "manager") return true;
    if (role === "member" && action === "read") return true;
    return false;
  },
}));

vi.mock("@/components/documents/documents-filter-bar", () => ({
  DocumentsFilterBar: ({
    onQ,
    onKind,
    kinds,
  }: {
    onQ: (v: string) => void;
    onKind: (v: string) => void;
    kinds: string[];
  }) => (
    <div>
      <input aria-label="search" onChange={(e) => onQ(e.target.value)} />
      <select aria-label="kind" onChange={(e) => onKind(e.target.value)}>
        <option value="">All</option>
        {kinds.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock("@/components/documents/document-card", () => ({
  DocumentCard: ({ doc }: { doc: { id: string; kind: string; storage_path: string } }) => (
    <div data-testid={`doc-card-${doc.id}`}>{doc.kind}</div>
  ),
}));

vi.mock("@/components/documents/upload-document-modal", () => ({
  UploadDocumentModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">Upload Modal</div> : null,
}));

vi.mock("@/components/common/page-states", () => ({
  PageErrorState: ({ body, onRetry }: { body: string; onRetry: () => void }) => (
    <div>
      <p>{body}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

vi.mock("@/components/common/page-header", () => ({
  PageHeader: ({
    title,
    subtitle,
    actions,
  }: {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {actions}
    </div>
  ),
}));

vi.mock("@/components/common/card-grid", () => ({
  CardGrid: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-grid">{children}</div>
  ),
}));

vi.mock("@/components/ui/btn", () => ({
  Btn: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    icon?: React.ReactNode;
  }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock("@/components/ui/states", () => ({
  EmptyState: ({
    title,
    body,
    action,
  }: {
    icon?: unknown;
    title: string;
    body: string;
    action?: React.ReactNode;
  }) => (
    <div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  ),
}));

import DocumentsPage from "./page";

function makeDoc(
  overrides: Partial<{
    id: string;
    kind: string;
    storage_path: string;
    contact_id: string | null;
    created_at: string;
  }> = {},
) {
  return {
    id: "doc-1",
    kind: "contract",
    storage_path: "general/contract-123.pdf",
    contact_id: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  docsData = undefined;
  docsIsLoading = false;
  docsIsError = false;
  profileData = { role: "admin" };
});

describe("DocumentsPage", () => {
  it("renders the page title", () => {
    docsData = [];
    render(<DocumentsPage />);
    expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument();
  });

  it("shows loading skeleton when documents are loading", () => {
    docsIsLoading = true;
    render(<DocumentsPage />);
    // Skeleton cards are rendered as divs with the skel class
    expect(screen.getByTestId("card-grid")).toBeInTheDocument();
  });

  it("shows error state and retry on error", () => {
    docsIsError = true;
    render(<DocumentsPage />);
    expect(screen.getByText("Failed to fetch documents.")).toBeInTheDocument();

    screen.getByRole("button", { name: "Retry" }).click();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("shows 'No documents yet' empty state when there are no documents", () => {
    docsData = [];
    render(<DocumentsPage />);
    expect(screen.getByRole("heading", { name: "No documents yet" })).toBeInTheDocument();
  });

  it("shows upload button in empty state for admin", () => {
    docsData = [];
    profileData = { role: "admin" };
    render(<DocumentsPage />);
    expect(screen.getAllByRole("button", { name: "Upload document" }).length).toBeGreaterThan(0);
  });

  it("hides upload button in empty state for member (cannot create)", () => {
    docsData = [];
    profileData = { role: "member" };
    render(<DocumentsPage />);
    expect(screen.queryByRole("button", { name: "Upload document" })).not.toBeInTheDocument();
  });

  it("shows Upload button in header for admin", () => {
    docsData = [];
    profileData = { role: "admin" };
    render(<DocumentsPage />);
    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
  });

  it("hides Upload button in header for member", () => {
    docsData = [];
    profileData = { role: "member" };
    render(<DocumentsPage />);
    expect(screen.queryByRole("button", { name: "Upload" })).not.toBeInTheDocument();
  });

  it("opens upload modal when Upload button is clicked", async () => {
    docsData = [];
    render(<DocumentsPage />);
    await userEvent.click(screen.getByRole("button", { name: "Upload" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders document cards when documents are loaded", () => {
    docsData = [makeDoc({ id: "d1", kind: "contract" }), makeDoc({ id: "d2", kind: "invoice" })];
    render(<DocumentsPage />);
    expect(screen.getByTestId("doc-card-d1")).toBeInTheDocument();
    expect(screen.getByTestId("doc-card-d2")).toBeInTheDocument();
  });

  it("shows subtitle with correct file count", () => {
    docsData = [makeDoc({ id: "d1" }), makeDoc({ id: "d2" })];
    render(<DocumentsPage />);
    expect(screen.getByText("2 files on record")).toBeInTheDocument();
  });

  it("shows singular 'file' when count is 1", () => {
    docsData = [makeDoc({ id: "d1" })];
    render(<DocumentsPage />);
    expect(screen.getByText("1 file on record")).toBeInTheDocument();
  });

  it("filters documents by search query matching kind", async () => {
    docsData = [
      makeDoc({ id: "d1", kind: "contract", storage_path: "general/contract.pdf" }),
      makeDoc({ id: "d2", kind: "invoice", storage_path: "general/invoice.pdf" }),
    ];
    render(<DocumentsPage />);

    await userEvent.type(screen.getByLabelText("search"), "contract");

    expect(screen.getByTestId("doc-card-d1")).toBeInTheDocument();
    expect(screen.queryByTestId("doc-card-d2")).not.toBeInTheDocument();
  });

  it("filters documents by search query matching storage_path", async () => {
    docsData = [
      makeDoc({ id: "d1", kind: "other", storage_path: "contacts/abc/report.pdf" }),
      makeDoc({ id: "d2", kind: "other", storage_path: "general/budget.pdf" }),
    ];
    render(<DocumentsPage />);

    await userEvent.type(screen.getByLabelText("search"), "report");

    expect(screen.getByTestId("doc-card-d1")).toBeInTheDocument();
    expect(screen.queryByTestId("doc-card-d2")).not.toBeInTheDocument();
  });

  it("filters documents by kind dropdown", async () => {
    docsData = [makeDoc({ id: "d1", kind: "contract" }), makeDoc({ id: "d2", kind: "invoice" })];
    render(<DocumentsPage />);

    await userEvent.selectOptions(screen.getByLabelText("kind"), "contract");

    expect(screen.getByTestId("doc-card-d1")).toBeInTheDocument();
    expect(screen.queryByTestId("doc-card-d2")).not.toBeInTheDocument();
  });

  it("shows 'No documents match these filters' empty state when filters exclude all", async () => {
    docsData = [makeDoc({ kind: "contract" })];
    render(<DocumentsPage />);

    await userEvent.type(screen.getByLabelText("search"), "no-such-document");

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "No documents match these filters" }),
      ).toBeInTheDocument();
    });
  });

  it("search is case-insensitive", async () => {
    docsData = [makeDoc({ id: "d1", kind: "Contract", storage_path: "general/doc.pdf" })];
    render(<DocumentsPage />);

    await userEvent.type(screen.getByLabelText("search"), "CONTRACT");

    expect(screen.getByTestId("doc-card-d1")).toBeInTheDocument();
  });
});
