import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Profile } from "@/lib/supabase/types";

// --- hoisted mocks ---
const { useProfiles, useUpdateProfile, toastFn } = vi.hoisted(() => ({
  useProfiles: vi.fn(),
  useUpdateProfile: vi.fn(),
  toastFn: vi.fn(),
}));

vi.mock("@/lib/data/hooks", () => ({
  useProfiles,
  useUpdateProfile,
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => toastFn,
}));

// UsersTable exposes onChangeRole / onToggleActive callbacks through buttons
// so we can verify they receive the right arguments.
vi.mock("@/components/settings/users/users-table", () => ({
  UsersTable: ({
    rows,
    onChangeRole,
    onToggleActive,
  }: {
    rows: Profile[];
    onChangeRole: (id: string, role: string) => void;
    onToggleActive: (id: string, isActive: boolean) => void;
  }) => (
    <ul data-testid="users-table">
      {rows.map((p) => (
        <li key={p.id} data-testid="user-row" data-id={p.id}>
          {p.email}
          <button onClick={() => onChangeRole(p.id, "manager")}>change-role</button>
          <button onClick={() => onToggleActive(p.id, p.is_active ?? false)}>toggle-active</button>
        </li>
      ))}
    </ul>
  ),
}));

vi.mock("@/components/settings/users/users-filter-bar", () => ({
  UsersFilterBar: ({
    q,
    onQ,
    role,
    onRole,
  }: {
    q: string;
    onQ: (v: string) => void;
    role: string;
    onRole: (v: string) => void;
  }) => (
    <div>
      <input
        data-testid="filter-q"
        value={q}
        onChange={(e) => onQ(e.target.value)}
        placeholder="Search"
      />
      <select data-testid="filter-role" value={role} onChange={(e) => onRole(e.target.value)}>
        <option value="">All</option>
        <option value="admin">admin</option>
        <option value="manager">manager</option>
        <option value="member">member</option>
      </select>
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

import UserManagementPage from "./page";

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "p1",
    email: "alice@example.com",
    full_name: "Alice Smith",
    role: "admin",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeProfilesQ(overrides: Record<string, unknown> = {}) {
  return {
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

const mutate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  useUpdateProfile.mockReturnValue({ mutate });
  useProfiles.mockReturnValue(makeProfilesQ());
});

describe("UserManagementPage", () => {
  describe("subtitle counts", () => {
    it("shows total accounts and active count", () => {
      useProfiles.mockReturnValue(
        makeProfilesQ({
          data: [
            profile({ id: "1", is_active: true }),
            profile({ id: "2", is_active: false }),
            profile({ id: "3", is_active: true }),
          ],
        }),
      );
      render(<UserManagementPage />);
      expect(screen.getByTestId("subtitle").textContent).toBe("3 accounts · 2 active");
    });

    it("uses singular 'account' for exactly one user", () => {
      useProfiles.mockReturnValue(makeProfilesQ({ data: [profile()] }));
      render(<UserManagementPage />);
      expect(screen.getByTestId("subtitle").textContent).toBe("1 account · 1 active");
    });

    it("shows zero counts when no users exist", () => {
      render(<UserManagementPage />);
      expect(screen.getByTestId("subtitle").textContent).toBe("0 accounts · 0 active");
    });
  });

  describe("filter by text (q)", () => {
    const profiles = [
      profile({ id: "a", email: "alice@example.com", full_name: "Alice Smith" }),
      profile({ id: "b", email: "bob@example.com", full_name: "Bob Jones" }),
      profile({ id: "c", email: "carol@example.com", full_name: null }),
    ];

    beforeEach(() => {
      useProfiles.mockReturnValue(makeProfilesQ({ data: profiles }));
    });

    it("shows all users when filter is empty", () => {
      render(<UserManagementPage />);
      expect(screen.getAllByTestId("user-row")).toHaveLength(3);
    });

    it("filters by email (case-insensitive)", () => {
      render(<UserManagementPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "ALICE" } });
      const rows = screen.getAllByTestId("user-row");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent("alice@example.com");
    });

    it("filters by full_name", () => {
      render(<UserManagementPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "jones" } });
      const rows = screen.getAllByTestId("user-row");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveAttribute("data-id", "b");
    });

    it("does not crash when full_name is null", () => {
      render(<UserManagementPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "carol" } });
      const rows = screen.getAllByTestId("user-row");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveAttribute("data-id", "c");
    });

    it("shows empty state when no users match the search", () => {
      render(<UserManagementPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "zzznomatch" } });
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });

    it("shows 'No users match these filters' when some exist but none match", () => {
      render(<UserManagementPage />);
      fireEvent.change(screen.getByTestId("filter-q"), { target: { value: "zzznomatch" } });
      expect(screen.getByTestId("empty-state")).toHaveTextContent("No users match these filters");
    });
  });

  describe("filter by role", () => {
    const profiles = [
      profile({ id: "a", email: "alice@example.com", role: "admin" }),
      profile({ id: "b", email: "bob@example.com", role: "manager" }),
      profile({ id: "c", email: "carol@example.com", role: "member" }),
    ];

    beforeEach(() => {
      useProfiles.mockReturnValue(makeProfilesQ({ data: profiles }));
    });

    it("filters to admin users only", () => {
      render(<UserManagementPage />);
      fireEvent.change(screen.getByTestId("filter-role"), { target: { value: "admin" } });
      const rows = screen.getAllByTestId("user-row");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveAttribute("data-id", "a");
    });

    it("filters to manager users only", () => {
      render(<UserManagementPage />);
      fireEvent.change(screen.getByTestId("filter-role"), { target: { value: "manager" } });
      const rows = screen.getAllByTestId("user-row");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveAttribute("data-id", "b");
    });

    it("shows all users when role filter is cleared", () => {
      render(<UserManagementPage />);
      fireEvent.change(screen.getByTestId("filter-role"), { target: { value: "admin" } });
      fireEvent.change(screen.getByTestId("filter-role"), { target: { value: "" } });
      expect(screen.getAllByTestId("user-row")).toHaveLength(3);
    });
  });

  describe("changeRole", () => {
    it("calls updateProfile.mutate with the new role", () => {
      useProfiles.mockReturnValue(makeProfilesQ({ data: [profile({ id: "u42" })] }));
      render(<UserManagementPage />);
      // The stub UsersTable renders a "change-role" button that calls onChangeRole(id, "manager")
      fireEvent.click(screen.getByRole("button", { name: "change-role" }));
      expect(mutate).toHaveBeenCalledWith(
        { id: "u42", patch: { role: "manager" } },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });

    it("shows a success toast on role change", () => {
      useProfiles.mockReturnValue(makeProfilesQ({ data: [profile({ id: "u1" })] }));
      mutate.mockImplementation((_input: unknown, opts: { onSuccess?: () => void }) => opts.onSuccess?.());
      render(<UserManagementPage />);
      fireEvent.click(screen.getByRole("button", { name: "change-role" }));
      expect(toastFn).toHaveBeenCalledWith("Role set to Manager", "success");
    });

    it("shows an error toast when role change fails", () => {
      useProfiles.mockReturnValue(makeProfilesQ({ data: [profile({ id: "u1" })] }));
      const err = new Error("DB constraint");
      mutate.mockImplementation(
        (_input: unknown, opts: { onError?: (e: Error) => void }) => opts.onError?.(err),
      );
      render(<UserManagementPage />);
      fireEvent.click(screen.getByRole("button", { name: "change-role" }));
      expect(toastFn).toHaveBeenCalledWith("Could not update: DB constraint", "error");
    });
  });

  describe("toggleActive", () => {
    it("calls updateProfile.mutate with is_active flipped to false when user is active", () => {
      useProfiles.mockReturnValue(
        makeProfilesQ({ data: [profile({ id: "u99", is_active: true })] }),
      );
      render(<UserManagementPage />);
      fireEvent.click(screen.getByRole("button", { name: "toggle-active" }));
      expect(mutate).toHaveBeenCalledWith(
        { id: "u99", patch: { is_active: false } },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });

    it("calls updateProfile.mutate with is_active flipped to true when user is inactive", () => {
      useProfiles.mockReturnValue(
        makeProfilesQ({ data: [profile({ id: "u88", is_active: false })] }),
      );
      render(<UserManagementPage />);
      fireEvent.click(screen.getByRole("button", { name: "toggle-active" }));
      expect(mutate).toHaveBeenCalledWith(
        { id: "u88", patch: { is_active: true } },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });

    it("shows 'User disabled' toast when an active user is deactivated", () => {
      useProfiles.mockReturnValue(
        makeProfilesQ({ data: [profile({ id: "u1", is_active: true })] }),
      );
      mutate.mockImplementation((_input: unknown, opts: { onSuccess?: () => void }) => opts.onSuccess?.());
      render(<UserManagementPage />);
      fireEvent.click(screen.getByRole("button", { name: "toggle-active" }));
      expect(toastFn).toHaveBeenCalledWith("User disabled", "success");
    });

    it("shows 'User re-enabled' toast when an inactive user is re-activated", () => {
      useProfiles.mockReturnValue(
        makeProfilesQ({ data: [profile({ id: "u2", is_active: false })] }),
      );
      mutate.mockImplementation((_input: unknown, opts: { onSuccess?: () => void }) => opts.onSuccess?.());
      render(<UserManagementPage />);
      fireEvent.click(screen.getByRole("button", { name: "toggle-active" }));
      expect(toastFn).toHaveBeenCalledWith("User re-enabled", "success");
    });
  });

  describe("loading state", () => {
    it("renders skeleton when data is loading", () => {
      useProfiles.mockReturnValue(makeProfilesQ({ isLoading: true, data: undefined }));
      render(<UserManagementPage />);
      expect(screen.queryByTestId("users-table")).not.toBeInTheDocument();
      expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("renders the error state when query errors", () => {
      useProfiles.mockReturnValue(makeProfilesQ({ isError: true }));
      render(<UserManagementPage />);
      expect(screen.getByTestId("error-state")).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch users.")).toBeInTheDocument();
    });

    it("calls refetch on retry", () => {
      const refetch = vi.fn();
      useProfiles.mockReturnValue(makeProfilesQ({ isError: true, refetch }));
      render(<UserManagementPage />);
      fireEvent.click(screen.getByRole("button", { name: /retry/i }));
      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("empty state", () => {
    it("shows 'No users provisioned' when there are no users at all", () => {
      render(<UserManagementPage />);
      expect(screen.getByTestId("empty-state")).toHaveTextContent("No users provisioned");
    });
  });

  describe("Invite User button", () => {
    it("shows a toast about Entra ID when the Invite User button is clicked", () => {
      render(<UserManagementPage />);
      fireEvent.click(screen.getByRole("button", { name: /invite user/i }));
      expect(toastFn).toHaveBeenCalledWith(
        "Invitations go through Microsoft Entra ID.",
        "default",
      );
    });
  });
});