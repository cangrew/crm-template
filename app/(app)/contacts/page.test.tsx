import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Contact } from "@/lib/supabase/types";

// --- hoisted mocks ---
const { useContacts, useCurrentProfile } = vi.hoisted(() => ({
  useContacts: vi.fn(),
  useCurrentProfile: vi.fn(),
}));

vi.mock("@/lib/data/hooks", () => ({
  useContacts,
  useCurrentProfile,
}));

// Mock child components — ContactsTable renders rows as list items so we can
// verify which contacts the filter exposes without coupling to table markup.
vi.mock("@/components/contacts/contacts-table", () => ({
  ContactsTable: ({ rows, canUpdate }: { rows: Contact[]; canUpdate: boolean }) => (
    <ul data-testid="contacts-table" data-can-update={String(canUpdate)}>
      {rows.map((r) => (
        <li key={r.id} data-testid="contact-row">
          {r.name}
        </li>
      ))}
    </ul>
  ),
}));

// ContactsFilterBar calls back with updated q / status values via its props.
vi.mock("@/components/contacts/contacts-filter-bar", () => ({
  ContactsFilterBar: ({
    q,
    onQ,
    status,
    onStatus,
  }: {
    q: string;
    onQ: (v: string) => void;
    status: string;
    onStatus: (v: string) => void;
  }) => (
    <div>
      <input
        data-testid="filter-q"
        value={q}
        onChange={(e) => onQ(e.target.value)}
        placeholder="Search"
      />
      <select data-testid="filter-status" value={status} onChange={(e) => onStatus(e.target.value)}>
        <option value="">All</option>
        <option value="active">active</option>
        <option value="lead">lead</option>
        <option value="at_risk">at_risk</option>
        <option value="closed">closed</option>
      </select>
    </div>
  ),
}));

vi.mock("@/components/contacts/new-contact-modal", () => ({
  NewContactModal: ({ open }: { open: boolean }) => (
    <div data-testid="new-contact-modal" data-open={String(open)} />
  ),
}));

