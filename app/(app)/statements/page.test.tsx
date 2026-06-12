import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockRefetch = vi.fn();
let statementsData: unknown[] | undefined = undefined;
let statementsIsLoading = false;
let statementsIsError = false;
let carriersData: unknown[] | undefined = undefined;
let profileData: { role: string | null } | undefined = undefined;

vi.mock("@/lib/data/hooks", () => ({
  useStatements: () => ({
    data: statementsData,
    isLoading: statementsIsLoading,
    isError: statementsIsError,
    refetch: mockRefetch,
  }),
  useCarriers: () => ({ data: carriersData }),
  useCurrentProfile: () => ({ data: profileData }),
}));

vi.mock("@/lib/auth/roles", () => ({
  can: (role: string) => role === "admin" || role === "manager",
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
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
  Btn: ({ children }: { children: React.ReactNode; variant?: string; icon?: React.ReactNode }) => (
    <button>{children}</button>
  ),
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

vi.mock("@/components/ui/badges", () => ({
  StatementBadge: ({ status }: { status: string }) => <span>{status}</span>,
}));

import React from "react";
import StatementsPage from "./page";

function makeStatement(
  overrides: Partial<{
    id: string;
    carrier_id: string;
    period_month: string;
    status: string;
    line_count: number;
    total_amount_cents: number;
  }> = {},
) {
  return {
    id: "st-1",
    carrier_id: "k1",
    period_month: "2026-05-01",
    status: "draft",
    line_count: 12,
    total_amount_cents: 123456,
    storage_path: null,
    uploaded_by: null,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

const CARRIERS = [
  { id: "k1", name: "Ambetter Health", status: "active" },
  { id: "k2", name: "Oscar Health", status: "active" },
];

beforeEach(() => {
  vi.clearAllMocks();
  statementsData = undefined;
  statementsIsLoading = false;
  statementsIsError = false;
  carriersData = CARRIERS;
  profileData = { role: "admin" };
});

describe("StatementsPage", () => {
  it("renders the page title and imported count", () => {
    statementsData = [makeStatement()];
    render(<StatementsPage />);
    expect(screen.getByRole("heading", { name: "Statements" })).toBeInTheDocument();
    expect(screen.getByText("1 imported")).toBeInTheDocument();
  });

  it("shows loading skeleton while statements load", () => {
    statementsIsLoading = true;
    render(<StatementsPage />);
    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
  });

  it("shows the empty state when nothing has been imported", () => {
    statementsData = [];
    render(<StatementsPage />);
    expect(screen.getByRole("heading", { name: "No statements imported yet" })).toBeInTheDocument();
  });

  it("shows the error state and refetches on retry", () => {
    statementsIsError = true;
    render(<StatementsPage />);
    expect(screen.getByText("Failed to fetch statements.")).toBeInTheDocument();

    screen.getByRole("button", { name: "Retry" }).click();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders period, carrier, line count, total, and status for each row", () => {
    statementsData = [makeStatement()];
    render(<StatementsPage />);
    expect(screen.getByText("May 2026")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Ambetter Health" })).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("$1,234.56")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
  });

  it("links each row to the statement detail page", () => {
    statementsData = [makeStatement({ id: "st-9" })];
    render(<StatementsPage />);
    expect(screen.getByRole("link", { name: /May 2026/ })).toHaveAttribute(
      "href",
      "/statements/st-9",
    );
  });

  it("shows the Import statement button for staff roles only", () => {
    statementsData = [];
    profileData = { role: "manager" };
    const { unmount } = render(<StatementsPage />);
    expect(screen.getByRole("button", { name: "Import statement" })).toBeInTheDocument();
    unmount();

    profileData = { role: "agent" };
    render(<StatementsPage />);
    expect(screen.queryByRole("button", { name: "Import statement" })).not.toBeInTheDocument();
  });

  it("hides the Import statement button for a null role", () => {
    statementsData = [];
    profileData = { role: null };
    render(<StatementsPage />);
    expect(screen.queryByRole("button", { name: "Import statement" })).not.toBeInTheDocument();
  });

  it("links the Import statement button to /statements/new", () => {
    statementsData = [];
    render(<StatementsPage />);
    const link = screen.getByRole("button", { name: "Import statement" }).closest("a");
    expect(link).toHaveAttribute("href", "/statements/new");
  });

  it("filters by carrier", async () => {
    statementsData = [
      makeStatement({ id: "st-1", carrier_id: "k1", period_month: "2026-05-01" }),
      makeStatement({ id: "st-2", carrier_id: "k2", period_month: "2026-04-01" }),
    ];
    render(<StatementsPage />);

    await userEvent.selectOptions(screen.getByDisplayValue("All carriers"), "k2");

    expect(screen.getByText("April 2026")).toBeInTheDocument();
    expect(screen.queryByText("May 2026")).not.toBeInTheDocument();
  });

  it("filters by status", async () => {
    statementsData = [
      makeStatement({ id: "st-1", status: "draft", period_month: "2026-05-01" }),
      makeStatement({ id: "st-2", status: "posted", period_month: "2026-04-01" }),
    ];
    render(<StatementsPage />);

    await userEvent.selectOptions(screen.getByDisplayValue("All statuses"), "posted");

    expect(screen.getByText("April 2026")).toBeInTheDocument();
    expect(screen.queryByText("May 2026")).not.toBeInTheDocument();
  });

  it("shows the filtered empty state when filters exclude everything", async () => {
    statementsData = [makeStatement({ status: "draft" })];
    render(<StatementsPage />);

    await userEvent.selectOptions(screen.getByDisplayValue("All statuses"), "void");

    expect(
      screen.getByRole("heading", { name: "No statements match these filters" }),
    ).toBeInTheDocument();
  });
});
