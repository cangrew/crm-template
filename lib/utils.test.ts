import { describe, expect, it } from "vitest";
import { assertNever, cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("dedupes conflicting tailwind classes, keeping the last", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("assertNever", () => {
  it("throws with the unexpected value for exhaustiveness violations", () => {
    expect(() => assertNever("surprise" as never)).toThrowError(/Unexpected value: surprise/);
  });
});
