import { describe, expect, it } from "vitest";
import { isAuthBypassEnabled } from "./bypass";

describe("isAuthBypassEnabled", () => {
  it("is on for local/dev when the flag is set", () => {
    expect(isAuthBypassEnabled({ NEXT_PUBLIC_BYPASS_AUTH: "1", NODE_ENV: "development" })).toBe(
      true,
    );
    expect(isAuthBypassEnabled({ NEXT_PUBLIC_BYPASS_AUTH: "1", NODE_ENV: "test" })).toBe(true);
  });

  it("is OFF in a production build by default, even if the flag leaks in", () => {
    expect(isAuthBypassEnabled({ NEXT_PUBLIC_BYPASS_AUTH: "1", NODE_ENV: "production" })).toBe(
      false,
    );
  });

  it("allows the E2E opt-in to bypass on a production build (Playwright next start)", () => {
    expect(
      isAuthBypassEnabled({
        NEXT_PUBLIC_BYPASS_AUTH: "1",
        NODE_ENV: "production",
        NEXT_PUBLIC_E2E: "1",
      }),
    ).toBe(true);
  });

  it("the E2E opt-in alone does nothing without the base flag", () => {
    expect(isAuthBypassEnabled({ NEXT_PUBLIC_E2E: "1", NODE_ENV: "production" })).toBe(false);
  });

  it("is off when the flag is unset or not exactly '1'", () => {
    expect(isAuthBypassEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(isAuthBypassEnabled({ NEXT_PUBLIC_BYPASS_AUTH: "true", NODE_ENV: "development" })).toBe(
      false,
    );
    expect(isAuthBypassEnabled({ NEXT_PUBLIC_BYPASS_AUTH: "0", NODE_ENV: "development" })).toBe(
      false,
    );
  });
});
