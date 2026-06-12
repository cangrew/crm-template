import { describe, expect, it } from "vitest";
import { bpsToPercentString, fmtBpsPercent, isValidPercentString, percentStringToBps } from "./bps";

describe("bps form helpers", () => {
  it("round-trips whole and fractional percentages", () => {
    expect(bpsToPercentString(8000)).toBe("80");
    expect(bpsToPercentString(8250)).toBe("82.5");
    expect(percentStringToBps("80")).toBe(8000);
    expect(percentStringToBps("82.5")).toBe(8250);
    expect(percentStringToBps("0.01")).toBe(1);
  });

  it("validates percent strings", () => {
    expect(isValidPercentString("0")).toBe(true);
    expect(isValidPercentString("100")).toBe(true);
    expect(isValidPercentString("82.5")).toBe(true);
    expect(isValidPercentString("82.55")).toBe(true);
    expect(isValidPercentString("100.01")).toBe(false);
    expect(isValidPercentString("-5")).toBe(false);
    expect(isValidPercentString("82.555")).toBe(false);
    expect(isValidPercentString("abc")).toBe(false);
    expect(isValidPercentString("")).toBe(false);
  });

  it("formats bps for display", () => {
    expect(fmtBpsPercent(8250)).toBe("82.5%");
    expect(fmtBpsPercent(0)).toBe("0%");
    expect(fmtBpsPercent(10000)).toBe("100%");
  });
});
