import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockRefetch = vi.fn();
let policiesData: unknown[] | undefined = undefined;
let policiesIsLoading = false;
let policiesIsError = false;
let profileData: { role: string | null } | undefined = undefined;

vi.mock("@/lib/data/hooks", () => ({
  usePolicies: () => ({
    data: policiesData,
    isLoading: policiesIsLoading,
    isError: policiesIsError,
    refetch: mockRefetch,
  }),
  useClients: () => ({ data: [{ id: "c1", first_name: "Maria", last_name: "Alvarez" }] }),
  useCarriers: () => ({ data: [{ id: "k1", name: "Ambetter Health", status: "active" }] }),
  useAgents: () => ({ data: [{ id: "a1", full_name: "Casey Agent", status: "active" }] }),
  useCurrentProfile: () => ({ data: profileData }),
}));

vi.mock("@/lib/auth/roles", () => ({
  can: (role: string, action: string) => {
    if (role === "admin") return true;
    if (role === "manager" && (action === "create" || action === "update")) return true;
    if ((role === "agent" || role === "agency_owner") && action === "read") return true;
    return false;
  },
}));

// Stub heavy UI sub-components so we focus on the page logic
vi.mock("@/components/policies/policies-filter-bar", () => ({
  PoliciesFilterBar: ({
    onQ,
    onStatus,
    onCarrierId,
  }: {
    onQ: (v: string) => void;
    onStatus: (v: string) => void;
    onCarrierId: (v: string) => void;
  }) => (
    <div>
      <input aria-label="search" onChange={(e) => onQ(e.target.value)} />
      <select aria-label="status" onChange={(e) => onStatus(e.target.value)}>
        <option value="">All</option>
        <option value="active">Active</option>
        <option value="lapsed">Lapsed</option>
      </select>
      <select aria-label="carrier" onChange={(e) => onCarrierId(e.target.value)}>
        <option value="">All carriers</option>
        <option value="k1">Ambetter Health</option>
        <option value="k2">Oscar Health</option>
      </select>
    </div>
  ),
}));

