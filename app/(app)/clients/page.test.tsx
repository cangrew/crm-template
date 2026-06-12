import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockRefetch = vi.fn();
let clientsData: unknown[] | undefined = undefined;
let clientsIsLoading = false;
let clientsIsError = false;
let profileData: { role: string | null } | undefined = undefined;

vi.mock("@/lib/data/hooks", () => ({
  useClients: () => ({
    data: clientsData,
    isLoading: clientsIsLoading,
    isError: clientsIsError,
    refetch: mockRefetch,
  }),
  useAgents: () => ({ data: [{ id: "a1", full_name: "Casey Agent" }] }),
  useCurrentProfile: () => ({ data: profileData }),
}));

vi.mock("@/lib/auth/roles", () => ({
  can: (role: string, action: string) => {
    // Admin can do everything; agent can only read
    if (role === "admin") return true;
    if (role === "agent" && action === "read") return true;
    if (role === "agent") return false;
    if (role === "manager" && (action === "create" || action === "update")) return true;
    return false;
  },
}));

// Stub heavy UI sub-components so we focus on the page logic
vi.mock("@/components/clients/clients-filter-bar", () => ({
  ClientsFilterBar: ({
    onQ,
    onStatus,
  }: {
    onQ: (v: string) => void;
    onStatus: (v: string) => void;
  }) => (
    <div>
      <input aria-label="search" onChange={(e) => onQ(e.target.value)} />
      <select aria-label="status" onChange={(e) => onStatus(e.target.value)}>
        <option value="">All</option>
        <option value="active">Active</option>
        <option value="prospect">Prospect</option>
      </select>
    </div>
  ),
}));

