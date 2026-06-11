import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

// ── Mocks ──────────────────────────────────────────────────────────────────
let profileData: {
  id: string;
  full_name: string | null;
  email: string;
  role: string | null;
} | undefined = undefined;
let searchParamTab = "";

vi.mock("@/lib/data/hooks", () => ({
  useCurrentProfile: () => ({ data: profileData }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "tab" ? searchParamTab : null),
  }),
}));

vi.mock("@/components/account/account-summary-card", () => ({
  AccountSummaryCard: ({ profile }: { profile: { email: string; full_name: string | null } }) => (
    <div data-testid="account-summary-card">{profile.email}</div>
  ),
}));

vi.mock("@/components/account/profile-tab", () => ({
  ProfileTab: ({ profile }: { profile: { email: string } }) => (
    <div data-testid="profile-tab">{profile.email}</div>
  ),
}));

vi.mock("@/components/account/preferences-tab", () => ({
  PreferencesTab: ({ userId, role }: { userId: string; role: string }) => (
    <div data-testid="preferences-tab">
      {userId}-{role}
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

vi.mock("@/components/common/tab-bar", () => ({
  TabBar: ({
    tabs,
    active,
    onChange,
  }: {
    tabs: Array<{ key: string; label: string }>;
    active: string;
    onChange: (key: string) => void;
  }) => (
    <div>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          aria-pressed={active === t.key}
          aria-label={t.label}
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
  profileData = undefined;
  searchParamTab = "";
});

describe("AccountPage", () => {
  it("renders the page title", () => {
    render(<AccountPage />);
    expect(screen.getByRole("heading", { name: "My Account" })).toBeInTheDocument();
  });

  it("renders the page subtitle", () => {
    render(<AccountPage />);
    expect(
      screen.getByText("Manage your profile, sign-in, and notifications"),
    ).toBeInTheDocument();
  });

  it("renders the AccountSummaryCard", () => {
    render(<AccountPage />);
    expect(screen.getByTestId("account-summary-card")).toBeInTheDocument();
  });

  it("defaults to the profile tab", () => {
    render(<AccountPage />);
    expect(screen.getByTestId("profile-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("preferences-tab")).not.toBeInTheDocument();
  });

  it("shows preferences tab when URL param is 'preferences'", () => {
    searchParamTab = "preferences";
    render(<AccountPage />);
    expect(screen.getByTestId("preferences-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("profile-tab")).not.toBeInTheDocument();
  });

  it("switches to preferences tab when the tab button is clicked", async () => {
    render(<AccountPage />);
    await userEvent.click(screen.getByRole("button", { name: "Preferences" }));
    expect(screen.getByTestId("preferences-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("profile-tab")).not.toBeInTheDocument();
  });

  it("switches back to profile tab when Profile button is clicked", async () => {
    searchParamTab = "preferences";
    render(<AccountPage />);

    await userEvent.click(screen.getByRole("button", { name: "Profile" }));

    expect(screen.getByTestId("profile-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("preferences-tab")).not.toBeInTheDocument();
  });

  it("uses the real profile when profile data with a role is available", () => {
    profileData = {
      id: "user-real",
      full_name: "Jane Doe",
      email: "jane@real.com",
      role: "manager",
    };
    render(<AccountPage />);
    // The AccountSummaryCard stub renders the email
    expect(screen.getByTestId("account-summary-card")).toHaveTextContent("jane@real.com");
  });

  it("falls back to the stub profile when profile data has no role", () => {
    profileData = {
      id: "user-no-role",
      full_name: null,
      email: "pending@example.com",
      role: null,
    };
    render(<AccountPage />);
    // Should fall back to STUB_PROFILE email
    expect(screen.getByTestId("account-summary-card")).toHaveTextContent(
      "design-qa@example.com",
    );
  });

  it("falls back to stub profile when profile data is undefined", () => {
    profileData = undefined;
    render(<AccountPage />);
    expect(screen.getByTestId("account-summary-card")).toHaveTextContent(
      "design-qa@example.com",
    );
  });

  it("passes the real profile id and role to PreferencesTab", async () => {
    profileData = {
      id: "user-real-id",
      full_name: "Jane",
      email: "jane@real.com",
      role: "admin",
    };
    render(<AccountPage />);

    await userEvent.click(screen.getByRole("button", { name: "Preferences" }));

    expect(screen.getByTestId("preferences-tab")).toHaveTextContent("user-real-id-admin");
  });

  it("shows Profile and Preferences tabs in the tab bar", () => {
    render(<AccountPage />);
    expect(screen.getByRole("button", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preferences" })).toBeInTheDocument();
  });

  it("syncs tab state when URL param changes externally", () => {
    // Initial render with profile tab
    searchParamTab = "";
    const { rerender } = render(<AccountPage />);
    expect(screen.getByTestId("profile-tab")).toBeInTheDocument();

    // Simulate URL change (e.g. back/forward navigation)
    searchParamTab = "preferences";
    rerender(<AccountPage />);
    expect(screen.getByTestId("preferences-tab")).toBeInTheDocument();
  });
});