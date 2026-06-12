import { describe, expect, it } from "vitest";
import { NAV_GROUPS, pageTitleFor } from "./nav";

describe("NAV_GROUPS", () => {
  it("contains the core workspace and admin destinations", () => {
    const hrefs = NAV_GROUPS.flatMap((g) => g.items.map((it) => it.href));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/policies");
    expect(hrefs).toContain("/clients");
    expect(hrefs).toContain("/documents");
    expect(hrefs).toContain("/carriers");
    expect(hrefs).toContain("/statements");
    expect(hrefs).toContain("/settings/users");
  });

  it("places the Commissions group between Workspace and Agency", () => {
    const groups = NAV_GROUPS.map((g) => g.group);
    expect(groups.indexOf("Commissions")).toBe(groups.indexOf("Workspace") + 1);
    expect(groups.indexOf("Agency")).toBe(groups.indexOf("Commissions") + 1);
  });
});

describe("pageTitleFor", () => {
  it("resolves nav labels for exact paths", () => {
    expect(pageTitleFor("/")).toBe("Dashboard");
    expect(pageTitleFor("/clients")).toBe("Clients");
  });

  it("applies title overrides", () => {
    expect(pageTitleFor("/settings/users")).toBe("User Management");
    expect(pageTitleFor("/account")).toBe("My Account");
  });

  it("falls back to the root segment for detail routes", () => {
    expect(pageTitleFor("/clients/abc-123")).toBe("Clients");
  });

  it("falls back to the raw segment for unknown routes", () => {
    expect(pageTitleFor("/nonexistent")).toBe("nonexistent");
  });
});
