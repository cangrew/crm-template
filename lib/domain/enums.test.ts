import { describe, expect, it } from "vitest";
import {
  AGENCY_STATUSES,
  AGENCY_STATUS_LABELS,
  AGENT_STATUSES,
  AGENT_STATUS_LABELS,
  APP_ROLES,
  APP_ROLE_LABELS,
  CONTACT_STATUSES,
  CONTACT_STATUS_LABELS,
} from "./enums";

describe("enum value sets", () => {
  it("defines the app roles", () => {
    expect([...APP_ROLES]).toEqual(["admin", "manager", "agent", "agency_owner"]);
  });

  it("defines agency statuses", () => {
    expect([...AGENCY_STATUSES]).toEqual(["active", "inactive"]);
  });

  it("defines agent statuses", () => {
    expect([...AGENT_STATUSES]).toEqual(["active", "inactive", "terminated"]);
  });

  it("defines contact statuses", () => {
    expect([...CONTACT_STATUSES]).toEqual(["lead", "active", "at_risk", "closed"]);
  });
});

describe("label maps", () => {
  it("has a non-empty human label for every enum value", () => {
    const maps = [
      [APP_ROLES, APP_ROLE_LABELS],
      [AGENCY_STATUSES, AGENCY_STATUS_LABELS],
      [AGENT_STATUSES, AGENT_STATUS_LABELS],
      [CONTACT_STATUSES, CONTACT_STATUS_LABELS],
    ] as const;
    for (const [values, labels] of maps) {
      for (const value of values) {
        expect(labels[value as keyof typeof labels]).toBeTruthy();
      }
    }
  });
});