vi.mock("@/components/policies/policies-table", () => ({
  PoliciesTable: ({ rows }: { rows: unknown[] }) => (
    <div data-testid="policies-table">
      {(rows as Array<{ id: string; policy_number: string | null }>).map((r) => (
        <div key={r.id}>{r.policy_number ?? r.id}</div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/policies/new-policy-modal", () => ({
  NewPolicyModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">New Policy Modal</div> : null,
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
import PoliciesPage from "./page";

function makePolicy(
  overrides: Partial<{
    id: string;
    policy_number: string | null;
    plan_name: string | null;
    carrier_member_id: string | null;
    client_id: string;
    carrier_id: string;
    agent_id: string;
    status: string;
    member_count: number;
    monthly_premium_cents: number | null;
    created_at: string;
  }> = {},
) {
  return {
    id: "p1",
    policy_number: "AMB-1001",
    plan_name: "Ambetter Balanced Care 11",
    carrier_member_id: "M-555",
    client_id: "c1",
    carrier_id: "k1",
    agent_id: "a1",
    status: "active",
    member_count: 2,
    monthly_premium_cents: 78000,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  policiesData = undefined;
  policiesIsLoading = false;
  policiesIsError = false;
  profileData = { role: "admin" };
});

describe("PoliciesPage", () => {
  it("renders the page title", () => {
    policiesData = [];
    render(<PoliciesPage />);
    expect(screen.getByRole("heading", { name: "Policies" })).toBeInTheDocument();
  });

  it("shows loading skeleton while policies load", () => {
    policiesIsLoading = true;
    render(<PoliciesPage />);
    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
  });

  it("shows empty state with 'No policies yet' when there are no policies", () => {
    policiesData = [];
    render(<PoliciesPage />);
    expect(screen.getByRole("heading", { name: "No policies yet" })).toBeInTheDocument();
  });

  it("shows the error state and refetch button on error", () => {
    policiesIsError = true;
    render(<PoliciesPage />);
    expect(screen.getByText("Failed to fetch policies.")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: "Retry" });
    retryBtn.click();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders the policies table when policies are loaded", () => {
    policiesData = [makePolicy()];
    render(<PoliciesPage />);
    expect(screen.getByTestId("policies-table")).toBeInTheDocument();
  });

  it("shows New Policy button for admin and manager", () => {
    policiesData = [];
    profileData = { role: "admin" };
    const { unmount } = render(<PoliciesPage />);
    expect(screen.getByRole("button", { name: "New Policy" })).toBeInTheDocument();
    unmount();

    profileData = { role: "manager" };
    render(<PoliciesPage />);
    expect(screen.getByRole("button", { name: "New Policy" })).toBeInTheDocument();
  });

  it("hides New Policy button for tenant or null roles", () => {
    policiesData = [];
    profileData = { role: "agent" };
    const { unmount } = render(<PoliciesPage />);
    expect(screen.queryByRole("button", { name: "New Policy" })).not.toBeInTheDocument();
    unmount();

    profileData = { role: null };
    render(<PoliciesPage />);
    expect(screen.queryByRole("button", { name: "New Policy" })).not.toBeInTheDocument();
  });

  it("opens the new policy modal when the button is clicked", async () => {
    policiesData = [];
    profileData = { role: "admin" };
    render(<PoliciesPage />);

    await userEvent.click(screen.getByRole("button", { name: "New Policy" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows subtitle with correct total and active counts", () => {
    policiesData = [
      makePolicy({ id: "1", status: "active" }),
      makePolicy({ id: "2", policy_number: "OSC-2001", status: "lapsed" }),
      makePolicy({ id: "3", policy_number: "AMB-1003", status: "active" }),
    ];
    render(<PoliciesPage />);
    expect(screen.getByText("3 total · 2 active")).toBeInTheDocument();
  });

  it("filters policies by policy number search (case-insensitive)", async () => {
    policiesData = [
      makePolicy({ id: "1", policy_number: "AMB-1001" }),
      makePolicy({ id: "2", policy_number: "OSC-2001", plan_name: null, carrier_member_id: null }),
    ];
    render(<PoliciesPage />);

    await userEvent.type(screen.getByLabelText("search"), "amb-1001");

    expect(screen.getByText("AMB-1001")).toBeInTheDocument();
    expect(screen.queryByText("OSC-2001")).not.toBeInTheDocument();
  });

  it("filters policies by plan name and carrier member id", async () => {
    policiesData = [
      makePolicy({ id: "1", policy_number: "AMB-1001", carrier_member_id: "M-111" }),
      makePolicy({
        id: "2",
        policy_number: "OSC-2001",
        plan_name: "Oscar Bronze Classic",
        carrier_member_id: "M-222",
      }),
    ];
    render(<PoliciesPage />);

    await userEvent.type(screen.getByLabelText("search"), "bronze");
    expect(screen.getByText("OSC-2001")).toBeInTheDocument();
    expect(screen.queryByText("AMB-1001")).not.toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("search"));
    await userEvent.type(screen.getByLabelText("search"), "M-111");
    expect(screen.getByText("AMB-1001")).toBeInTheDocument();
    expect(screen.queryByText("OSC-2001")).not.toBeInTheDocument();
  });

  it("filters policies by status", async () => {
    policiesData = [
      makePolicy({ id: "1", policy_number: "AMB-1001", status: "active" }),
      makePolicy({ id: "2", policy_number: "OSC-2001", status: "lapsed" }),
    ];
    render(<PoliciesPage />);

    await userEvent.selectOptions(screen.getByLabelText("status"), "lapsed");

    expect(screen.getByText("OSC-2001")).toBeInTheDocument();
    expect(screen.queryByText("AMB-1001")).not.toBeInTheDocument();
  });

  it("filters policies by carrier", async () => {
    policiesData = [
      makePolicy({ id: "1", policy_number: "AMB-1001", carrier_id: "k1" }),
      makePolicy({ id: "2", policy_number: "OSC-2001", carrier_id: "k2" }),
    ];
    render(<PoliciesPage />);

    await userEvent.selectOptions(screen.getByLabelText("carrier"), "k2");

    expect(screen.getByText("OSC-2001")).toBeInTheDocument();
    expect(screen.queryByText("AMB-1001")).not.toBeInTheDocument();
  });

  it("shows 'No policies match these filters' when filters exclude all results", async () => {
    policiesData = [makePolicy({ status: "active" })];
    render(<PoliciesPage />);

    await userEvent.selectOptions(screen.getByLabelText("status"), "lapsed");

    expect(
      screen.getByRole("heading", { name: "No policies match these filters" }),
    ).toBeInTheDocument();
  });
});
