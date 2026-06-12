import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockRefetch = vi.fn();
let contactsData: unknown[] | undefined = undefined;
let contactsIsLoading = false;
let contactsIsError = false;
let profileData: { role: string | null } | undefined = undefined;

vi.mock("@/lib/data/hooks", () => ({
  useContacts: () => ({
    data: contactsData,
    isLoading: contactsIsLoading,
    isError: contactsIsError,
    refetch: mockRefetch,
  }),
  useCurrentProfile: () => ({ data: profileData }),
}));

vi.mock("@/lib/auth/roles", () => ({
  can: (role: string, action: string) => {
    // Admin can do everything; member can only read
    if (role === "admin") return true;
    if (role === "member" && action === "read") return true;
    if (role === "member") return false;
    if (role === "manager" && (action === "create" || action === "update")) return true;
    return false;
  },
}));

// Stub heavy UI sub-components so we focus on the page logic
vi.mock("@/components/contacts/contacts-filter-bar", () => ({
  ContactsFilterBar: ({
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
        <option value="lead">Lead</option>
      </select>
    </div>
  ),
}));

vi.mock("@/components/contacts/contacts-table", () => ({
  ContactsTable: ({ rows }: { rows: unknown[] }) => (
    <div data-testid="contacts-table">
      {(rows as Array<{ name: string }>).map((r) => (
        <div key={r.name}>{r.name}</div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/contacts/new-contact-modal", () => ({
  NewContactModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">New Contact Modal</div> : null,
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
import ContactsPage from "./page";

function makeContact(
  overrides: Partial<{
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    status: "lead" | "active" | "at_risk" | "closed";
    created_at: string;
  }> = {},
) {
  return {
    id: "c1",
    name: "Alice",
    company: "Acme",
    email: "alice@acme.com",
    status: "active" as const,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  contactsData = undefined;
  contactsIsLoading = false;
  contactsIsError = false;
  profileData = { role: "admin" };
});

describe("ContactsPage", () => {
  it("renders the page title", () => {
    contactsData = [];
    render(<ContactsPage />);
    expect(screen.getByRole("heading", { name: "Contacts" })).toBeInTheDocument();
  });

  it("shows loading skeleton when contacts are loading", () => {
    contactsIsLoading = true;
    render(<ContactsPage />);
    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
  });

  it("shows empty state with 'No contacts yet' when there are no contacts", () => {
    contactsData = [];
    render(<ContactsPage />);
    expect(screen.getByRole("heading", { name: "No contacts yet" })).toBeInTheDocument();
  });

  it("shows the error state and refetch button on error", () => {
    contactsIsError = true;
    render(<ContactsPage />);
    expect(screen.getByText("Failed to fetch contacts.")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: "Retry" });
    retryBtn.click();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders contacts table when contacts are loaded", () => {
    contactsData = [makeContact()];
    render(<ContactsPage />);
    expect(screen.getByTestId("contacts-table")).toBeInTheDocument();
  });

  it("shows New Contact button for admin", () => {
    contactsData = [];
    profileData = { role: "admin" };
    render(<ContactsPage />);
    expect(screen.getByRole("button", { name: "New Contact" })).toBeInTheDocument();
  });

  it("shows New Contact button for manager (can create)", () => {
    contactsData = [];
    profileData = { role: "manager" };
    render(<ContactsPage />);
    expect(screen.getByRole("button", { name: "New Contact" })).toBeInTheDocument();
  });

  it("hides New Contact button for member (cannot create)", () => {
    contactsData = [];
    profileData = { role: "member" };
    render(<ContactsPage />);
    expect(screen.queryByRole("button", { name: "New Contact" })).not.toBeInTheDocument();
  });

  it("hides New Contact button when profile role is null", () => {
    contactsData = [];
    profileData = { role: null };
    render(<ContactsPage />);
    expect(screen.queryByRole("button", { name: "New Contact" })).not.toBeInTheDocument();
  });

  it("opens the new contact modal when the button is clicked", async () => {
    contactsData = [];
    profileData = { role: "admin" };
    render(<ContactsPage />);

    await userEvent.click(screen.getByRole("button", { name: "New Contact" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows subtitle with correct total and active counts", () => {
    contactsData = [
      makeContact({ id: "1", name: "Alice", status: "active" }),
      makeContact({ id: "2", name: "Bob", status: "lead" }),
      makeContact({ id: "3", name: "Carol", status: "active" }),
    ];
    render(<ContactsPage />);
    expect(screen.getByText("3 total · 2 active")).toBeInTheDocument();
  });

  it("filters contacts by name search", async () => {
    contactsData = [
      makeContact({ id: "1", name: "Alice Smith" }),
      makeContact({ id: "2", name: "Bob Jones", company: "Other Ltd", email: "bob@other.com" }),
    ];
    render(<ContactsPage />);

    await userEvent.type(screen.getByLabelText("search"), "alice");

    expect(screen.getByTestId("contacts-table")).toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
  });

  it("filters contacts by company name", async () => {
    contactsData = [
      makeContact({ id: "1", name: "Alice", company: "Acme Corp" }),
      makeContact({ id: "2", name: "Bob", company: "Other Ltd", email: "bob@other.com" }),
    ];
    render(<ContactsPage />);

    await userEvent.type(screen.getByLabelText("search"), "acme");

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("filters contacts by email", async () => {
    contactsData = [
      makeContact({ id: "1", name: "Alice", email: "alice@acme.com" }),
      makeContact({ id: "2", name: "Bob", email: "bob@other.com" }),
    ];
    render(<ContactsPage />);

    await userEvent.type(screen.getByLabelText("search"), "acme.com");

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("filters contacts by status", async () => {
    contactsData = [
      makeContact({ id: "1", name: "Alice", status: "active" }),
      makeContact({ id: "2", name: "Bob", status: "lead" }),
    ];
    render(<ContactsPage />);

    await userEvent.selectOptions(screen.getByLabelText("status"), "active");

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("shows 'No contacts match these filters' empty state when filters exclude all results", async () => {
    contactsData = [makeContact({ status: "active" })];
    render(<ContactsPage />);

    await userEvent.selectOptions(screen.getByLabelText("status"), "lead");

    expect(
      screen.getByRole("heading", { name: "No contacts match these filters" }),
    ).toBeInTheDocument();
  });

  it("search is case-insensitive", async () => {
    contactsData = [makeContact({ name: "Alice Smith" })];
    render(<ContactsPage />);

    await userEvent.type(screen.getByLabelText("search"), "ALICE");

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });
});
