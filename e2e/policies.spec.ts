import { expect, test } from "@playwright/test";

// Bypass-mode smoke: there is no Supabase behind these runs, so the specs
// assert the page chrome (nav, header, states) rather than data. Seeded-row
// visibility, per-role book scoping, and policy creation are covered by the
// pgTAP suite (supabase/tests/policies_test.sql) and the page unit tests
// (app/(app)/policies/page.test.tsx).

test.describe("policies", () => {
  test("the sidebar links to the policies workspace", async ({ page }) => {
    await page.goto("/");
    const navLink = page.getByRole("link", { name: "Policies" });
    await expect(navLink).toBeVisible();
    await navLink.click();
    await expect(page).toHaveURL(/\/policies$/);
  });

  test("the policies page renders its header and filter bar", async ({ page }) => {
    await page.goto("/policies");
    await expect(page.getByRole("heading", { name: "Policies" })).toBeVisible();
    await expect(page.getByPlaceholder(/search policy #/i)).toBeVisible();
    await expect(page.getByRole("combobox").first()).toBeVisible();
  });
});
