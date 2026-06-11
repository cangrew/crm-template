import { describe, expect, it } from "vitest";
import { APP_ROLES, APP_ROLE_LABELS, CONTACT_STATUSES, CONTACT_STATUS_LABELS } from "./enums";

describe("enum value sets", () => {
  it("defines the app roles", () => {
    expect([...APP_ROLES]).toEqual(["admin", "manager", "member"]);
  });

  it("defines contact statuses", () => {
    expect([...CONTACT_STATUSES]).toEqual(["lead", "active", "at_risk", "closed"]);
  });
});

describe("label maps", () => {
  it("has a non-empty human label for every enum value", () => {
    const maps = [
      [APP_ROLES, APP_ROLE_LABELS],
      [CONTACT_STATUSES, CONTACT_STATUS_LABELS],
    ] as const;
    for (const [values, labels] of maps) {
      for (const value of values) {
        expect(labels[value as keyof typeof labels]).toBeTruthy();
      }
    }
  });
});
