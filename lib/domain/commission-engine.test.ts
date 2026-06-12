import { describe, expect, it } from "vitest";
import { allocateLine, type AllocationInput, type LedgerEntryDraft } from "./commission-engine";

const HARBOR = { id: "agency-1", commissionCutBps: 5000, overrideCutBps: 3000 };
const ANDY = { id: "agent-1", commissionSplitBps: 8000, agencyId: "agency-1" };
const DINA = { id: "agent-2", commissionSplitBps: 7500, agencyId: null };

function total(entries: LedgerEntryDraft[]): number {
  return entries.reduce((sum, e) => sum + e.amountCents, 0);
}

function byKind(entries: LedgerEntryDraft[], kind: LedgerEntryDraft["entryKind"]) {
  return entries.find((e) => e.entryKind === kind);
}

describe("allocateLine — commission through an agency", () => {
  const input: AllocationInput = {
    amountCents: 10000,
    lineKind: "commission",
    agent: ANDY,
    agency: HARBOR,
  };

  it("splits agent share first, then the remainder between agency and house", () => {
    const entries = allocateLine(input);
    // $100.00: agent 80% = $80.00; remainder $20.00 splits 50/50.
    expect(byKind(entries, "agent_commission")).toMatchObject({
      payeeType: "agent",
      agentId: "agent-1",
      amountCents: 8000,
      appliedBps: 8000,
    });
    expect(byKind(entries, "agency_commission")).toMatchObject({
      payeeType: "agency",
      agencyId: "agency-1",
      amountCents: 1000,
      appliedBps: 5000,
    });
    expect(byKind(entries, "house_commission")).toMatchObject({
      payeeType: "house",
      amountCents: 1000,
    });
    expect(total(entries)).toBe(10000);
  });

  it("gives the house the rounding residual so entries always sum to the input", () => {
    // $3.33: agent 80% = 266.4 -> 266; remainder 67; agency 50% = 33.5 -> 34
    // (half away from zero); house takes 67 - 34 = 33.
    const entries = allocateLine({ ...input, amountCents: 333 });
    expect(byKind(entries, "agent_commission")!.amountCents).toBe(266);
    expect(byKind(entries, "agency_commission")!.amountCents).toBe(34);
    expect(byKind(entries, "house_commission")!.amountCents).toBe(33);
    expect(total(entries)).toBe(333);
  });

  it("reverses chargebacks symmetrically (negative input mirrors positive)", () => {
    const pos = allocateLine({ ...input, amountCents: 333 });
    const neg = allocateLine({ ...input, amountCents: -333 });
    expect(neg.map((e) => ({ kind: e.entryKind, cents: e.amountCents }))).toEqual(
      pos.map((e) => ({ kind: e.entryKind, cents: -e.amountCents })),
    );
    expect(total(neg)).toBe(-333);
  });

  it("sums exactly to the input across awkward amounts (property check)", () => {
    for (const amount of [1, -1, 7, 99, 101, 12345, -12345, 99999, 1000001, -333333]) {
      expect(total(allocateLine({ ...input, amountCents: amount }))).toBe(amount);
    }
  });

  it("drops zero-amount entries", () => {
    const entries = allocateLine({
      amountCents: 10000,
      lineKind: "commission",
      agent: { ...ANDY, commissionSplitBps: 10000 },
      agency: HARBOR,
    });
    // Agent takes 100%; no agency or house entries remain.
    expect(entries).toHaveLength(1);
    expect(entries[0].entryKind).toBe("agent_commission");
  });

  it("returns no entries for a zero amount", () => {
    expect(allocateLine({ ...input, amountCents: 0 })).toEqual([]);
  });
});

describe("allocateLine — commission for a direct (house) agent", () => {
  it("splits agent vs house only", () => {
    const entries = allocateLine({
      amountCents: 10000,
      lineKind: "commission",
      agent: DINA,
      agency: null,
    });
    expect(byKind(entries, "agent_commission")!.amountCents).toBe(7500);
    expect(byKind(entries, "house_commission")!.amountCents).toBe(2500);
    expect(byKind(entries, "agency_commission")).toBeUndefined();
    expect(total(entries)).toBe(10000);
  });
});

describe("allocateLine — overrides", () => {
  it("splits an override between the agency cut and the house", () => {
    const entries = allocateLine({
      amountCents: 5000,
      lineKind: "override",
      agent: ANDY,
      agency: HARBOR,
    });
    // $50.00 override: agency 30% = $15.00, house $35.00; no agent share.
    expect(byKind(entries, "agency_override")).toMatchObject({
      agencyId: "agency-1",
      amountCents: 1500,
      appliedBps: 3000,
    });
    expect(byKind(entries, "house_override")!.amountCents).toBe(3500);
    expect(byKind(entries, "agent_commission")).toBeUndefined();
    expect(total(entries)).toBe(5000);
  });

  it("sends the whole override to the house for a direct agent", () => {
    const entries = allocateLine({
      amountCents: 5000,
      lineKind: "override",
      agent: DINA,
      agency: null,
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ entryKind: "house_override", amountCents: 5000 });
  });

  it("reverses an override chargeback symmetrically", () => {
    const entries = allocateLine({
      amountCents: -5000,
      lineKind: "override",
      agent: ANDY,
      agency: HARBOR,
    });
    expect(byKind(entries, "agency_override")!.amountCents).toBe(-1500);
    expect(byKind(entries, "house_override")!.amountCents).toBe(-3500);
    expect(total(entries)).toBe(-5000);
  });
});

describe("allocateLine — adjustments", () => {
  it("flows adjustments through the commission split", () => {
    const entries = allocateLine({
      amountCents: -1200,
      lineKind: "adjustment",
      agent: ANDY,
      agency: HARBOR,
    });
    expect(byKind(entries, "agent_commission")!.amountCents).toBe(-960);
    expect(total(entries)).toBe(-1200);
  });
});

describe("allocateLine — input validation", () => {
  it("rejects a fractional amount", () => {
    expect(() =>
      allocateLine({ amountCents: 10.5, lineKind: "commission", agent: ANDY, agency: HARBOR }),
    ).toThrow(/integer/i);
  });

  it("rejects an agency mismatch with the agent's agency_id", () => {
    expect(() =>
      allocateLine({
        amountCents: 100,
        lineKind: "commission",
        agent: ANDY,
        agency: { ...HARBOR, id: "agency-other" },
      }),
    ).toThrow(/agency/i);
  });

  it("rejects an agency-bound agent allocated without their agency", () => {
    expect(() =>
      allocateLine({ amountCents: 100, lineKind: "commission", agent: ANDY, agency: null }),
    ).toThrow(/agency/i);
  });
});