vi.mock("@/components/clients/clients-table", () => ({
  ClientsTable: ({ rows }: { rows: unknown[] }) => (
    <div data-testid="clients-table">
      {(rows as Array<{ first_name: string; last_name: string }>).map((r) => (
        <div key={`${r.first_name} ${r.last_name}`}>{`${r.first_name} ${r.last_name}`}</div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/clients/new-client-modal", () => ({
  NewClientModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">New Client Modal</div> : null,
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
  EmptyState: ({ title, body }: { icon?: unknown; title: string; body: string }) => (
    <div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  ),
  TableSkeleton: () => <tr data-testid="table-skeleton" />,
}));

vi.mock("@/components/ui/table", () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
}));

import React from "react";
import ClientsPage from "./page";

function makeClient(
  overrides: Partial<{
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    agent_id: string | null;
    status: "prospect" | "active" | "inactive";
    created_at: string;
  }> = {},
) {
  return {
    id: "c1",
    first_name: "Alice",
    last_name: "Smith",
    email: "alice@acme.com",
    phone: "+1 555 0100",
    agent_id: "a1",
    status: "active" as const,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  clientsData = undefined;
  clientsIsLoading = false;
  clientsIsError = false;
  profileData = { role: "admin" };
});

describe("ClientsPage", () => {
  it("renders the page title", () => {
    clientsData = [];
    render(<ClientsPage />);
    expect(screen.getByRole("heading", { name: "Clients" })).toBeInTheDocument();
  });

  it("shows loading skeleton when clients are loading", () => {
    clientsIsLoading = true;
    render(<ClientsPage />);
    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
  });

  it("shows empty state with 'No clients yet' when there are no clients", () => {
    clientsData = [];
    render(<ClientsPage />);
    expect(screen.getByRole("heading", { name: "No clients yet" })).toBeInTheDocument();
  });

  it("shows the error state and refetch button on error", () => {
    clientsIsError = true;
    render(<ClientsPage />);
    expect(screen.getByText("Failed to fetch clients.")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: "Retry" });
    retryBtn.click();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders clients table when clients are loaded", () => {
    clientsData = [makeClient()];
    render(<ClientsPage />);
    expect(screen.getByTestId("clients-table")).toBeInTheDocument();
  });

  it("shows New Client button for admin", () => {
    clientsData = [];
    profileData = { role: "admin" };
    render(<ClientsPage />);
    expect(screen.getByRole("button", { name: "New Client" })).toBeInTheDocument();
  });

  it("shows New Client button for manager (can create)", () => {
    clientsData = [];
    profileData = { role: "manager" };
    render(<ClientsPage />);
    expect(screen.getByRole("button", { name: "New Client" })).toBeInTheDocument();
  });

  it("hides New Client button for agent (cannot create)", () => {
    clientsData = [];
    profileData = { role: "agent" };
    render(<ClientsPage />);
    expect(screen.queryByRole("button", { name: "New Client" })).not.toBeInTheDocument();
  });

  it("hides New Client button when profile role is null", () => {
    clientsData = [];
    profileData = { role: null };
    render(<ClientsPage />);
    expect(screen.queryByRole("button", { name: "New Client" })).not.toBeInTheDocument();
  });

  it("opens the new client modal when the button is clicked", async () => {
    clientsData = [];
    profileData = { role: "admin" };
    render(<ClientsPage />);

    await userEvent.click(screen.getByRole("button", { name: "New Client" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows subtitle with correct total and active counts", () => {
    clientsData = [
      makeClient({ id: "1", first_name: "Alice", status: "active" }),
      makeClient({ id: "2", first_name: "Bob", last_name: "Jones", status: "prospect" }),
      makeClient({ id: "3", first_name: "Carol", last_name: "Reed", status: "active" }),
    ];
    render(<ClientsPage />);
    expect(screen.getByText("3 total · 2 active")).toBeInTheDocument();
  });

  it("filters clients by name search", async () => {
    clientsData = [
      makeClient({ id: "1", first_name: "Alice", last_name: "Smith" }),
      makeClient({
        id: "2",
        first_name: "Bob",
        last_name: "Jones",
        email: "bob@other.com",
        phone: "+1 555 0200",
      }),
    ];
    render(<ClientsPage />);

    await userEvent.type(screen.getByLabelText("search"), "alice");

    expect(screen.getByTestId("clients-table")).toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
  });

  it("filters clients by email", async () => {
    clientsData = [
      makeClient({ id: "1", first_name: "Alice", email: "alice@acme.com" }),
      makeClient({
        id: "2",
        first_name: "Bob",
        last_name: "Jones",
        email: "bob@other.com",
        phone: "+1 555 0200",
      }),
    ];
    render(<ClientsPage />);

    await userEvent.type(screen.getByLabelText("search"), "acme.com");

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
  });

  it("filters clients by phone", async () => {
    clientsData = [
      makeClient({ id: "1", first_name: "Alice", phone: "+1 555 0101" }),
      makeClient({
        id: "2",
        first_name: "Bob",
        last_name: "Jones",
        email: "bob@other.com",
        phone: "+1 555 0202",
      }),
    ];
    render(<ClientsPage />);

    await userEvent.type(screen.getByLabelText("search"), "0202");

    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  it("filters clients by status", async () => {
    clientsData = [
      makeClient({ id: "1", first_name: "Alice", status: "active" }),
      makeClient({ id: "2", first_name: "Bob", last_name: "Jones", status: "prospect" }),
    ];
    render(<ClientsPage />);

    await userEvent.selectOptions(screen.getByLabelText("status"), "active");

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
  });

  it("shows 'No clients match these filters' empty state when filters exclude all results", async () => {
    clientsData = [makeClient({ status: "active" })];
    render(<ClientsPage />);

    await userEvent.selectOptions(screen.getByLabelText("status"), "prospect");

    expect(
      screen.getByRole("heading", { name: "No clients match these filters" }),
    ).toBeInTheDocument();
  });

  it("search is case-insensitive", async () => {
    clientsData = [makeClient({ first_name: "Alice", last_name: "Smith" })];
    render(<ClientsPage />);

    await userEvent.type(screen.getByLabelText("search"), "ALICE");

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });
});
