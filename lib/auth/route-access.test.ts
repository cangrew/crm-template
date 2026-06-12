import { describe, expect, it } from "vitest";
import { canAccessPath, isPublicPath, PENDING_PATH, resolveAuthRedirect } from "./route-access";

describe("isPublicPath", () => {
  it("treats login and auth callback routes as public", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/contacts")).toBe(false);
  });
});

describe("canAccessPath", () => {
  it("restricts /settings to admins", () => {
    expect(canAccessPath("/settings/users", "admin")).toBe(true);
    expect(canAccessPath("/settings/users", "manager")).toBe(false);
    expect(canAccessPath("/settings/users", "agent")).toBe(false);
    expect(canAccessPath("/settings/users", "agency_owner")).toBe(false);
  });

  it("covers descendant routes of /settings without prefix collisions", () => {
    expect(canAccessPath("/settings", "manager")).toBe(false);
    expect(canAccessPath("/settings/users/123", "agent")).toBe(false);
    // An unrelated sibling route is not captured by the /settings branch.
    expect(canAccessPath("/settings-legacy", "agent")).toBe(true);
  });

  it("restricts agency management areas to staff", () => {
    for (const base of ["/agents", "/agencies"] as const) {
      expect(canAccessPath(base, "admin")).toBe(true);
      expect(canAccessPath(base, "manager")).toBe(true);
      expect(canAccessPath(base, "agent")).toBe(false);
      expect(canAccessPath(base, "agency_owner")).toBe(false);
      expect(canAccessPath(`${base}/some-id`, "agent")).toBe(false);
      expect(canAccessPath(`${base}/some-id`, "manager")).toBe(true);
    }
    expect(canAccessPath("/agents", null)).toBe(false);
  });

  it("allows shared workspace pages to every role", () => {
    for (const role of ["admin", "manager", "agent", "agency_owner"] as const) {
      expect(canAccessPath("/", role)).toBe(true);
      expect(canAccessPath("/contacts", role)).toBe(true);
      expect(canAccessPath("/documents", role)).toBe(true);
      expect(canAccessPath("/account", role)).toBe(true);
    }
  });

  it("denies restricted pages when role is unknown", () => {
    expect(canAccessPath("/settings/users", null)).toBe(false);
  });
});

describe("resolveAuthRedirect", () => {
  it("sends unauthenticated users on protected routes to /login", () => {
    expect(resolveAuthRedirect({ pathname: "/contacts", isAuthenticated: false, role: null })).toBe(
      "/login",
    );
  });

  it("lets unauthenticated users reach public routes", () => {
    expect(
      resolveAuthRedirect({ pathname: "/login", isAuthenticated: false, role: null }),
    ).toBeNull();
    expect(
      resolveAuthRedirect({ pathname: "/auth/callback", isAuthenticated: false, role: null }),
    ).toBeNull();
  });

  it("bounces authenticated users away from /login", () => {
    expect(resolveAuthRedirect({ pathname: "/login", isAuthenticated: true, role: "admin" })).toBe(
      "/",
    );
  });

  it("redirects authenticated users lacking access to the dashboard", () => {
    expect(
      resolveAuthRedirect({
        pathname: "/settings/users",
        isAuthenticated: true,
        role: "manager",
      }),
    ).toBe("/");
    expect(
      resolveAuthRedirect({ pathname: "/settings/users", isAuthenticated: true, role: "agent" }),
    ).toBe("/");
    expect(
      resolveAuthRedirect({ pathname: "/agencies", isAuthenticated: true, role: "agency_owner" }),
    ).toBe("/");
  });

  it("allows authenticated users with access through", () => {
    expect(
      resolveAuthRedirect({ pathname: "/settings/users", isAuthenticated: true, role: "admin" }),
    ).toBeNull();
    expect(
      resolveAuthRedirect({ pathname: "/contacts", isAuthenticated: true, role: "agent" }),
    ).toBeNull();
    expect(
      resolveAuthRedirect({ pathname: "/documents", isAuthenticated: true, role: "manager" }),
    ).toBeNull();
    expect(
      resolveAuthRedirect({ pathname: "/agents", isAuthenticated: true, role: "manager" }),
    ).toBeNull();
  });

  it("sends an authenticated user with no role to the pending screen", () => {
    expect(resolveAuthRedirect({ pathname: "/contacts", isAuthenticated: true, role: null })).toBe(
      PENDING_PATH,
    );
    expect(
      resolveAuthRedirect({ pathname: "/settings/users", isAuthenticated: true, role: null }),
    ).toBe(PENDING_PATH);
  });

  it("lets a roleless user stay on the pending screen", () => {
    expect(
      resolveAuthRedirect({ pathname: PENDING_PATH, isAuthenticated: true, role: null }),
    ).toBeNull();
  });

  it("bounces a provisioned user away from the pending screen", () => {
    expect(
      resolveAuthRedirect({ pathname: PENDING_PATH, isAuthenticated: true, role: "manager" }),
    ).toBe("/");
  });

  it("does not trap a roleless user mid OAuth callback", () => {
    expect(
      resolveAuthRedirect({ pathname: "/auth/callback", isAuthenticated: true, role: null }),
    ).toBeNull();
  });
});
