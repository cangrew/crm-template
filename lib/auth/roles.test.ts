import { describe, expect, it } from "vitest";
import { can, isAdmin, isStaff } from "./roles";

describe("can() permission matrix", () => {
  it("grants admins full CRUD on every resource", () => {
    for (const resource of [
      "clients",
      "documents",
      "users",
      "agents",
      "agencies",
      "carriers",
      "policies",
    ] as const) {
      for (const action of ["create", "read", "update", "delete"] as const) {
        expect(can("admin", action, resource)).toBe(true);
      }
    }
  });

  it("lets managers run records but not delete them or manage users", () => {
    expect(can("manager", "create", "clients")).toBe(true);
    expect(can("manager", "read", "clients")).toBe(true);
    expect(can("manager", "update", "clients")).toBe(true);
    expect(can("manager", "delete", "clients")).toBe(false);
    expect(can("manager", "create", "documents")).toBe(true);
    expect(can("manager", "delete", "documents")).toBe(true);
    expect(can("manager", "create", "agents")).toBe(true);
    expect(can("manager", "update", "agencies")).toBe(true);
    expect(can("manager", "delete", "agents")).toBe(false);
    expect(can("manager", "delete", "agencies")).toBe(false);
    expect(can("manager", "create", "carriers")).toBe(true);
    expect(can("manager", "update", "carriers")).toBe(true);
    expect(can("manager", "delete", "carriers")).toBe(false);
    expect(can("manager", "create", "policies")).toBe(true);
    expect(can("manager", "update", "policies")).toBe(true);
    expect(can("manager", "delete", "policies")).toBe(false);
    expect(can("manager", "read", "users")).toBe(false);
    expect(can("manager", "update", "users")).toBe(false);
  });

  it("limits agents to read-only access on their book", () => {
    expect(can("agent", "read", "clients")).toBe(true);
    expect(can("agent", "read", "documents")).toBe(true);
    expect(can("agent", "read", "agents")).toBe(true);
    expect(can("agent", "read", "policies")).toBe(true);
    expect(can("agent", "read", "agencies")).toBe(false);
    expect(can("agent", "read", "carriers")).toBe(false);
    for (const resource of [
      "clients",
      "documents",
      "users",
      "agents",
      "agencies",
      "carriers",
      "policies",
    ] as const) {
      for (const action of ["create", "update", "delete"] as const) {
        expect(can("agent", action, resource)).toBe(false);
      }
    }
    expect(can("agent", "read", "users")).toBe(false);
  });

  it("limits agency owners to read-only access on their agency's book", () => {
    expect(can("agency_owner", "read", "clients")).toBe(true);
    expect(can("agency_owner", "read", "documents")).toBe(true);
    expect(can("agency_owner", "read", "agents")).toBe(true);
    expect(can("agency_owner", "read", "agencies")).toBe(true);
    expect(can("agency_owner", "read", "policies")).toBe(true);
    expect(can("agency_owner", "read", "carriers")).toBe(false);
    for (const resource of [
      "clients",
      "documents",
      "users",
      "agents",
      "agencies",
      "carriers",
      "policies",
    ] as const) {
      for (const action of ["create", "update", "delete"] as const) {
        expect(can("agency_owner", action, resource)).toBe(false);
      }
    }
    expect(can("agency_owner", "read", "users")).toBe(false);
  });
});

describe("isAdmin", () => {
  it("identifies admins", () => {
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("manager")).toBe(false);
    expect(isAdmin("agent")).toBe(false);
    expect(isAdmin("agency_owner")).toBe(false);
  });
});

describe("isStaff", () => {
  it("identifies Findway staff roles", () => {
    expect(isStaff("admin")).toBe(true);
    expect(isStaff("manager")).toBe(true);
    expect(isStaff("agent")).toBe(false);
    expect(isStaff("agency_owner")).toBe(false);
  });
});
