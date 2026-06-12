import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockRefetch = vi.fn();
let clientsData: unknown[] | undefined = undefined;
let clientsIsLoading = false;
let clientsIsError = false;
let profileData:
  | {
      full_name: string | null;
      email: string | null;
      role: string | null;
    }
  | undefined = undefined;

vi.mock("@/lib/data/hooks", () => ({
  useClients: () => ({
    data: clientsData,
    isLoading: clientsIsLoading,
    isError: clientsIsError,
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
        (rows as Array<{ id: string; first_name: string; last_name: string }>).map((r) => (
          <div key={r.id}>{`${r.first_name} ${r.last_name}`}</div>
        ))
      )}
    </div>
  ),
}));

vi.mock("@/components/ui/badges", () => ({
  ClientBadge: ({ status }: { status: string }) => <span>{status}</span>,
}));

import DashboardPage from "./page";

function makeClient(
  overrides: Partial<{
    id: string;
    first_name: string;
    last_name: string;
    status: "prospect" | "active" | "inactive";
    created_at: string;
  }> = {},
) {
  return {
    id: "c1",
    first_name: "Alice",
    last_name: "Smith",
    status: "active" as const,
    created_at: "2026-01-01T00:00:00Z",
    dob: null,
    email: null,
    phone: null,
    address: null,
    agent_id: null,
    notes: null,
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  clientsData = undefined;
  clientsIsLoading = false;
  clientsIsError = false;
  profileData = undefined;
});

describe("DashboardPage", () => {
  it("shows error state when clients fail to load", () => {
    clientsIsError = true;
    render(<DashboardPage />);
    expect(screen.getByText("Failed to load the dashboard.")).toBeInTheDocument();
  });

  it("calls refetch when Retry is clicked in error state", () => {
    clientsIsError = true;
    render(<DashboardPage />);
    screen.getByRole("button", { name: "Retry" }).click();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("shows '—' in stat cards while clients are loading", () => {
    clientsIsLoading = true;
    clientsData = undefined;
    render(<DashboardPage />);
    const statValues = screen.getAllByTestId("stat-value");
    // All four stat values should be '—' while loading
    expect(statValues.every((el) => el.textContent === "—")).toBe(true);
  });

  it("renders the stat grid", () => {
    clientsData = [];
    render(<DashboardPage />);
    expect(screen.getByTestId("stat-grid")).toBeInTheDocument();
  });

  it("shows total clients count", () => {
    clientsData = [makeClient({ id: "1" }), makeClient({ id: "2" }), makeClient({ id: "3" })];
    render(<DashboardPage />);
    const totalStat = screen.getByTestId("stat-total-clients");
    expect(totalStat).toHaveTextContent("3");
  });

  it("counts active clients correctly", () => {
    clientsData = [
      makeClient({ id: "1", status: "active" }),
      makeClient({ id: "2", status: "prospect" }),
      makeClient({ id: "3", status: "active" }),
    ];
    render(<DashboardPage />);
    const activeStat = screen.getByTestId("stat-active");
    expect(activeStat).toHaveTextContent("2");
  });

  it("counts prospect clients correctly", () => {
    clientsData = [
      makeClient({ id: "1", status: "prospect" }),
      makeClient({ id: "2", status: "active" }),
    ];
    render(<DashboardPage />);
    const prospectsStat = screen.getByTestId("stat-prospects");
    expect(prospectsStat).toHaveTextContent("1");
  });

  it("counts inactive clients correctly", () => {
    clientsData = [
      makeClient({ id: "1", status: "inactive" }),
      makeClient({ id: "2", status: "inactive" }),
      makeClient({ id: "3", status: "active" }),
    ];
    render(<DashboardPage />);
    const inactiveStat = screen.getByTestId("stat-inactive");
    expect(inactiveStat).toHaveTextContent("2");
  });

  it("renders the recent clients entity table", () => {
    clientsData = [];
    render(<DashboardPage />);
    expect(screen.getByTestId("entity-table")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent clients" })).toBeInTheDocument();
  });

  it("shows empty text when there are no clients", () => {
    clientsData = [];
    render(<DashboardPage />);
    expect(screen.getByText("No clients yet — add one from the Clients page.")).toBeInTheDocument();
  });

  it("limits recent clients to 5", () => {
    clientsData = Array.from({ length: 8 }, (_, i) =>
      makeClient({
        id: `c${i}`,
        first_name: "Client",
        last_name: `${i}`,
        created_at: `2026-01-0${i + 1}T00:00:00Z`,
      }),
    );
    render(<DashboardPage />);
    // The entity table stub renders one div per row with the client name
    const clientRows = screen.getAllByText(/Client \d/);
    expect(clientRows).toHaveLength(5);
  });

  it("sorts recent clients by created_at descending (newest first)", () => {
    clientsData = [
      makeClient({
        id: "old",
        first_name: "Old",
        last_name: "Client",
        created_at: "2026-01-01T00:00:00Z",
      }),
      makeClient({
        id: "new",
        first_name: "New",
        last_name: "Client",
        created_at: "2026-06-01T00:00:00Z",
      }),
    ];
    render(<DashboardPage />);
    const clientNames = screen.getAllByText(/Client/).map((el) => el.textContent);
    expect(clientNames[0]).toBe("New Client");
    expect(clientNames[1]).toBe("Old Client");
  });

  it("greets the user by first name when full_name is available", () => {
    profileData = { full_name: "Jane Doe", email: "jane@example.com", role: "admin" };
    clientsData = [];
    render(<DashboardPage />);
    expect(screen.getByRole("heading", { name: "Welcome back, Jane" })).toBeInTheDocument();
  });

  it("greets by email when full_name is absent", () => {
    profileData = { full_name: null, email: "jane@example.com", role: "admin" };
    clientsData = [];
    render(<DashboardPage />);
    expect(
      screen.getByRole("heading", { name: "Welcome back, jane@example.com" }),
    ).toBeInTheDocument();
  });

  it("falls back to 'there' when neither name nor email is available", () => {
    profileData = undefined;
    clientsData = [];
    render(<DashboardPage />);
    expect(screen.getByRole("heading", { name: "Welcome back, there" })).toBeInTheDocument();
  });

  it("shows role label in subtitle when role is set", () => {
    profileData = { full_name: "Jane", email: "jane@example.com", role: "admin" };
    clientsData = [];
    render(<DashboardPage />);
    expect(screen.getByText("Signed in as Admin")).toBeInTheDocument();
  });

  it("shows generic subtitle when role is null", () => {
    profileData = { full_name: "Jane", email: "jane@example.com", role: null };
    clientsData = [];
    render(<DashboardPage />);
    expect(screen.getByText("Here's where things stand")).toBeInTheDocument();
  });
});
