import { expect, test } from "@playwright/test";

// These run against the app with NEXT_PUBLIC_BYPASS_AUTH enabled, so the shell
// renders for a stub admin without a live Supabase session. They smoke-test the
// notification UI wiring; trigger fan-out, RLS, and muting are covered by the
// pgTAP suite (supabase/tests/*).

test.describe("notifications", () => {
  test("the bell opens the notification panel", async ({ page }) => {
    await page.goto("/");
    const bell = page.getByRole("button", { name: /notifications/i });
    await expect(bell).toBeVisible();
    await bell.click();
    await expect(page.getByRole("button", { name: /mark all read/i })).toBeVisible();
  });

  test("the preferences tab lists in-app notification toggles", async ({ page }) => {
    await page.goto("/account?tab=preferences");
    await expect(page.getByRole("heading", { name: /in-app notifications/i })).toBeVisible();
    await expect(page.getByText("New contact added")).toBeVisible();
  });
});
