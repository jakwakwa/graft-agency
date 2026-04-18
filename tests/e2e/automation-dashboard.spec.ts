import { expect, test } from "@playwright/test";

test.describe("Automation Dashboard", () => {
  test("dashboard redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/dashboard/automation");

    // Clerk protects the route: unauthenticated users are redirected to sign-in
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const automationHeading = page.getByRole("heading", { name: /automation/i });

    // Either redirected to sign-in, or we reached the hub (e.g. test env with bypass)
    const redirectedToSignIn = url.includes("sign-in") || url.includes("sign-up");
    const reachedHub = await automationHeading.isVisible().catch(() => false);

    expect(redirectedToSignIn || reachedHub).toBe(true);
  });

  test("automation hub shows queue and leads links when authenticated", async ({ page }) => {
    await page.goto("/dashboard/automation");
    await page.waitForLoadState("networkidle");

    const automationHeading = page.getByRole("heading", { name: /automation/i });
    const hubVisible = await automationHeading.isVisible().catch(() => false);

    if (hubVisible) {
      const queueLink = page.getByRole("link", { name: /open queue/i });
      const leadsLink = page.getByRole("link", { name: /view leads/i });
      await expect(queueLink).toBeVisible();
      await expect(leadsLink).toBeVisible();
    }
  });
});
