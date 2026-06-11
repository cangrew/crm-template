import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- hoisted mocks ---
const { signInWithOAuth } = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth,
    },
  }),
}));

vi.mock("@/lib/config/app", () => ({
  APP_NAME: "Test CRM",
  APP_DESCRIPTION: "A test CRM description.",
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
}));

import LoginPage from "./page";

// jsdom does not define window.location.origin by default
Object.defineProperty(window, "location", {
  value: { origin: "http://localhost:3000" },
  writable: true,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  describe("initial render", () => {
    it("renders the app name", () => {
      render(<LoginPage />);
      expect(screen.getAllByText("Test CRM").length).toBeGreaterThan(0);
    });

    it("renders the app description", () => {
      render(<LoginPage />);
      expect(screen.getByText("A test CRM description.")).toBeInTheDocument();
    });

    it("renders the sign-in button with Microsoft text", () => {
      render(<LoginPage />);
      expect(screen.getByRole("button", { name: /sign in with microsoft/i })).toBeInTheDocument();
    });

    it("does not show an error alert on initial render", () => {
      render(<LoginPage />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows the 'SECURED BY MICROSOFT ENTRA ID' text", () => {
      render(<LoginPage />);
      expect(screen.getByText(/secured by microsoft entra id/i)).toBeInTheDocument();
    });
  });

  describe("signInWithMicrosoft — successful OAuth redirect", () => {
    it("calls supabase.auth.signInWithOAuth with azure provider", async () => {
      signInWithOAuth.mockResolvedValueOnce({ error: null });
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

      await waitFor(() => expect(signInWithOAuth).toHaveBeenCalledTimes(1));
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: "azure",
        options: {
          scopes: "email openid profile",
          redirectTo: "http://localhost:3000/auth/callback",
        },
      });
    });

    it("shows loading text while the OAuth request is in flight", async () => {
      // Never resolves so we can inspect the loading state
      signInWithOAuth.mockImplementation(() => new Promise(() => {}));
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

      await waitFor(() => expect(screen.getByText("Signing in…")).toBeInTheDocument());
    });

    it("disables the button while loading", async () => {
      signInWithOAuth.mockImplementation(() => new Promise(() => {}));
      render(<LoginPage />);

      const btn = screen.getByRole("button", { name: /sign in with microsoft/i });
      fireEvent.click(btn);

      await waitFor(() =>
        expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled(),
      );
    });
  });

  describe("signInWithMicrosoft — OAuth error from Supabase", () => {
    it("displays an error alert when Supabase returns an OAuth error", async () => {
      signInWithOAuth.mockResolvedValueOnce({ error: { message: "OAuth provider unavailable" } });
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("OAuth provider unavailable")).toBeInTheDocument();
    });

    it("shows 'Could not sign in' heading in the error alert", async () => {
      signInWithOAuth.mockResolvedValueOnce({ error: { message: "Some error" } });
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

      expect(await screen.findByText("Could not sign in")).toBeInTheDocument();
    });

    it("re-enables the button after an OAuth error", async () => {
      signInWithOAuth.mockResolvedValueOnce({
        error: { message: "Azure tenant not found" },
      });
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

      await waitFor(() =>
        expect(screen.getByRole("button")).not.toBeDisabled(),
      );
    });
  });

  describe("signInWithMicrosoft — thrown exception", () => {
    it("shows the thrown error message in the alert", async () => {
      signInWithOAuth.mockRejectedValueOnce(new Error("Network failure"));
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Network failure")).toBeInTheDocument();
    });

    it("shows 'Sign-in failed' for a non-Error thrown value", async () => {
      signInWithOAuth.mockRejectedValueOnce("unexpected string error");
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

      expect(await screen.findByText("Sign-in failed")).toBeInTheDocument();
    });

    it("re-enables the button after a thrown exception", async () => {
      signInWithOAuth.mockRejectedValueOnce(new Error("Crash"));
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /sign in with microsoft/i }));

      await waitFor(() =>
        expect(screen.getByRole("button")).not.toBeDisabled(),
      );
    });
  });

  describe("error alert reset", () => {
    it("clears the error on a subsequent sign-in attempt", async () => {
      signInWithOAuth
        .mockResolvedValueOnce({ error: { message: "First error" } })
        .mockImplementation(() => new Promise(() => {}));

      render(<LoginPage />);
      const btn = screen.getByRole("button", { name: /sign in with microsoft/i });

      fireEvent.click(btn);
      expect(await screen.findByText("First error")).toBeInTheDocument();

      // Click again — error should clear while loading
      fireEvent.click(screen.getByRole("button"));
      await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    });
  });
});