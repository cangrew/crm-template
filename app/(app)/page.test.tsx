import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockRefetch = vi.fn();
let contactsData: unknown[] | undefined = undefined;
let contactsIsLoading = false;
let contactsIsError = false;
let profileData:
  | {
      full_name: string | null;
      email: string | null;
      role: string | null;
    }
  | undefined = undefined;

vi.mock("@/lib/data/hooks", () => ({
  useContacts: () => ({
    data: contactsData,
    isLoading: contactsIsLoading,
    isError: contactsIsError,
    refetch: mockRefetch,
  }),
  useCurrentProfile: () => ({ data: profileData }),
}));

vi.mock("@/lib/domain/enums", () => ({
  APP_ROLE_LABELS: {
    admin: "Admin",
    manager: "Manager",
    agent: "Agent",
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/common/page-header", () => ({
  PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  ),
}));

vi.mock("@/components/common/page-states", () => ({
  PageErrorState: ({ body, onRetry }: { body: string; onRetry: () => void }) => (
    <div>
      <p>{body}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

vi.mock("@/components/common/stat-card", () => ({
  StatGrid: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stat-grid">{children}</div>
  ),
  StatCard: ({ label, value }: { label: string; value: string | number }) => (
    <div data-testid={`stat-${label.toLowerCase().replace(/ /g, "-")}`}>
      <span>{label}</span>
      <span data-testid="stat-value">{value}</span>
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
    rows: unknown[];
    emptyText?: string;
    columns?: unknown[];
    clickableRows?: boolean;
  }) => (
    <div data-testid="entity-table">
      <h2>{title}</h2>
      {rows.length === 0 && emptyText ? (
        <p>{emptyText}</p>
      ) : (
        (rows as Array<{ id: string; name: string }>).map((r) => <div key={r.id}>{r.name}</div>)
      )}
    </div>
  ),
}));

vi.mock("@/components/ui/badges", () => ({
  ContactBadge: ({ status }: { status: string }) => <span>{status}</span>,
}));

import DashboardPage from "./page";

function makeContact(
  overrides: Partial<{
    id: string;
    name: string;
    company: string | null;
    status: "lead" | "active" | "at_risk" | "closed";
    created_at: string;
  }> = {},
) {
  return {
    id: "c1",
    name: "Alice",
    company: "Acme",
    status: "active" as const,
    created_at: "2026-01-01T00:00:00Z",
    email: null,
    phone: null,
    notes: null,
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  contactsData = undefined;
  contactsIsLoading = false;
  contactsIsError = false;
  profileData = undefined;
});

describe("DashboardPage", () => {
  it("shows error state when contacts fail to load", () => {
    contactsIsError = true;
    render(<DashboardPage />);
    expect(screen.getByText("Failed to load the dashboard.")).toBeInTheDocument();
  });

  it("calls refetch when Retry is clicked in error state", () => {
    contactsIsError = true;
    render(<DashboardPage />);
    screen.getByRole("button", { name: "Retry" }).click();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("shows '—' in stat cards while contacts are loading", () => {
    contactsIsLoading = true;
    contactsData = undefined;
    render(<DashboardPage />);
    const statValues = screen.getAllByTestId("stat-value");
    // All four stat values should be '—' while loading
    expect(statValues.every((el) => el.textContent === "—")).toBe(true);
  });

  it("renders the stat grid", () => {
    contactsData = [];
    render(<DashboardPage />);
    expect(screen.getByTestId("stat-grid")).toBeInTheDocument();
  });

  it("shows total contacts count", () => {
    contactsData = [makeContact({ id: "1" }), makeContact({ id: "2" }), makeContact({ id: "3" })];
    render(<DashboardPage />);
    const totalStat = screen.getByTestId("stat-total-contacts");
    expect(totalStat).toHaveTextContent("3");
  });

  it("counts active contacts correctly", () => {
    contactsData = [
      makeContact({ id: "1", status: "active" }),
      makeContact({ id: "2", status: "lead" }),
      makeContact({ id: "3", status: "active" }),
    ];
    render(<DashboardPage />);
    const activeStat = screen.getByTestId("stat-active");
    expect(activeStat).toHaveTextContent("2");
  });

  it("counts lead contacts correctly", () => {
    contactsData = [
      makeContact({ id: "1", status: "lead" }),
      makeContact({ id: "2", status: "active" }),
    ];
    render(<DashboardPage />);
    const leadsStat = screen.getByTestId("stat-leads");
    expect(leadsStat).toHaveTextContent("1");
  });

  it("counts at_risk contacts correctly", () => {
    contactsData = [
      makeContact({ id: "1", status: "at_risk" }),
      makeContact({ id: "2", status: "at_risk" }),
      makeContact({ id: "3", status: "active" }),
    ];
    render(<DashboardPage />);
    const atRiskStat = screen.getByTestId("stat-at-risk");
    expect(atRiskStat).toHaveTextContent("2");
  });

  it("renders the recent contacts entity table", () => {
    contactsData = [];
    render(<DashboardPage />);
    expect(screen.getByTestId("entity-table")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent contacts" })).toBeInTheDocument();
  });

  it("shows empty text when there are no contacts", () => {
    contactsData = [];
    render(<DashboardPage />);
    expect(
      screen.getByText("No contacts yet — add one from the Contacts page."),
    ).toBeInTheDocument();
  });

  it("limits recent contacts to 5", () => {
    contactsData = Array.from({ length: 8 }, (_, i) =>
      makeContact({
        id: `c${i}`,
        name: `Contact ${i}`,
        created_at: `2026-01-0${i + 1}T00:00:00Z`,
      }),
    );
    render(<DashboardPage />);
    // The entity table stub renders one div per row with the contact name
    const contactRows = screen.getAllByText(/Contact \d/);
    expect(contactRows).toHaveLength(5);
  });

  it("sorts recent contacts by created_at descending (newest first)", () => {
    contactsData = [
      makeContact({ id: "old", name: "Old Contact", created_at: "2026-01-01T00:00:00Z" }),
      makeContact({ id: "new", name: "New Contact", created_at: "2026-06-01T00:00:00Z" }),
    ];
    render(<DashboardPage />);
    const contactNames = screen.getAllByText(/Contact/).map((el) => el.textContent);
    expect(contactNames[0]).toBe("New Contact");
    expect(contactNames[1]).toBe("Old Contact");
  });

  it("greets the user by first name when full_name is available", () => {
    profileData = { full_name: "Jane Doe", email: "jane@example.com", role: "admin" };
    contactsData = [];
    render(<DashboardPage />);
    expect(screen.getByRole("heading", { name: "Welcome back, Jane" })).toBeInTheDocument();
  });

  it("greets by email when full_name is absent", () => {
    profileData = { full_name: null, email: "jane@example.com", role: "admin" };
    contactsData = [];
    render(<DashboardPage />);
    expect(
      screen.getByRole("heading", { name: "Welcome back, jane@example.com" }),
    ).toBeInTheDocument();
  });

  it("falls back to 'there' when neither name nor email is available", () => {
    profileData = undefined;
    contactsData = [];
    render(<DashboardPage />);
    expect(screen.getByRole("heading", { name: "Welcome back, there" })).toBeInTheDocument();
  });

  it("shows role label in subtitle when role is set", () => {
    profileData = { full_name: "Jane", email: "jane@example.com", role: "admin" };
    contactsData = [];
    render(<DashboardPage />);
    expect(screen.getByText("Signed in as Admin")).toBeInTheDocument();
  });

  it("shows generic subtitle when role is null", () => {
    profileData = { full_name: "Jane", email: "jane@example.com", role: null };
    contactsData = [];
    render(<DashboardPage />);
    expect(screen.getByText("Here's where things stand")).toBeInTheDocument();
  });
});
