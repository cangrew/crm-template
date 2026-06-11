import { describe, expect, it } from "vitest";
import { NAV_GROUPS, pageTitleFor } from "./nav";

describe("NAV_GROUPS", () => {
  it("contains the core workspace and admin destinations", () => {
    const hrefs = NAV_GROUPS.flatMap((g) => g.items.map((it) => it.href));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/contacts");
    expect(hrefs).toContain("/documents");
    expect(hrefs).toContain("/settings/users");
  });
});

describe("pageTitleFor", () => {
  it("resolves nav labels for exact paths", () => {
    expect(pageTitleFor("/")).toBe("Dashboard");
    expect(pageTitleFor("/contacts")).toBe("Contacts");
  });

  it("applies title overrides", () => {
    expect(pageTitleFor("/settings/users")).toBe("User Management");
    expect(pageTitleFor("/account")).toBe("My Account");
  });

  it("falls back to the root segment for detail routes", () => {
    expect(pageTitleFor("/contacts/abc-123")).toBe("Contacts");
  });

  it("falls back to the raw segment for unknown routes", () => {
    expect(pageTitleFor("/nonexistent")).toBe("nonexistent");
  });
});
