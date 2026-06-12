import { describe, expect, it } from "vitest";
import {
  matchLine,
  parseAmountCents,
  parseStatementCsv,
  type MatchCandidate,
  type ParsedStatementLine,
} from "./statement-matching";

function candidate(overrides: Partial<MatchCandidate> = {}): MatchCandidate {
  return {
    policyId: "pol-1",
    policyNumber: "AMB-001",
    carrierMemberId: "M-100",
    clientFirstName: "Ada",
    clientLastName: "Lovelace",
    clientDob: "1990-12-10",
    ...overrides,
  };
}

function line(overrides: Partial<ParsedStatementLine> = {}): ParsedStatementLine {
  return {
    rowIndex: 0,
    policyNumber: null,
    carrierMemberId: null,
    subscriberName: null,
    subscriberDob: null,
    memberCount: null,
    premiumCents: null,
    amountCents: 2200,
    raw: {},
    ...overrides,
  };
}

describe("matchLine precedence", () => {
  const candidates = [
    candidate(),
    candidate({
      policyId: "pol-2",
      policyNumber: "AMB-002",
      carrierMemberId: "M-200",
      clientFirstName: "Grace",
      clientLastName: "Hopper",
      clientDob: "1985-12-09",
    }),
  ];

  it("matches on policy number first", () => {
    const result = matchLine(
      line({ policyNumber: "amb-002", carrierMemberId: "M-100" }),
      candidates,
    );
    // Policy number wins even when the member id points elsewhere.
    expect(result).toEqual({ status: "auto_matched", policyId: "pol-2", reason: "policy_number" });
  });

  it("normalizes case and whitespace on policy numbers", () => {
    const result = matchLine(line({ policyNumber: "  AMB-001 " }), candidates);
    expect(result).toEqual({ status: "auto_matched", policyId: "pol-1", reason: "policy_number" });
  });

  it("falls back to carrier member id", () => {
    const result = matchLine(line({ carrierMemberId: "m-200" }), candidates);
    expect(result).toEqual({ status: "auto_matched", policyId: "pol-2", reason: "member_id" });
  });

  it("suggests (but does not auto-match) on name + DOB", () => {
    const result = matchLine(
      line({ subscriberName: "LOVELACE, ADA", subscriberDob: "1990-12-10" }),
      candidates,
    );
    expect(result).toEqual({
      status: "unmatched",
      suggestion: { policyId: "pol-1", reason: "name_dob" },
    });
  });

  it("also handles 'First Last' name order in the fallback", () => {
    const result = matchLine(
      line({ subscriberName: "Grace Hopper", subscriberDob: "1985-12-09" }),
      candidates,
    );
    expect(result).toEqual({
      status: "unmatched",
      suggestion: { policyId: "pol-2", reason: "name_dob" },
    });
  });

  it("returns plain unmatched when nothing fits", () => {
    expect(matchLine(line({ policyNumber: "ZZZ-999" }), candidates)).toEqual({
      status: "unmatched",
    });
  });

  it("does not auto-match an ambiguous policy number", () => {
    const dupes = [candidate(), candidate({ policyId: "pol-dupe" })];
    expect(matchLine(line({ policyNumber: "AMB-001" }), dupes)).toEqual({ status: "unmatched" });
  });
});

describe("parseAmountCents", () => {
  it("parses dollars-and-cents strings", () => {
    expect(parseAmountCents("22.00")).toBe(2200);
    expect(parseAmountCents("$1,234.56")).toBe(123456);
    expect(parseAmountCents("0.01")).toBe(1);
  });

  it("parses negatives in minus and accounting styles", () => {
    expect(parseAmountCents("-22.00")).toBe(-2200);
    expect(parseAmountCents("($86.00)")).toBe(-8600);
    expect(parseAmountCents("(1,000.50)")).toBe(-100050);
  });

  it("returns null for blanks and garbage", () => {
    expect(parseAmountCents("")).toBeNull();
    expect(parseAmountCents("n/a")).toBeNull();
  });
});

describe("parseStatementCsv", () => {
  const mapping = {
    policy_number: "Policy ID",
    carrier_member_id: "Member ID",
    subscriber_name: "Subscriber",
    subscriber_dob: "DOB",
    member_count: "Members",
    premium: "Premium",
    amount: "Commission Paid",
  };

  it("applies the carrier mapping and normalizes values", () => {
    const rows = [
      {
        "Policy ID": " AMB-001 ",
        "Member ID": "M-100",
        Subscriber: "Lovelace, Ada",
        DOB: "12/10/1990",
        Members: "3",
        Premium: "$900.00",
        "Commission Paid": "$66.00",
      },
    ];
    const [parsed] = parseStatementCsv(rows, mapping);
    expect(parsed).toMatchObject({
      rowIndex: 0,
      policyNumber: "AMB-001",
      carrierMemberId: "M-100",
      subscriberName: "Lovelace, Ada",
      subscriberDob: "1990-12-10",
      memberCount: 3,
      premiumCents: 90000,
      amountCents: 6600,
    });
    expect(parsed.raw).toEqual(rows[0]);
  });

  it("parses chargeback rows with negative amounts", () => {
    const rows = [{ "Policy ID": "AMB-002", "Commission Paid": "($22.00)" }];
    const [parsed] = parseStatementCsv(rows, mapping);
    expect(parsed.amountCents).toBe(-2200);
  });

  it("skips rows with no parseable amount", () => {
    const rows = [
      { "Policy ID": "AMB-001", "Commission Paid": "" },
      { "Policy ID": "AMB-002", "Commission Paid": "$10.00" },
    ];
    const parsed = parseStatementCsv(rows, mapping);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].rowIndex).toBe(1);
  });

  it("accepts ISO dates as-is and leaves unparseable dates null", () => {
    const rows = [
      { "Policy ID": "A", DOB: "1990-12-10", "Commission Paid": "1.00" },
      { "Policy ID": "B", DOB: "not a date", "Commission Paid": "1.00" },
    ];
    const parsed = parseStatementCsv(rows, mapping);
    expect(parsed[0].subscriberDob).toBe("1990-12-10");
    expect(parsed[1].subscriberDob).toBeNull();
  });
});
