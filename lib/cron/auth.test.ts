import { describe, expect, it } from "vitest";
import { isAuthorizedCron } from "./auth";

describe("isAuthorizedCron", () => {
  it("accepts a matching Bearer token", () => {
    expect(isAuthorizedCron("Bearer s3cret", "s3cret")).toBe(true);
  });

  it("rejects a wrong token", () => {
    expect(isAuthorizedCron("Bearer nope", "s3cret")).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(isAuthorizedCron(null, "s3cret")).toBe(false);
  });

  it("rejects a bare token without the Bearer scheme", () => {
    expect(isAuthorizedCron("s3cret", "s3cret")).toBe(false);
  });

  it("rejects when no secret is configured", () => {
    expect(isAuthorizedCron("Bearer ", undefined)).toBe(false);
    expect(isAuthorizedCron("Bearer ", "")).toBe(false);
  });
});
