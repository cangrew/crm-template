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
  LEDGER_ENTRY_KINDS,
  LEDGER_ENTRY_KIND_LABELS,
  LINE_KINDS,
  LINE_KIND_LABELS,
  MATCH_STATUSES,
  MATCH_STATUS_LABELS,
  PAYEE_TYPES,
  PAYEE_TYPE_LABELS,
  PAYOUT_STATUSES,
  PAYOUT_STATUS_LABELS,
  POLICY_STATUSES,
  POLICY_STATUS_LABELS,
  RATE_TYPES,
  RATE_TYPE_LABELS,
  STATEMENT_STATUSES,
  STATEMENT_STATUS_LABELS,
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

  it("defines statement statuses in lifecycle order", () => {
    expect([...STATEMENT_STATUSES]).toEqual(["draft", "matching", "posted", "void"]);
  });

  it("defines statement line kinds", () => {
    expect([...LINE_KINDS]).toEqual(["commission", "override", "adjustment"]);
  });

  it("defines match statuses", () => {
    expect([...MATCH_STATUSES]).toEqual(["unmatched", "auto_matched", "manual_matched", "ignored"]);
  });

  it("defines ledger entry kinds mirroring the commission engine", () => {
    expect([...LEDGER_ENTRY_KINDS]).toEqual([
      "agent_commission",
      "agency_commission",
      "house_commission",
      "agency_override",
      "house_override",
    ]);
  });

  it("defines payee types", () => {
    expect([...PAYEE_TYPES]).toEqual(["agent", "agency", "house"]);
  });

  it("defines payout statuses in lifecycle order", () => {
    expect([...PAYOUT_STATUSES]).toEqual(["open", "finalized", "paid"]);
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
      [LEDGER_ENTRY_KINDS, LEDGER_ENTRY_KIND_LABELS],
      [LINE_KINDS, LINE_KIND_LABELS],
      [MATCH_STATUSES, MATCH_STATUS_LABELS],
      [PAYEE_TYPES, PAYEE_TYPE_LABELS],
      [PAYOUT_STATUSES, PAYOUT_STATUS_LABELS],
      [POLICY_STATUSES, POLICY_STATUS_LABELS],
      [RATE_TYPES, RATE_TYPE_LABELS],
      [STATEMENT_STATUSES, STATEMENT_STATUS_LABELS],
    ] as const;
    for (const [values, labels] of maps) {
      for (const value of values) {
        expect(labels[value as keyof typeof labels]).toBeTruthy();
      }
    }
  });
});
