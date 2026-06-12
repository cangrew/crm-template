import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockRefetch = vi.fn();
const mockUpdateMutate = vi.fn();
const mockToast = vi.fn();

let profilesData: unknown[] | undefined = undefined;
let profilesIsLoading = false;
let profilesIsError = false;

vi.mock("@/lib/data/hooks", () => ({
  useProfiles: () => ({
    data: profilesData,
    isLoading: profilesIsLoading,
    isError: profilesIsError,
    refetch: mockRefetch,
  }),
  useUpdateProfile: () => ({ mutate: mockUpdateMutate }),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => mockToast,
}));

vi.mock("@/lib/domain/enums", () => ({
  APP_ROLE_LABELS: {
    admin: "Admin",
    manager: "Manager",
    agent: "Agent",
  },
}));

vi.mock("@/components/settings/users/users-filter-bar", () => ({
  UsersFilterBar: ({ onQ, onRole }: { onQ: (v: string) => void; onRole: (v: string) => void }) => (
    <div>
      <input aria-label="search" onChange={(e) => onQ(e.target.value)} />
      <select aria-label="role" onChange={(e) => onRole(e.target.value)}>
        <option value="">All</option>
        <option value="admin">Admin</option>
        <option value="manager">Manager</option>
        <option value="agent">Agent</option>
      </select>
    </div>
  ),
}));

