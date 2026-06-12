import { describe, expect, it, vi } from "vitest";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { ADMIN_MANAGER, ALL_ROLES, isAuthorizedProfile, requireApiRole } from "./authorize";

const { getCurrentProfile } = vi.hoisted(() => ({ getCurrentProfile: vi.fn() }));
vi.mock("@/lib/data/profiles", () => ({ getCurrentProfile }));

const supabase = {} as TypedSupabaseClient;

function profile(
  overrides: Partial<{
    role: "admin" | "manager" | "agent" | "agency_owner" | null;
    is_active: boolean;
  }> = {},
) {
  return { role: "admin" as const, is_active: true, ...overrides };
}

describe("isAuthorizedProfile()", () => {
  it("denies when there is no profile at all", () => {
    expect(isAuthorizedProfile(null, ALL_ROLES)).toBe(false);
  });

  it("denies a deactivated profile even with an allowed role", () => {
    expect(isAuthorizedProfile(profile({ is_active: false }), ALL_ROLES)).toBe(false);
    expect(isAuthorizedProfile(profile({ role: "manager", is_active: false }), ADMIN_MANAGER)).toBe(
      false,
    );
  });

  it("denies a pending profile (no role assigned yet)", () => {
    expect(isAuthorizedProfile(profile({ role: null }), ALL_ROLES)).toBe(false);
  });

  it("denies an active profile whose role is not in the allow-list", () => {
    expect(isAuthorizedProfile(profile({ role: "agent" }), ADMIN_MANAGER)).toBe(false);
    expect(isAuthorizedProfile(profile({ role: "manager" }), ["admin"])).toBe(false);
  });

  it("allows an active profile whose role is in the allow-list", () => {
    expect(isAuthorizedProfile(profile(), ADMIN_MANAGER)).toBe(true);
    expect(isAuthorizedProfile(profile({ role: "manager" }), ADMIN_MANAGER)).toBe(true);
    expect(isAuthorizedProfile(profile({ role: "agent" }), ALL_ROLES)).toBe(true);
    expect(isAuthorizedProfile(profile({ role: "agency_owner" }), ALL_ROLES)).toBe(true);
  });
});

describe("role allow-list constants", () => {
  it("cover the expected roles", () => {
    expect(ALL_ROLES).toEqual(["admin", "manager", "agent", "agency_owner"]);
    expect(ADMIN_MANAGER).toEqual(["admin", "manager"]);
  });
});

describe("requireApiRole()", () => {
  it("returns 401 when there is no authenticated profile", async () => {
    getCurrentProfile.mockResolvedValueOnce(null);
    await expect(requireApiRole(supabase, ALL_ROLES)).resolves.toEqual({ ok: false, status: 401 });
  });

  it("returns 403 for a deactivated or out-of-role profile", async () => {
    getCurrentProfile.mockResolvedValueOnce({ role: "admin", is_active: false });
    await expect(requireApiRole(supabase, ALL_ROLES)).resolves.toEqual({ ok: false, status: 403 });

    getCurrentProfile.mockResolvedValueOnce({ role: "agent", is_active: true });
    await expect(requireApiRole(supabase, ADMIN_MANAGER)).resolves.toEqual({
      ok: false,
      status: 403,
    });
  });

  it("returns the profile for an active allow-listed role", async () => {
    const profile = { id: "u1", role: "manager", is_active: true };
    getCurrentProfile.mockResolvedValueOnce(profile);
    await expect(requireApiRole(supabase, ADMIN_MANAGER)).resolves.toEqual({
      ok: true,
      profile,
    });
  });
});
