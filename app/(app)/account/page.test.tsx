import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- hoisted mocks ---
const { useCurrentProfile } = vi.hoisted(() => ({
  useCurrentProfile: vi.fn(),
}));
let mockSearchParams: URLSearchParams;

vi.mock("@/lib/data/hooks", () => ({
  useCurrentProfile,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/components/account/account-summary-card", () => ({
  AccountSummaryCard: ({ profile }: { profile: { id: string; full_name: string | null; email: string; role: string } }) => (
    <div data-testid="account-summary" data-id={profile.id} data-role={profile.role}>
      {profile.full_name ?? profile.email}
    </div>
  ),
}));

vi.mock("@/components/account/profile-tab", () => ({
  ProfileTab: ({ profile }: { profile: { id: string } }) => (
    <div data-testid="profile-tab" data-id={profile.id} />
  ),
}));

vi.mock("@/components/account/preferences-tab", () => ({
  PreferencesTab: ({ userId, role }: { userId: string; role: string }) => (
    <div data-testid="preferences-tab" data-user-id={userId} data-role={role} />
  ),
}));

vi.mock("@/components/common/page-header", () => ({
  PageHeader: ({
    title,
    actions,
  }: {
    title: string;
    actions?: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {actions && <div data-testid="page-actions">{actions}</div>}
    </div>
  ),
}));

vi.mock("@/components/common/tab-bar", () => ({
  TabBar: ({
    active,
    onChange,
    tabs,
  }: {
    active: string;
    onChange: (key: string) => void;
    tabs: { key: string; label: string }[];
  }) => (
    <div data-testid="tab-bar">
      {tabs.map((t) => (
        <button
          key={t.key}
          data-testid={`tab-${t.key}`}
          data-active={String(active === t.key)}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  ),
}));

import AccountPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchParams = new URLSearchParams();
  useCurrentProfile.mockReturnValue({ data: null });
});

describe("AccountPage", () => {
  describe("profile resolution", () => {
    it("uses the real profile when it has a role", () => {
      useCurrentProfile.mockReturnValue({
        data: {
          id: "real-user-id",
          full_name: "Jane Doe",
          email: "jane@example.com",
          role: "manager",
        },
      });
      render(<AccountPage />);
      const summary = screen.getByTestId("account-summary");
      expect(summary).toHaveAttribute("data-id", "real-user-id");
      expect(summary).toHaveAttribute("data-role", "manager");
      expect(summary).toHaveTextContent("Jane Doe");
    });

    it("falls back to the STUB_PROFILE when data is null", () => {
      useCurrentProfile.mockReturnValue({ data: null });
      render(<AccountPage />);
      const summary = screen.getByTestId("account-summary");
      expect(summary).toHaveAttribute("data-id", "00000000-0000-0000-0000-000000000000");
      expect(summary).toHaveAttribute("data-role", "admin");
    });

    it("falls back to the STUB_PROFILE when the user has no role", () => {
      useCurrentProfile.mockReturnValue({
        data: {
          id: "pending-user",
          full_name: "Pending User",
          email: "pending@example.com",
          role: null,
        },
      });
      render(<AccountPage />);
      const summary = screen.getByTestId("account-summary");
      // Falls back to stub because role is falsy
      expect(summary).toHaveAttribute("data-id", "00000000-0000-0000-0000-000000000000");
    });
  });

  describe("tab display — default to profile tab", () => {
    it("shows the profile tab by default (no URL param)", () => {
      render(<AccountPage />);
      expect(screen.getByTestId("profile-tab")).toBeInTheDocument();
      expect(screen.queryByTestId("preferences-tab")).not.toBeInTheDocument();
    });

    it("shows the profile tab when URL param is not 'preferences'", () => {
      mockSearchParams = new URLSearchParams("tab=unknown");
      render(<AccountPage />);
      expect(screen.getByTestId("profile-tab")).toBeInTheDocument();
      expect(screen.queryByTestId("preferences-tab")).not.toBeInTheDocument();
    });
  });

  describe("tab display — preferences tab from URL", () => {
    it("shows the preferences tab when ?tab=preferences", () => {
      mockSearchParams = new URLSearchParams("tab=preferences");
      render(<AccountPage />);
      expect(screen.getByTestId("preferences-tab")).toBeInTheDocument();
      expect(screen.queryByTestId("profile-tab")).not.toBeInTheDocument();
    });

    it("passes the userId and role to PreferencesTab", () => {
      mockSearchParams = new URLSearchParams("tab=preferences");
      useCurrentProfile.mockReturnValue({
        data: { id: "u5", full_name: "Foo", email: "foo@x.com", role: "member" },
      });
      render(<AccountPage />);
      const prefsTab = screen.getByTestId("preferences-tab");
      expect(prefsTab).toHaveAttribute("data-user-id", "u5");
      expect(prefsTab).toHaveAttribute("data-role", "member");
    });
  });

  describe("tab sync from URL changes", () => {
    it("switches to preferences when the URL param changes to preferences", () => {
      const { rerender } = render(<AccountPage />);
      // Start on profile tab
      expect(screen.getByTestId("profile-tab")).toBeInTheDocument();

      // Simulate URL change
      mockSearchParams = new URLSearchParams("tab=preferences");
      rerender(<AccountPage />);

      expect(screen.getByTestId("preferences-tab")).toBeInTheDocument();
      expect(screen.queryByTestId("profile-tab")).not.toBeInTheDocument();
    });

    it("switches back to profile when the URL param is removed", () => {
      mockSearchParams = new URLSearchParams("tab=preferences");
      const { rerender } = render(<AccountPage />);
      expect(screen.getByTestId("preferences-tab")).toBeInTheDocument();

      mockSearchParams = new URLSearchParams();
      rerender(<AccountPage />);

      expect(screen.getByTestId("profile-tab")).toBeInTheDocument();
      expect(screen.queryByTestId("preferences-tab")).not.toBeInTheDocument();
    });
  });

  describe("page structure", () => {
    it("renders the My Account heading", () => {
      render(<AccountPage />);
      expect(screen.getByRole("heading", { name: /my account/i })).toBeInTheDocument();
    });

    it("renders both Profile and Preferences tabs in the tab bar", () => {
      render(<AccountPage />);
      expect(screen.getByTestId("tab-profile")).toBeInTheDocument();
      expect(screen.getByTestId("tab-preferences")).toBeInTheDocument();
    });

    it("passes profile data to ProfileTab", () => {
      useCurrentProfile.mockReturnValue({
        data: { id: "u77", full_name: "Dev", email: "dev@x.com", role: "admin" },
      });
      render(<AccountPage />);
      expect(screen.getByTestId("profile-tab")).toHaveAttribute("data-id", "u77");
    });
  });
});