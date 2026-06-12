import { describe, expect, it } from "vitest";
import {
  fmtDateShort,
  fmtMoneyCents,
  fmtMonth,
  fmtPct,
  fmtRelativeTime,
  fmtUSD,
  initials,
} from "./format";

describe("fmtMonth", () => {
  it("renders a period_month date as 'Month YYYY'", () => {
    expect(fmtMonth("2026-05-01")).toBe("May 2026");
    expect(fmtMonth("2025-12-01")).toBe("December 2025");
  });

  it("accepts a bare year-month input", () => {
    expect(fmtMonth("2026-01")).toBe("January 2026");
  });

  it("returns an em dash for null, undefined, or junk", () => {
    expect(fmtMonth(null)).toBe("—");
    expect(fmtMonth(undefined)).toBe("—");
    expect(fmtMonth("not-a-date")).toBe("—");
    expect(fmtMonth("2026-13-01")).toBe("—");
  });
});

describe("fmtUSD", () => {
  it("prefixes a dollar sign and inserts thousands separators", () => {
    expect(fmtUSD(2850)).toBe("$2,850");
    expect(fmtUSD(0)).toBe("$0");
    expect(fmtUSD(1_234_567)).toBe("$1,234,567");
  });
});

describe("fmtMoneyCents", () => {
  it("always shows two decimal places with separators", () => {
    expect(fmtMoneyCents(2850)).toBe("$2,850.00");
    expect(fmtMoneyCents(1234.5)).toBe("$1,234.50");
    expect(fmtMoneyCents(0)).toBe("$0.00");
  });

  it("wraps negative amounts in parentheses (accounting style)", () => {
    expect(fmtMoneyCents(-860)).toBe("($860.00)");
    expect(fmtMoneyCents(-1234.56)).toBe("($1,234.56)");
  });
});

describe("fmtPct", () => {
  it("renders a fraction as a percentage", () => {
    expect(fmtPct(0.08)).toBe("8%");
    expect(fmtPct(0.125)).toBe("12.5%");
    expect(fmtPct(0)).toBe("0%");
  });
});

describe("fmtDateShort", () => {
  it("returns em dash placeholder for null/undefined", () => {
    expect(fmtDateShort(null)).toBe("—");
    expect(fmtDateShort(undefined)).toBe("—");
  });

  it("strips the year prefix from an ISO date", () => {
    expect(fmtDateShort("2026-05-28")).toBe("05-28");
    expect(fmtDateShort("2026-12-01")).toBe("12-01");
  });
});

describe("fmtRelativeTime", () => {
  const now = Date.parse("2026-05-29T12:00:00Z");

  it("returns an empty string for falsy input", () => {
    expect(fmtRelativeTime(null, now)).toBe("");
    expect(fmtRelativeTime(undefined, now)).toBe("");
  });

  it("shows 'just now' for the last minute", () => {
    expect(fmtRelativeTime("2026-05-29T11:59:30Z", now)).toBe("just now");
  });

  it("counts minutes, hours, and days for recent times", () => {
    expect(fmtRelativeTime("2026-05-29T11:45:00Z", now)).toBe("15m ago");
    expect(fmtRelativeTime("2026-05-29T09:00:00Z", now)).toBe("3h ago");
    expect(fmtRelativeTime("2026-05-27T12:00:00Z", now)).toBe("2d ago");
  });

  it("falls back to a short date past a week", () => {
    expect(fmtRelativeTime("2026-05-01T12:00:00Z", now)).toBe("05-01");
  });
});

describe("initials", () => {
  it("returns ? for falsy names", () => {
    expect(initials(null)).toBe("?");
    expect(initials(undefined)).toBe("?");
    expect(initials("")).toBe("?");
  });

  it("takes up to two leading letters and uppercases them", () => {
    expect(initials("Dana Whitlock")).toBe("DW");
    expect(initials("helen ortiz")).toBe("HO");
    expect(initials("Single")).toBe("S");
    expect(initials("Three Word Name")).toBe("TW");
  });
});