vi.mock("@/components/common/page-header", () => ({
  PageHeader: ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) => (
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

vi.mock("@/components/ui/btn", () => ({
  Btn: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock("@/components/ui/states", () => ({
  EmptyState: ({ title }: { title: string }) => (
    <div data-testid="empty-state">{title}</div>
  ),
  TableSkeleton: () => <tr><td>loading…</td></tr>,
}));

vi.mock("@/components/ui/table", () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
}));

import ContactsPage from "./page";

// Minimal contact factory
function contact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "c1",
    name: "Alice Smith",
    email: "alice@example.com",
    phone: null,
    company: "Acme Co",
    status: "active",
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeContactsQ(overrides: Record<string, unknown> = {}) {
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
  useContacts.mockReturnValue(makeContactsQ());
});

describe("ContactsPage", () => {
  describe("subtitle counts", () => {
    it("shows total and active counts", () => {
      useContacts.mockReturnValue(
        makeContactsQ({
          data: [
            contact({ id: "1", status: "active" }),
            contact({ id: "2", status: "lead" }),
            contact({ id: "3", status: "active" }),
          ],
        }),
      );
      render(<ContactsPage />);
      expect(screen.getByTestId("subtitle").textContent).toBe("3 total · 2 active");
    });

    it("shows zero counts when there are no contacts", () => {
      render(<ContactsPage />);
      expect(screen.getByTestId("subtitle").textContent).toBe("0 total · 0 active");
    });
  });

  describe("filter by text (q)", () => {
    const contacts = [
      contact({ id: "a", name: "Alice Smith", company: "Acme", email: "alice@acme.com" }),
      contact({ id: "b", name: "Bob Jones", company: "Beta LLC", email: "bob@beta.com" }),
      contact({ id: "c", name: "Carol", company: null, email: "carol@example.com" }),
    ];

    beforeEach(() => {
      useContacts.mockReturnValue(makeContactsQ({ data: contacts }));
    });

    it("shows all contacts when filter is empty", () => {
      render(<ContactsPage />);
      expect(screen.getAllByTestId("contact-row")).toHaveLength(3);
    });

    it("filters by name (case-insensitive)", () => {
      render(<ContactsPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "alice" } });
      const rows = screen.getAllByTestId("contact-row");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent("Alice Smith");
    });

    it("filters by company", () => {
      render(<ContactsPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "beta" } });
      const rows = screen.getAllByTestId("contact-row");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent("Bob Jones");
    });

    it("filters by email", () => {
      render(<ContactsPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "carol@" } });
      const rows = screen.getAllByTestId("contact-row");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent("Carol");
    });

    it("shows empty state when no contacts match the text filter", () => {
      render(<ContactsPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "zzznomatch" } });
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
      expect(screen.queryByTestId("contacts-table")).not.toBeInTheDocument();
    });

    it("shows 'No contacts match these filters' when some contacts exist but none match", () => {
      render(<ContactsPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "zzznomatch" } });
      expect(screen.getByTestId("empty-state")).toHaveTextContent("No contacts match these filters");
    });

    it("handles contacts with null company without crashing", () => {
      render(<ContactsPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "carol" } });
      expect(screen.getAllByTestId("contact-row")).toHaveLength(1);
    });
  });

  describe("filter by status", () => {
    const contacts = [
      contact({ id: "1", status: "active" }),
      contact({ id: "2", name: "Bob", status: "lead" }),
      contact({ id: "3", name: "Carol", status: "at_risk" }),
    ];

    beforeEach(() => {
      useContacts.mockReturnValue(makeContactsQ({ data: contacts }));
    });

    it("shows only active contacts when active status is selected", () => {
      render(<ContactsPage />);
      fireEvent.change(screen.getByTestId("filter-status"), { target: { value: "active" } });
      const rows = screen.getAllByTestId("contact-row");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent("Alice Smith");
    });

    it("shows only leads when lead status is selected", () => {
      render(<ContactsPage />);
      fireEvent.change(screen.getByTestId("filter-status"), { target: { value: "lead" } });
      const rows = screen.getAllByTestId("contact-row");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent("Bob");
    });

    it("shows all contacts when status filter is cleared", () => {
      render(<ContactsPage />);
      fireEvent.change(screen.getByTestId("filter-status"), { target: { value: "lead" } });
      fireEvent.change(screen.getByTestId("filter-status"), { target: { value: "" } });
      expect(screen.getAllByTestId("contact-row")).toHaveLength(3);
    });
  });

  describe("combined filters (text + status)", () => {
    it("applies both filters simultaneously", () => {
      useContacts.mockReturnValue(
        makeContactsQ({
          data: [
            // Use distinct emails so only the name drives the text match
            contact({ id: "1", name: "AliceActive", status: "active", company: "Acme", email: "aa@test.com" }),
            contact({ id: "2", name: "AliceLead", status: "lead", company: "Acme", email: "al@test.com" }),
            contact({ id: "3", name: "BobActive", status: "active", company: "Beta", email: "ba@test.com" }),
          ],
        }),
      );
      render(<ContactsPage />);
      // "alice" matches AliceActive and AliceLead by name; adding "active" status keeps only AliceActive
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "alice" } });
      fireEvent.change(screen.getByTestId("filter-status"), { target: { value: "active" } });
      const rows = screen.getAllByTestId("contact-row");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent("AliceActive");
    });
  });

  describe("role-based permissions", () => {
    it("shows the New Contact button for admin role", () => {
      useCurrentProfile.mockReturnValue({ data: { role: "admin" } });
      render(<ContactsPage />);
      expect(screen.getByRole("button", { name: /new contact/i })).toBeInTheDocument();
    });

    it("shows the New Contact button for manager role", () => {
      useCurrentProfile.mockReturnValue({ data: { role: "manager" } });
      render(<ContactsPage />);
      expect(screen.getByRole("button", { name: /new contact/i })).toBeInTheDocument();
    });

    it("hides the New Contact button for member role", () => {
      useCurrentProfile.mockReturnValue({ data: { role: "member" } });
      render(<ContactsPage />);
      expect(screen.queryByRole("button", { name: /new contact/i })).not.toBeInTheDocument();
    });

    it("hides the New Contact button when profile is not loaded", () => {
      useCurrentProfile.mockReturnValue({ data: null });
      render(<ContactsPage />);
      expect(screen.queryByRole("button", { name: /new contact/i })).not.toBeInTheDocument();
    });

    it("passes canUpdate=true to ContactsTable for admin role", () => {
      useCurrentProfile.mockReturnValue({ data: { role: "admin" } });
      useContacts.mockReturnValue(
        makeContactsQ({ data: [contact()] }),
      );
      render(<ContactsPage />);
      expect(screen.getByTestId("contacts-table")).toHaveAttribute("data-can-update", "true");
    });

    it("passes canUpdate=false to ContactsTable for member role", () => {
      useCurrentProfile.mockReturnValue({ data: { role: "member" } });
      useContacts.mockReturnValue(
        makeContactsQ({ data: [contact()] }),
      );
      render(<ContactsPage />);
      expect(screen.getByTestId("contacts-table")).toHaveAttribute("data-can-update", "false");
    });
  });

  describe("loading state", () => {
    it("renders the loading skeleton when data is loading", () => {
      useContacts.mockReturnValue(makeContactsQ({ isLoading: true, data: undefined }));
      render(<ContactsPage />);
      expect(screen.queryByTestId("contacts-table")).not.toBeInTheDocument();
      expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("renders the error state when query errors", () => {
      useContacts.mockReturnValue(makeContactsQ({ isError: true }));
      render(<ContactsPage />);
      expect(screen.getByTestId("error-state")).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch contacts.")).toBeInTheDocument();
    });

    it("calls refetch when the retry button is clicked", () => {
      const refetch = vi.fn();
      useContacts.mockReturnValue(makeContactsQ({ isError: true, refetch }));
      render(<ContactsPage />);
      fireEvent.click(screen.getByRole("button", { name: /retry/i }));
      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("empty state", () => {
    it("shows 'No contacts yet' when there are no contacts at all", () => {
      render(<ContactsPage />);
      expect(screen.getByTestId("empty-state")).toHaveTextContent("No contacts yet");
    });
  });
});