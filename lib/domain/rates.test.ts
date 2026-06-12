import { describe, expect, it } from "vitest";
import { expectedCommissionCents, pickRate, type RateScheduleLike } from "./rates";

function schedule(overrides: Partial<RateScheduleLike> = {}): RateScheduleLike {
  return {
    id: "r1",
    carrier_id: "carrier-1",
    rate_type: "pmpm",
    business_type: "new_business",
    pmpm_cents: 2200,
    percent_bps: null,
    effective_from: "2026-01-01",
    effective_to: null,
    state: null,
    ...overrides,
  };
}

describe("pickRate", () => {
  it("selects the schedule whose effective window contains the period", () => {
    const old = schedule({ id: "old", effective_from: "2025-01-01", effective_to: "2025-12-31" });
    const current = schedule({ id: "current", effective_from: "2026-01-01" });
    expect(
      pickRate([old, current], { businessType: "new_business", periodMonth: "2026-03-01" })?.id,
    ).toBe("current");
    expect(
      pickRate([old, current], { businessType: "new_business", periodMonth: "2025-06-01" })?.id,
    ).toBe("old");
  });

  it("treats the window as inclusive on both ends", () => {
    const r = schedule({ effective_from: "2026-01-01", effective_to: "2026-06-30" });
    expect(pickRate([r], { businessType: "new_business", periodMonth: "2026-01-01" })?.id).toBe(
      "r1",
    );
    expect(pickRate([r], { businessType: "new_business", periodMonth: "2026-06-30" })?.id).toBe(
      "r1",
    );
    expect(pickRate([r], { businessType: "new_business", periodMonth: "2026-07-01" })).toBeNull();
  });

  it("filters by business type", () => {
    const renewal = schedule({ id: "ren", business_type: "renewal", pmpm_cents: 1100 });
    const newBiz = schedule({ id: "new" });
    expect(
      pickRate([renewal, newBiz], { businessType: "renewal", periodMonth: "2026-02-01" })?.id,
    ).toBe("ren");
  });

  it("prefers a state-specific schedule over the catch-all", () => {
    const all = schedule({ id: "all" });
    const fl = schedule({ id: "fl", state: "FL" });
    expect(
      pickRate([all, fl], { businessType: "new_business", periodMonth: "2026-02-01", state: "FL" })
        ?.id,
    ).toBe("fl");
    expect(
      pickRate([all, fl], { businessType: "new_business", periodMonth: "2026-02-01", state: "TX" })
        ?.id,
    ).toBe("all");
    // No state given: state-specific schedules are ignored.
    expect(
      pickRate([all, fl], { businessType: "new_business", periodMonth: "2026-02-01" })?.id,
    ).toBe("all");
  });

  it("returns null when nothing matches", () => {
    expect(pickRate([], { businessType: "renewal", periodMonth: "2026-01-01" })).toBeNull();
  });

  it("throws on ambiguous overlapping schedules", () => {
    const a = schedule({ id: "a" });
    const b = schedule({ id: "b", effective_from: "2025-06-01" });
    expect(() =>
      pickRate([a, b], { businessType: "new_business", periodMonth: "2026-02-01" }),
    ).toThrow(/ambiguous/i);
  });
});

describe("expectedCommissionCents", () => {
  it("computes PMPM as rate times member count", () => {
    expect(expectedCommissionCents(schedule(), { memberCount: 3, premiumCents: 90000 })).toBe(6600);
  });

  it("computes percent-of-premium against the premium", () => {
    const pct = schedule({ rate_type: "percent_of_premium", pmpm_cents: null, percent_bps: 500 });
    expect(expectedCommissionCents(pct, { memberCount: 3, premiumCents: 90000 })).toBe(4500);
  });

  it("rounds percent results half away from zero", () => {
    const pct = schedule({ rate_type: "percent_of_premium", pmpm_cents: null, percent_bps: 333 });
    // 12345 * 3.33% = 411.0885 -> 411
    expect(expectedCommissionCents(pct, { memberCount: 1, premiumCents: 12345 })).toBe(411);
  });
});
