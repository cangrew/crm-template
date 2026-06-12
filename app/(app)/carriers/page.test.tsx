import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockRefetch = vi.fn();
let carriersData: unknown[] | undefined = undefined;
let carriersIsLoading = false;
let carriersIsError = false;
let profileData: { role: string | null } | undefined = undefined;

vi.mock("@/lib/data/hooks", () => ({
  useCarriers: () => ({
    data: carriersData,
    isLoading: carriersIsLoading,
    isError: carriersIsError,
    refetch: mockRefetch,
  }),
  useCurrentProfile: () => ({ data: profileData }),
}));

vi.mock("@/lib/auth/roles", () => ({
  can: (role: string, action: string) => {
    if (role === "admin") return true;
    if (role === "manager" && (action === "create" || action === "update")) return true;
    return false;
  },
}));

// Stub heavy UI sub-components so we focus on the page logic
vi.mock("@/components/carriers/carriers-table", () => ({
  CarriersTable: ({ rows }: { rows: unknown[] }) => (
    <div data-testid="carriers-table">
      {(rows as Array<{ name: string }>).map((r) => (
        <div key={r.name}>{r.name}</div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/carriers/new-carrier-modal", () => ({
  NewCarrierModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">New Carrier Modal</div> : null,
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
import CarriersPage from "./page";

function makeCarrier(
  overrides: Partial<{
    id: string;
    name: string;
    notes: string | null;
    status: "active" | "inactive";
    created_at: string;
  }> = {},
) {
  return {
    id: "k1",
    name: "Ambetter Health",
    notes: null,
    status: "active" as const,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  carriersData = undefined;
  carriersIsLoading = false;
  carriersIsError = false;
  profileData = { role: "admin" };
});

describe("CarriersPage", () => {
  it("renders the page title", () => {
    carriersData = [];
    render(<CarriersPage />);
    expect(screen.getByRole("heading", { name: "Carriers" })).toBeInTheDocument();
  });

  it("shows loading skeleton while carriers load", () => {
    carriersIsLoading = true;
    render(<CarriersPage />);
    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
  });

  it("shows empty state with 'No carriers yet' when there are no carriers", () => {
    carriersData = [];
    render(<CarriersPage />);
    expect(screen.getByRole("heading", { name: "No carriers yet" })).toBeInTheDocument();
  });

  it("shows the error state and refetch button on error", () => {
    carriersIsError = true;
    render(<CarriersPage />);
    expect(screen.getByText("Failed to fetch carriers.")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: "Retry" });
    retryBtn.click();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders the carriers table when carriers are loaded", () => {
    carriersData = [makeCarrier()];
    render(<CarriersPage />);
    expect(screen.getByTestId("carriers-table")).toBeInTheDocument();
  });

  it("shows New Carrier button for admin and manager", () => {
    carriersData = [];
    profileData = { role: "admin" };
    const { unmount } = render(<CarriersPage />);
    expect(screen.getByRole("button", { name: "New Carrier" })).toBeInTheDocument();
    unmount();

    profileData = { role: "manager" };
    render(<CarriersPage />);
    expect(screen.getByRole("button", { name: "New Carrier" })).toBeInTheDocument();
  });

  it("hides New Carrier button for tenant or null roles", () => {
    carriersData = [];
    profileData = { role: "agent" };
    const { unmount } = render(<CarriersPage />);
    expect(screen.queryByRole("button", { name: "New Carrier" })).not.toBeInTheDocument();
    unmount();

    profileData = { role: null };
    render(<CarriersPage />);
    expect(screen.queryByRole("button", { name: "New Carrier" })).not.toBeInTheDocument();
  });

  it("opens the new carrier modal when the button is clicked", async () => {
    carriersData = [];
    profileData = { role: "admin" };
    render(<CarriersPage />);

    await userEvent.click(screen.getByRole("button", { name: "New Carrier" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows subtitle with correct total and active counts", () => {
    carriersData = [
      makeCarrier({ id: "1", name: "Ambetter Health", status: "active" }),
      makeCarrier({ id: "2", name: "Oscar Health", status: "active" }),
      makeCarrier({ id: "3", name: "Molina Healthcare", status: "inactive" }),
    ];
    render(<CarriersPage />);
    expect(screen.getByText("3 total · 2 active")).toBeInTheDocument();
  });

  it("filters carriers by name search (case-insensitive)", async () => {
    carriersData = [
      makeCarrier({ id: "1", name: "Ambetter Health" }),
      makeCarrier({ id: "2", name: "Oscar Health" }),
    ];
    render(<CarriersPage />);

    await userEvent.type(screen.getByPlaceholderText("Search carriers…"), "OSCAR");

    expect(screen.getByText("Oscar Health")).toBeInTheDocument();
    expect(screen.queryByText("Ambetter Health")).not.toBeInTheDocument();
  });

  it("shows the filtered empty state when the search excludes everything", async () => {
    carriersData = [makeCarrier()];
    render(<CarriersPage />);

    await userEvent.type(screen.getByPlaceholderText("Search carriers…"), "zzz");

    expect(
      screen.getByRole("heading", { name: "No carriers match this search" }),
    ).toBeInTheDocument();
  });
});
