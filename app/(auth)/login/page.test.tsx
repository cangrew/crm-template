import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockSignInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

vi.mock("@/lib/config/app", () => ({
  APP_NAME: "Test CRM",
  APP_DESCRIPTION: "A test CRM description.",
}));

// cn is a simple utility - let it through with an identity mock
vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(" "),
}));

import LoginPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("renders the app name", () => {
    render(<LoginPage />);
    expect(screen.getByText("Test CRM")).toBeInTheDocument();
  });

  it("renders the app description", () => {
    render(<LoginPage />);
    expect(screen.getByText("A test CRM description.")).toBeInTheDocument();
  });

  it("renders the sign-in heading", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: /sign in to your workspace/i })).toBeInTheDocument();
  });

  it("renders the Microsoft sign-in button", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: /sign in with microsoft/i })).toBeInTheDocument();
  });

  it("does not show an error alert initially", () => {
    render(<LoginPage />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows loading text while sign-in is in progress", async () => {
    // Delay resolution so we can observe the loading state
    mockSignInWithOAuth.mockReturnValue(new Promise(() => {}));

    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

    expect(screen.getByText("Signing in…")).toBeInTheDocument();
  });

  it("disables the button while sign-in is in progress", async () => {
    mockSignInWithOAuth.mockReturnValue(new Promise(() => {}));

    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

    const btn = screen.getByText("Signing in…").closest("button");
    expect(btn).toBeDisabled();
  });

  it("calls supabase signInWithOAuth with the azure provider", async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null });

    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "azure",
        options: expect.objectContaining({
          scopes: "email openid profile",
        }),
      }),
    );
  });

  it("shows an error alert when OAuth returns an error", async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: { message: "OAuth provider error" } });

    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("OAuth provider error")).toBeInTheDocument();
    expect(screen.getByText("Could not sign in")).toBeInTheDocument();
  });

  it("re-enables the button and restores label after an OAuth error", async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: { message: "Some error" } });

    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign in with microsoft/i })).not.toBeDisabled();
    });
  });

  it("shows an error alert when an unexpected exception is thrown", async () => {
    mockSignInWithOAuth.mockRejectedValue(new Error("Network failure"));

    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("Network failure")).toBeInTheDocument();
  });

  it("falls back to a generic message for non-Error exceptions", async () => {
    mockSignInWithOAuth.mockRejectedValue("string rejection");

    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

    await waitFor(() => {
      expect(screen.getByText("Sign-in failed")).toBeInTheDocument();
    });
  });

  it("renders the 'Secured by Microsoft Entra ID' label", () => {
    render(<LoginPage />);
    expect(screen.getByText(/secured by microsoft entra id/i)).toBeInTheDocument();
  });

  it("renders contact-admin help text", () => {
    render(<LoginPage />);
    expect(screen.getByText(/trouble signing in/i)).toBeInTheDocument();
  });

  it("renders the Microsoft logo SVG", () => {
    const { container } = render(<LoginPage />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("includes the origin in the OAuth redirect URL", async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null });
    // jsdom sets window.location.origin to 'http://localhost'
    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          redirectTo: expect.stringContaining("/auth/callback"),
        }),
      }),
    );
  });
});