vi.mock("@/components/settings/users/users-table", () => ({
  UsersTable: ({
    rows,
    onChangeRole,
    onToggleActive,
  }: {
    rows: Array<{ id: string; email: string; role: string | null; is_active: boolean }>;
    onChangeRole: (id: string, role: string) => void;
    onToggleActive: (id: string, isActive: boolean) => void;
  }) => (
    <div data-testid="users-table">
      {rows.map((r) => (
        <div key={r.id} data-testid={`user-row-${r.id}`}>
          <span>{r.email}</span>
          <button onClick={() => onChangeRole(r.id, "manager")}>Change Role</button>
          <button onClick={() => onToggleActive(r.id, r.is_active)}>Toggle</button>
        </div>
      ))}
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

import UserManagementPage from "./page";

function makeProfile(
  overrides: Partial<{
    id: string;
    email: string;
    full_name: string | null;
    role: string | null;
    is_active: boolean;
    created_at: string;
  }> = {},
) {
  return {
    id: "u1",
    email: "alice@example.com",
    full_name: "Alice",
    role: "agent",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  profilesData = undefined;
  profilesIsLoading = false;
  profilesIsError = false;
});

describe("UserManagementPage", () => {
  it("renders the page title", () => {
    profilesData = [];
    render(<UserManagementPage />);
    expect(screen.getByRole("heading", { name: "User Management" })).toBeInTheDocument();
  });

  it("shows loading skeleton when profiles are loading", () => {
    profilesIsLoading = true;
    render(<UserManagementPage />);
    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
  });

  it("shows error state on error and calls refetch on retry", () => {
    profilesIsError = true;
    render(<UserManagementPage />);
    expect(screen.getByText("Failed to fetch users.")).toBeInTheDocument();

    screen.getByRole("button", { name: "Retry" }).click();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("shows 'No users provisioned' empty state when there are no users", () => {
    profilesData = [];
    render(<UserManagementPage />);
    expect(screen.getByRole("heading", { name: "No users provisioned" })).toBeInTheDocument();
  });

  it("renders the users table when profiles are loaded", () => {
    profilesData = [makeProfile()];
    render(<UserManagementPage />);
    expect(screen.getByTestId("users-table")).toBeInTheDocument();
  });

  it("shows subtitle with correct account and active counts", () => {
    profilesData = [
      makeProfile({ id: "u1", is_active: true }),
      makeProfile({ id: "u2", is_active: false }),
      makeProfile({ id: "u3", is_active: true }),
    ];
    render(<UserManagementPage />);
    expect(screen.getByText("3 accounts · 2 active")).toBeInTheDocument();
  });

  it("shows singular 'account' when count is 1", () => {
    profilesData = [makeProfile({ id: "u1", is_active: true })];
    render(<UserManagementPage />);
    expect(screen.getByText("1 account · 1 active")).toBeInTheDocument();
  });

  it("filters profiles by search query matching email", async () => {
    profilesData = [
      makeProfile({ id: "u1", email: "alice@example.com", full_name: "Alice" }),
      makeProfile({ id: "u2", email: "bob@example.com", full_name: "Bob" }),
    ];
    render(<UserManagementPage />);

    await userEvent.type(screen.getByLabelText("search"), "alice");

    expect(screen.getByTestId("user-row-u1")).toBeInTheDocument();
    expect(screen.queryByTestId("user-row-u2")).not.toBeInTheDocument();
  });

  it("filters profiles by search query matching full_name", async () => {
    profilesData = [
      makeProfile({ id: "u1", email: "a@example.com", full_name: "Alice Wonder" }),
      makeProfile({ id: "u2", email: "b@example.com", full_name: "Bob Smith" }),
    ];
    render(<UserManagementPage />);

    await userEvent.type(screen.getByLabelText("search"), "wonder");

    expect(screen.getByTestId("user-row-u1")).toBeInTheDocument();
    expect(screen.queryByTestId("user-row-u2")).not.toBeInTheDocument();
  });

  it("filters profiles by role dropdown", async () => {
    profilesData = [
      makeProfile({ id: "u1", role: "admin" }),
      makeProfile({ id: "u2", role: "agent" }),
    ];
    render(<UserManagementPage />);

    await userEvent.selectOptions(screen.getByLabelText("role"), "admin");

    expect(screen.getByTestId("user-row-u1")).toBeInTheDocument();
    expect(screen.queryByTestId("user-row-u2")).not.toBeInTheDocument();
  });

  it("shows 'No users match these filters' when filters exclude all results", async () => {
    profilesData = [makeProfile({ role: "agent" })];
    render(<UserManagementPage />);

    await userEvent.selectOptions(screen.getByLabelText("role"), "admin");

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "No users match these filters" }),
      ).toBeInTheDocument();
    });
  });

  it("calls updateProfile.mutate with new role when changeRole is invoked", () => {
    profilesData = [makeProfile({ id: "u1", role: "agent" })];
    render(<UserManagementPage />);

    screen.getByRole("button", { name: "Change Role" }).click();

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      { id: "u1", patch: { role: "manager" } },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("toasts success message after role change", () => {
    profilesData = [makeProfile({ id: "u1", role: "agent" })];
    mockUpdateMutate.mockImplementation(
      (_args: unknown, { onSuccess }: { onSuccess: () => void }) => {
        onSuccess();
      },
    );
    render(<UserManagementPage />);

    screen.getByRole("button", { name: "Change Role" }).click();

    expect(mockToast).toHaveBeenCalledWith("Role set to Manager", "success");
  });

  it("calls updateProfile.mutate with is_active toggled when toggleActive is invoked", () => {
    profilesData = [makeProfile({ id: "u1", is_active: true })];
    render(<UserManagementPage />);

    screen.getByRole("button", { name: "Toggle" }).click();

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      { id: "u1", patch: { is_active: false } },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("toasts 'User disabled' when an active user is toggled off", () => {
    profilesData = [makeProfile({ id: "u1", is_active: true })];
    mockUpdateMutate.mockImplementation(
      (_args: unknown, { onSuccess }: { onSuccess: () => void }) => {
        onSuccess();
      },
    );
    render(<UserManagementPage />);

    screen.getByRole("button", { name: "Toggle" }).click();

    expect(mockToast).toHaveBeenCalledWith("User disabled", "success");
  });

  it("toasts 'User re-enabled' when an inactive user is toggled on", () => {
    profilesData = [makeProfile({ id: "u1", is_active: false })];
    mockUpdateMutate.mockImplementation(
      (_args: unknown, { onSuccess }: { onSuccess: () => void }) => {
        onSuccess();
      },
    );
    render(<UserManagementPage />);

    screen.getByRole("button", { name: "Toggle" }).click();

    expect(mockToast).toHaveBeenCalledWith("User re-enabled", "success");
  });

  it("shows the Invite User button", () => {
    profilesData = [];
    render(<UserManagementPage />);
    expect(screen.getByRole("button", { name: "Invite User" })).toBeInTheDocument();
  });

  it("toasts an informational message when Invite User is clicked", async () => {
    profilesData = [];
    render(<UserManagementPage />);
    await userEvent.click(screen.getByRole("button", { name: "Invite User" }));
    expect(mockToast).toHaveBeenCalledWith("Invitations go through Microsoft Entra ID.", "default");
  });
});
