import { render, screen } from "@testing-library/react";
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

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/common/page-header", () => ({
  PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1 data-testid="page-title">{title}</h1>
      {subtitle && <p data-testid="page-subtitle">{subtitle}</p>}
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

vi.mock("@/components/common/stat-card", () => ({
  StatGrid: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stat-grid">{children}</div>
  ),
  StatCard: ({ label, value }: { label: string; value: number | string }) => (
    <div data-testid="stat-card" data-label={label}>
      {String(value)}
    </div>
  ),
}));

vi.mock("@/components/common/entity-table", () => ({
  EntityTable: ({
    title,
    rows,
    emptyText,
  }: {
    title: string;
    rows: Contact[];
    emptyText?: string;
    columns?: unknown[];
    clickableRows?: boolean;
  }) => (
    <div data-testid="entity-table">
      <span data-testid="table-title">{title}</span>
      {rows.length === 0 ? (
        <span data-testid="table-empty">{emptyText}</span>
      ) : (
        <ul>
          {rows.map((r) => (
            <li key={r.id} data-testid="recent-row" data-id={r.id}>
              {r.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  ),
}));

vi.mock("@/components/ui/badges", () => ({
  ContactBadge: ({ status }: { status: string }) => (
    <span data-testid="contact-badge">{status}</span>
  ),
}));

import DashboardPage from "./page";

function contact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "c1",
    name: "Alice",
    email: "alice@example.com",
    phone: null,
    company: "Acme",
    status: "active",
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeContactsQ(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useCurrentProfile.mockReturnValue({ data: null });
  useContacts.mockReturnValue(makeContactsQ({ data: [] }));
});

describe("DashboardPage", () => {
  describe("welcome greeting", () => {
    it("uses the first name from full_name", () => {
      useCurrentProfile.mockReturnValue({
        data: { full_name: "Jane Doe", email: "jane@example.com", role: "admin" },
      });
      render(<DashboardPage />);
      expect(screen.getByTestId("page-title").textContent).toBe("Welcome back, Jane");
    });

    it("falls back to email when full_name is absent", () => {
      useCurrentProfile.mockReturnValue({
        data: { full_name: null, email: "bob@example.com", role: "member" },
      });
      render(<DashboardPage />);
      expect(screen.getByTestId("page-title").textContent).toBe("Welcome back, bob@example.com");
    });

    it("falls back to 'there' when both full_name and email are absent", () => {
      useCurrentProfile.mockReturnValue({ data: null });
      render(<DashboardPage />);
      expect(screen.getByTestId("page-title").textContent).toBe("Welcome back, there");
    });
  });

  describe("role subtitle", () => {
    it("shows 'Signed in as Admin' for admin role", () => {
      useCurrentProfile.mockReturnValue({
        data: { full_name: "Dev", email: "dev@x.com", role: "admin" },
      });
      render(<DashboardPage />);
      expect(screen.getByTestId("page-subtitle").textContent).toBe("Signed in as Admin");
    });

    it("shows 'Signed in as Manager' for manager role", () => {
      useCurrentProfile.mockReturnValue({
        data: { full_name: "Dev", email: "dev@x.com", role: "manager" },
      });
      render(<DashboardPage />);
      expect(screen.getByTestId("page-subtitle").textContent).toBe("Signed in as Manager");
    });

    it("shows fallback subtitle when role is not set", () => {
      useCurrentProfile.mockReturnValue({ data: null });
      render(<DashboardPage />);
      expect(screen.getByTestId("page-subtitle").textContent).toBe("Here's where things stand");
    });
  });

  describe("byStatus counts in stat cards", () => {
    beforeEach(() => {
      useCurrentProfile.mockReturnValue({ data: { full_name: "Dev", email: "d@x.com", role: "admin" } });
    });

    it("shows correct counts for each status", () => {
      useContacts.mockReturnValue(
        makeContactsQ({
          data: [
            contact({ id: "1", status: "active" }),
            contact({ id: "2", status: "active" }),
            contact({ id: "3", status: "lead" }),
            contact({ id: "4", status: "at_risk" }),
            contact({ id: "5", status: "at_risk" }),
            contact({ id: "6", status: "closed" }),
          ],
        }),
      );
      render(<DashboardPage />);

      const cards = screen.getAllByTestId("stat-card");
      const byLabel = (label: string) =>
        cards.find((c) => c.getAttribute("data-label") === label)!;

      expect(byLabel("Total contacts").textContent).toBe("6");
      expect(byLabel("Active").textContent).toBe("2");
      expect(byLabel("Leads").textContent).toBe("1");
      expect(byLabel("At risk").textContent).toBe("2");
    });

    it("shows 0 for all counts when there are no contacts", () => {
      useContacts.mockReturnValue(makeContactsQ({ data: [] }));
      render(<DashboardPage />);
      const cards = screen.getAllByTestId("stat-card");
      cards.forEach((c) => expect(c.textContent).toBe("0"));
    });

    it("shows '—' for all counts while loading", () => {
      useContacts.mockReturnValue(makeContactsQ({ isLoading: true, data: undefined }));
      render(<DashboardPage />);
      const cards = screen.getAllByTestId("stat-card");
      cards.forEach((c) => expect(c.textContent).toBe("—"));
    });
  });

  describe("recent contacts (sorted by created_at, limited to 5)", () => {
    it("sorts contacts by created_at descending", () => {
      useContacts.mockReturnValue(
        makeContactsQ({
          data: [
            contact({ id: "old", name: "Old Contact", created_at: "2026-01-01T00:00:00Z" }),
            contact({ id: "new", name: "New Contact", created_at: "2026-06-01T00:00:00Z" }),
            contact({ id: "mid", name: "Mid Contact", created_at: "2026-03-01T00:00:00Z" }),
          ],
        }),
      );
      render(<DashboardPage />);
      const rows = screen.getAllByTestId("recent-row");
      expect(rows[0]).toHaveTextContent("New Contact");
      expect(rows[1]).toHaveTextContent("Mid Contact");
      expect(rows[2]).toHaveTextContent("Old Contact");
    });

    it("limits the recent list to 5 entries", () => {
      const sixContacts = Array.from({ length: 6 }, (_, i) =>
        contact({
          id: `c${i}`,
          name: `Contact ${i}`,
          created_at: `2026-01-0${i + 1}T00:00:00Z`,
        }),
      );
      useContacts.mockReturnValue(makeContactsQ({ data: sixContacts }));
      render(<DashboardPage />);
      expect(screen.getAllByTestId("recent-row")).toHaveLength(5);
    });

    it("shows empty text when there are no contacts", () => {
      useContacts.mockReturnValue(makeContactsQ({ data: [] }));
      render(<DashboardPage />);
      expect(screen.getByTestId("table-empty")).toHaveTextContent(
        "No contacts yet — add one from the Contacts page.",
      );
    });

    it("does not mutate the original contacts array when sorting", () => {
      const original = [
        contact({ id: "b", name: "B", created_at: "2026-02-01T00:00:00Z" }),
        contact({ id: "a", name: "A", created_at: "2026-01-01T00:00:00Z" }),
      ];
      useContacts.mockReturnValue(makeContactsQ({ data: original }));
      render(<DashboardPage />);
      // original[0] should still be "b" (sort uses spread copy)
      expect(original[0].id).toBe("b");
    });
  });

  describe("error state", () => {
    it("renders the error state when contacts query errors", () => {
      useContacts.mockReturnValue(makeContactsQ({ isError: true }));
      render(<DashboardPage />);
      expect(screen.getByTestId("error-state")).toBeInTheDocument();
      expect(screen.getByText("Failed to load the dashboard.")).toBeInTheDocument();
    });

    it("calls refetch on retry", () => {
      const refetch = vi.fn();
      useContacts.mockReturnValue(makeContactsQ({ isError: true, refetch }));
      render(<DashboardPage />);
      const btn = screen.getByRole("button", { name: /retry/i });
      btn.click();
      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });
});