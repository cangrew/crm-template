import { describe, expect, it } from "vitest";
import {
  AGENCY_STATUSES,
  AGENCY_STATUS_LABELS,
  AGENT_STATUSES,
  AGENT_STATUS_LABELS,
  APP_ROLES,
  APP_ROLE_LABELS,
  BUSINESS_TYPES,
  BUSINESS_TYPE_LABELS,
  CARRIER_STATUSES,
  CARRIER_STATUS_LABELS,
  CLIENT_STATUSES,
  CLIENT_STATUS_LABELS,
  POLICY_STATUSES,
  POLICY_STATUS_LABELS,
  RATE_TYPES,
  RATE_TYPE_LABELS,
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

  it("defines client statuses", () => {
    expect([...CLIENT_STATUSES]).toEqual(["prospect", "active", "inactive"]);
  });

  it("defines carrier statuses", () => {
    expect([...CARRIER_STATUSES]).toEqual(["active", "inactive"]);
  });

  it("defines rate types", () => {
    expect([...RATE_TYPES]).toEqual(["pmpm", "percent_of_premium"]);
  });

  it("defines business types", () => {
    expect([...BUSINESS_TYPES]).toEqual(["new_business", "renewal"]);
  });

  it("defines policy statuses in lifecycle order", () => {
    expect([...POLICY_STATUSES]).toEqual([
      "draft",
      "submitted",
      "active",
      "grace",
      "lapsed",
      "cancelled",
      "terminated",
      "renewed",
    ]);
  });
});

describe("label maps", () => {
  it("has a non-empty human label for every enum value", () => {
    const maps = [
      [APP_ROLES, APP_ROLE_LABELS],
      [AGENCY_STATUSES, AGENCY_STATUS_LABELS],
      [AGENT_STATUSES, AGENT_STATUS_LABELS],
      [BUSINESS_TYPES, BUSINESS_TYPE_LABELS],
      [CARRIER_STATUSES, CARRIER_STATUS_LABELS],
      [CLIENT_STATUSES, CLIENT_STATUS_LABELS],
      [POLICY_STATUSES, POLICY_STATUS_LABELS],
      [RATE_TYPES, RATE_TYPE_LABELS],
    ] as const;
    for (const [values, labels] of maps) {
      for (const value of values) {
        expect(labels[value as keyof typeof labels]).toBeTruthy();
      }
    }
  });
});
