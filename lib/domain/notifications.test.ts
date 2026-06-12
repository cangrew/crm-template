import { describe, expect, it } from "vitest";
import { APP_ROLES, type AppRole } from "./enums";
import {
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
  type NotificationType,
  notificationAudience,
  notificationEntityType,
  notificationHref,
  notificationPriority,
  typesForRole,
} from "./notifications";

describe("notification domain metadata", () => {
  it("labels every notification type", () => {
    for (const type of NOTIFICATION_TYPES) {
      expect(NOTIFICATION_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it("resolves an audience of valid roles for every type", () => {
    for (const type of NOTIFICATION_TYPES) {
      const roles = notificationAudience(type);
      expect(roles.length).toBeGreaterThan(0);
      for (const role of roles) {
        expect(APP_ROLES).toContain(role);
      }
    }
  });

  it("assigns a known priority to every type", () => {
    for (const type of NOTIFICATION_TYPES) {
      expect(NOTIFICATION_PRIORITIES).toContain(notificationPriority(type));
    }
  });

  it("flags lapses and unmatched lines as high priority", () => {
    expect(notificationPriority("policy_lapsed")).toBe("high");
    expect(notificationPriority("lines_unmatched")).toBe("high");
  });

  it("treats routine lifecycle events as normal priority", () => {
    expect(notificationPriority("client_created")).toBe("normal");
    expect(notificationPriority("statement_posted")).toBe("normal");
    expect(notificationPriority("payout_finalized")).toBe("normal");
  });
});

describe("notificationEntityType", () => {
  it("maps each type to its entity", () => {
    expect(notificationEntityType("client_created")).toBe("client");
    expect(notificationEntityType("policy_lapsed")).toBe("policy");
    expect(notificationEntityType("statement_posted")).toBe("statement");
    expect(notificationEntityType("lines_unmatched")).toBe("statement");
    expect(notificationEntityType("payout_finalized")).toBe("payout");
  });
});

describe("notificationHref", () => {
  it("links each entity type to its detail route", () => {
    expect(notificationHref("client", "abc-123")).toBe("/clients/abc-123");
    expect(notificationHref("policy", "p-1")).toBe("/policies/p-1");
    expect(notificationHref("statement", "s-1")).toBe("/statements/s-1");
    expect(notificationHref("payout", "y-1")).toBe("/payouts/y-1");
  });
});

describe("typesForRole", () => {
  it("returns only types whose audience includes the role", () => {
    for (const role of APP_ROLES) {
      for (const type of typesForRole(role)) {
        expect(notificationAudience(type)).toContain<AppRole>(role);
      }
    }
  });

  it("gives admins every notification type", () => {
    expect(typesForRole("admin").sort()).toEqual([...NOTIFICATION_TYPES].sort());
  });

  it("limits tenant roles to payout notifications (no other-book leakage)", () => {
    for (const role of ["agent", "agency_owner"] as const) {
      const types: NotificationType[] = typesForRole(role);
      expect(types).toEqual(["payout_finalized"]);
      expect(types).not.toContain("client_created");
    }
  });

  it("keeps staff-only operational events with admins and managers", () => {
    for (const type of [
      "client_created",
      "policy_lapsed",
      "statement_posted",
      "lines_unmatched",
    ] as const) {
      expect(notificationAudience(type)).toEqual(["admin", "manager"]);
    }
  });
});
