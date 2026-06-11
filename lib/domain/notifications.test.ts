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

  it("flags at-risk events as high priority", () => {
    expect(notificationPriority("contact_at_risk")).toBe("high");
  });

  it("treats routine lifecycle events as normal priority", () => {
    expect(notificationPriority("contact_created")).toBe("normal");
    expect(notificationPriority("contact_closed")).toBe("normal");
  });
});

describe("notificationEntityType", () => {
  it("maps contact events to the contact entity", () => {
    for (const type of NOTIFICATION_TYPES) {
      expect(notificationEntityType(type)).toBe("contact");
    }
  });
});

describe("notificationHref", () => {
  it("links contact notifications to the contact detail route", () => {
    expect(notificationHref("contact", "abc-123")).toBe("/contacts/abc-123");
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

  it("excludes escalation events from the member list", () => {
    const memberTypes: NotificationType[] = typesForRole("member");
    expect(memberTypes).not.toContain("contact_at_risk");
    expect(memberTypes).not.toContain("contact_closed");
    expect(memberTypes).toContain("contact_created");
  });

  it("excludes admin-only closure events from the manager list", () => {
    expect(typesForRole("manager")).not.toContain("contact_closed");
  });
});
