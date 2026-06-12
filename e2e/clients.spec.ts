import { expect, test } from "@playwright/test";

// Bypass-mode smoke: there is no Supabase behind these runs, so the specs
// assert the page chrome (nav, header, states) rather than data.

test.describe("clients", () => {
  test("the sidebar links to the clients workspace", async ({ page }) => {
    await page.goto("/");
    const navLink = page.getByRole("link", { name: "Clients" });
    await expect(navLink).toBeVisible();
    await navLink.click();
    await expect(page).toHaveURL(/\/clients$/);
  });

  test("the clients page renders its header and filter bar", async ({ page }) => {
    await page.goto("/clients");
    await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
    await expect(page.getByPlaceholder(/search name, email/i)).toBeVisible();
  });
});
