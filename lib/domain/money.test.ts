import { describe, expect, it } from "vitest";
import { applyBps, roundHalfAwayFromZero } from "./money";

describe("roundHalfAwayFromZero", () => {
  it("rounds .5 away from zero in both directions", () => {
    expect(roundHalfAwayFromZero(2.5)).toBe(3);
    expect(roundHalfAwayFromZero(-2.5)).toBe(-3);
    expect(roundHalfAwayFromZero(2.4)).toBe(2);
    expect(roundHalfAwayFromZero(-2.4)).toBe(-2);
  });

  it("keeps integers untouched", () => {
    expect(roundHalfAwayFromZero(7)).toBe(7);
    expect(roundHalfAwayFromZero(-7)).toBe(-7);
    expect(roundHalfAwayFromZero(0)).toBe(0);
  });
});

describe("applyBps", () => {
  it("applies a basis-point share to an amount in cents", () => {
    expect(applyBps(10000, 8000)).toBe(8000); // 80% of $100.00
    expect(applyBps(2200, 5000)).toBe(1100); // 50% of $22.00
    expect(applyBps(12345, 10000)).toBe(12345); // 100%
    expect(applyBps(12345, 0)).toBe(0);
  });

  it("rounds half away from zero, symmetrically for negatives", () => {
    // 333 * 50% = 166.5 -> 167; chargebacks mirror exactly.
    expect(applyBps(333, 5000)).toBe(167);
    expect(applyBps(-333, 5000)).toBe(-167);
    // 125 * 33.33% = 41.6625 -> 42
    expect(applyBps(125, 3333)).toBe(42);
    expect(applyBps(-125, 3333)).toBe(-42);
  });
});
