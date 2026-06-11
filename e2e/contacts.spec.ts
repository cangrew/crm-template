import { expect, test } from "@playwright/test";

// EXAMPLE ENTITY — safe to delete; see README "Removing the example entity".
// Bypass-mode smoke: there is no Supabase behind these runs, so the specs
// assert the page chrome (nav, header, states) rather than data.

test.describe("contacts", () => {
  test("the sidebar links to the contacts workspace", async ({ page }) => {
    await page.goto("/");
    const navLink = page.getByRole("link", { name: "Contacts" });
    await expect(navLink).toBeVisible();
    await navLink.click();
    await expect(page).toHaveURL(/\/contacts$/);
  });

  test("the contacts page renders its header and filter bar", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();
    await expect(page.getByPlaceholder(/search name, company/i)).toBeVisible();
  });
});
