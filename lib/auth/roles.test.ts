import { describe, expect, it } from "vitest";
import { can, isAdmin } from "./roles";

describe("can() permission matrix", () => {
  it("grants admins full CRUD on every resource", () => {
    for (const resource of ["contacts", "documents", "users"] as const) {
      for (const action of ["create", "read", "update", "delete"] as const) {
        expect(can("admin", action, resource)).toBe(true);
      }
    }
  });

  it("lets managers run records but not delete contacts or manage users", () => {
    expect(can("manager", "create", "contacts")).toBe(true);
    expect(can("manager", "read", "contacts")).toBe(true);
    expect(can("manager", "update", "contacts")).toBe(true);
    expect(can("manager", "delete", "contacts")).toBe(false);
    expect(can("manager", "create", "documents")).toBe(true);
    expect(can("manager", "delete", "documents")).toBe(true);
    expect(can("manager", "read", "users")).toBe(false);
    expect(can("manager", "update", "users")).toBe(false);
  });

  it("limits members to read-only access", () => {
    expect(can("member", "read", "contacts")).toBe(true);
    expect(can("member", "read", "documents")).toBe(true);
    for (const resource of ["contacts", "documents", "users"] as const) {
      for (const action of ["create", "update", "delete"] as const) {
        expect(can("member", action, resource)).toBe(false);
      }
    }
    expect(can("member", "read", "users")).toBe(false);
  });
});

describe("isAdmin", () => {
  it("identifies admins", () => {
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("manager")).toBe(false);
    expect(isAdmin("member")).toBe(false);
  });
});
