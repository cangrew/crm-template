import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentRow } from "@/lib/supabase/types";

// --- hoisted mocks ---
const { useDocuments, useCurrentProfile } = vi.hoisted(() => ({
  useDocuments: vi.fn(),
  useCurrentProfile: vi.fn(),
}));

vi.mock("@/lib/data/hooks", () => ({
  useDocuments,
  useCurrentProfile,
}));

vi.mock("@/components/documents/document-card", () => ({
  DocumentCard: ({ doc }: { doc: DocumentRow }) => (
    <div data-testid="document-card" data-id={doc.id}>
      {doc.kind}:{doc.storage_path}
    </div>
  ),
}));

vi.mock("@/components/documents/documents-filter-bar", () => ({
  DocumentsFilterBar: ({
    q,
    onQ,
    kind,
    onKind,
    kinds,
  }: {
    q: string;
    onQ: (v: string) => void;
    kind: string;
    onKind: (v: string) => void;
    kinds: string[];
  }) => (
    <div>
      <input
        data-testid="filter-q"
        value={q}
        onChange={(e) => onQ(e.target.value)}
        placeholder="Search"
      />
      <select data-testid="filter-kind" value={kind} onChange={(e) => onKind(e.target.value)}>
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

vi.mock("@/components/documents/upload-document-modal", () => ({
  UploadDocumentModal: ({ open }: { open: boolean }) => (
    <div data-testid="upload-modal" data-open={String(open)} />
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
      {subtitle && <p data-testid="subtitle">{subtitle}</p>}
      {actions && <div data-testid="page-actions">{actions}</div>}
    </div>
  ),
}));

vi.mock("@/components/common/page-states", () => ({
  PageErrorState: ({ body, onRetry }: { body: string; onRetry: () => void }) => (
    <div data-testid="error-state">
      <span>{body}</span>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

vi.mock("@/components/common/card-grid", () => ({
  CardGrid: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-grid">{children}</div>
  ),
}));

vi.mock("@/components/ui/btn", () => ({
  Btn: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock("@/components/ui/states", () => ({
  EmptyState: ({
    title,
    action,
  }: {
    title: string;
    body?: string;
    action?: React.ReactNode;
  }) => (
    <div data-testid="empty-state">
      {title}
      {action && <div data-testid="empty-action">{action}</div>}
    </div>
  ),
}));

import DocumentsPage from "./page";

function doc(overrides: Partial<DocumentRow> = {}): DocumentRow {
  return {
    id: "d1",
    kind: "contract",
    storage_path: "contracts/nda.pdf",
    contact_id: null,
    created_by: "u1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeDocsQ(overrides: Record<string, unknown> = {}) {
  return {
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useCurrentProfile.mockReturnValue({ data: { role: "admin" } });
  useDocuments.mockReturnValue(makeDocsQ());
});

describe("DocumentsPage", () => {
  describe("subtitle", () => {
    it("shows '0 files on record' when empty", () => {
      render(<DocumentsPage />);
      expect(screen.getByTestId("subtitle").textContent).toBe("0 files on record");
    });

    it("uses singular 'file' for exactly one document", () => {
      useDocuments.mockReturnValue(makeDocsQ({ data: [doc()] }));
      render(<DocumentsPage />);
      expect(screen.getByTestId("subtitle").textContent).toBe("1 file on record");
    });

    it("uses plural 'files' for more than one document", () => {
      useDocuments.mockReturnValue(
        makeDocsQ({ data: [doc({ id: "d1" }), doc({ id: "d2" })] }),
      );
      render(<DocumentsPage />);
      expect(screen.getByTestId("subtitle").textContent).toBe("2 files on record");
    });
  });

  describe("allKinds extraction", () => {
    it("passes unique sorted kinds to the filter bar", () => {
      useDocuments.mockReturnValue(
        makeDocsQ({
          data: [
            doc({ id: "1", kind: "invoice" }),
            doc({ id: "2", kind: "contract" }),
            doc({ id: "3", kind: "invoice" }),
            doc({ id: "4", kind: "amendment" }),
          ],
        }),
      );
      render(<DocumentsPage />);
      // The filter bar renders <option> elements for each kind
      const options = screen.getAllByRole("option");
      const kindOptions = options.filter((o) => o.getAttribute("value") !== "");
      const kindValues = kindOptions.map((o) => o.getAttribute("value"));
      expect(kindValues).toEqual(["amendment", "contract", "invoice"]);
    });
  });

  describe("filter by text (q)", () => {
    const docs = [
      doc({ id: "1", kind: "contract", storage_path: "contracts/nda.pdf" }),
      doc({ id: "2", kind: "invoice", storage_path: "invoices/inv-001.pdf" }),
      doc({ id: "3", kind: "amendment", storage_path: "amendments/amend-a.pdf" }),
    ];

    beforeEach(() => {
      useDocuments.mockReturnValue(makeDocsQ({ data: docs }));
    });

    it("shows all documents when the search is empty", () => {
      render(<DocumentsPage />);
      expect(screen.getAllByTestId("document-card")).toHaveLength(3);
    });

    it("filters by kind", () => {
      render(<DocumentsPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "invoice" } });
      expect(screen.getAllByTestId("document-card")).toHaveLength(1);
      expect(screen.getByTestId("document-card")).toHaveTextContent("invoice");
    });

    it("filters by storage_path substring", () => {
      render(<DocumentsPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "amend" } });
      const cards = screen.getAllByTestId("document-card");
      expect(cards).toHaveLength(1);
      expect(cards[0]).toHaveAttribute("data-id", "3");
    });

    it("is case-insensitive", () => {
      render(<DocumentsPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "CONTRACT" } });
      const cards = screen.getAllByTestId("document-card");
      expect(cards).toHaveLength(1);
      expect(cards[0]).toHaveAttribute("data-id", "1");
    });

    it("shows empty state with 'No documents match these filters' when some exist but none match", () => {
      render(<DocumentsPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "zzznomatch" } });
      expect(screen.getByTestId("empty-state")).toHaveTextContent(
        "No documents match these filters",
      );
    });
  });

  describe("filter by kind (dropdown)", () => {
    const docs = [
      doc({ id: "1", kind: "contract", storage_path: "contracts/a.pdf" }),
      doc({ id: "2", kind: "invoice", storage_path: "invoices/b.pdf" }),
    ];

    beforeEach(() => {
      useDocuments.mockReturnValue(makeDocsQ({ data: docs }));
    });

    it("filters documents to only the selected kind", () => {
      render(<DocumentsPage />);
      fireEvent.change(screen.getByTestId("filter-kind"), { target: { value: "invoice" } });
      const cards = screen.getAllByTestId("document-card");
      expect(cards).toHaveLength(1);
      expect(cards[0]).toHaveAttribute("data-id", "2");
    });

    it("shows all documents when the kind filter is cleared", () => {
      render(<DocumentsPage />);
      fireEvent.change(screen.getByTestId("filter-kind"), { target: { value: "contract" } });
      fireEvent.change(screen.getByTestId("filter-kind"), { target: { value: "" } });
      expect(screen.getAllByTestId("document-card")).toHaveLength(2);
    });
  });

  describe("combined filters (text + kind)", () => {
    it("applies both text and kind filters together", () => {
      useDocuments.mockReturnValue(
        makeDocsQ({
          data: [
            doc({ id: "1", kind: "contract", storage_path: "contracts/nda.pdf" }),
            doc({ id: "2", kind: "contract", storage_path: "contracts/msa.pdf" }),
            doc({ id: "3", kind: "invoice", storage_path: "invoices/inv.pdf" }),
          ],
        }),
      );
      render(<DocumentsPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "nda" } });
      fireEvent.change(screen.getByTestId("filter-kind"), { target: { value: "contract" } });
      const cards = screen.getAllByTestId("document-card");
      expect(cards).toHaveLength(1);
      expect(cards[0]).toHaveAttribute("data-id", "1");
    });
  });

  describe("role-based permissions", () => {
    it("shows the Upload button for admin role", () => {
      // Supply a non-empty list so only the header button renders (no empty-state action)
      useDocuments.mockReturnValue(makeDocsQ({ data: [doc()] }));
      render(<DocumentsPage />);
      expect(screen.getByRole("button", { name: /^upload$/i })).toBeInTheDocument();
    });

    it("shows the Upload button for manager role", () => {
      useCurrentProfile.mockReturnValue({ data: { role: "manager" } });
      useDocuments.mockReturnValue(makeDocsQ({ data: [doc()] }));
      render(<DocumentsPage />);
      expect(screen.getByRole("button", { name: /^upload$/i })).toBeInTheDocument();
    });

    it("hides the Upload button for member role", () => {
      useCurrentProfile.mockReturnValue({ data: { role: "member" } });
      render(<DocumentsPage />);
      expect(screen.queryByRole("button", { name: /^upload$/i })).not.toBeInTheDocument();
    });

    it("hides the Upload button when no profile is loaded", () => {
      useCurrentProfile.mockReturnValue({ data: null });
      render(<DocumentsPage />);
      expect(screen.queryByRole("button", { name: /^upload$/i })).not.toBeInTheDocument();
    });

    it("shows an Upload action in the empty state for users who can upload", () => {
      useCurrentProfile.mockReturnValue({ data: { role: "admin" } });
      useDocuments.mockReturnValue(makeDocsQ({ data: [] }));
      render(<DocumentsPage />);
      expect(screen.getByTestId("empty-action")).toBeInTheDocument();
    });

    it("omits Upload action from empty state for member role", () => {
      useCurrentProfile.mockReturnValue({ data: { role: "member" } });
      useDocuments.mockReturnValue(makeDocsQ({ data: [] }));
      render(<DocumentsPage />);
      expect(screen.queryByTestId("empty-action")).not.toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders skeleton cards while loading", () => {
      useDocuments.mockReturnValue(makeDocsQ({ isLoading: true, data: undefined }));
      render(<DocumentsPage />);
      // The skeleton renders 8 placeholder divs inside CardGrid, not document-card testids
      expect(screen.queryByTestId("document-card")).not.toBeInTheDocument();
      expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("renders the error state when the query errors", () => {
      useDocuments.mockReturnValue(makeDocsQ({ isError: true }));
      render(<DocumentsPage />);
      expect(screen.getByTestId("error-state")).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch documents.")).toBeInTheDocument();
    });

    it("calls refetch on retry", () => {
      const refetch = vi.fn();
      useDocuments.mockReturnValue(makeDocsQ({ isError: true, refetch }));
      render(<DocumentsPage />);
      fireEvent.click(screen.getByRole("button", { name: /retry/i }));
      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("empty state messages", () => {
    it("shows 'No documents yet' when there are no documents at all", () => {
      render(<DocumentsPage />);
      expect(screen.getByTestId("empty-state")).toHaveTextContent("No documents yet");
    });
  });
});