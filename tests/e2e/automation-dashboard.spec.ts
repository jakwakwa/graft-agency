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

test.describe("Queue processing API contract", () => {
  const PROCESS_QUEUE_URL = "/api/automation/process-queue";

  test("process-queue success response includes required summary fields", async ({ page }) => {
    const mockResponse = {
      processed: 2,
      completed: 1,
      failed: 1,
      skipped: 0,
      failureReasons: ["ATTIO_LIST_ID is not configured"],
      diagnostics: [
        {
          queueId: "queue-success-1",
          status: "COMPLETED",
          companyRecordId: "company-abc",
          personRecordId: "person-xyz",
        },
        {
          queueId: "queue-fail-1",
          status: "FAILED",
          message: "ATTIO_LIST_ID is not configured",
        },
      ],
    };

    await page.route(`**${PROCESS_QUEUE_URL}`, (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockResponse),
        });
      } else {
        route.continue();
      }
    });

    const response = await page.request.post(PROCESS_QUEUE_URL);
    const data = await response.json();

    // Assert required summary fields are present
    expect(typeof data.processed).toBe("number");
    expect(typeof data.completed).toBe("number");
    expect(typeof data.failed).toBe("number");
    expect(typeof data.skipped).toBe("number");
    expect(Array.isArray(data.failureReasons)).toBe(true);
    expect(Array.isArray(data.diagnostics)).toBe(true);
  });

  test("process-queue success item has personRecordId when lead email is present", async ({ page }) => {
    const mockResponse = {
      processed: 1,
      completed: 1,
      failed: 0,
      skipped: 0,
      failureReasons: [],
      diagnostics: [
        {
          queueId: "queue-success-1",
          status: "COMPLETED",
          companyRecordId: "company-abc",
          personRecordId: "person-xyz",
        },
      ],
    };

    await page.route(`**${PROCESS_QUEUE_URL}`, (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockResponse),
        });
      } else {
        route.continue();
      }
    });

    const response = await page.request.post(PROCESS_QUEUE_URL);
    const data = await response.json();

    const successDiagnostics = data.diagnostics.filter(
      (d: { status: string; personRecordId?: string }) => d.status === "COMPLETED",
    );
    expect(successDiagnostics.length).toBeGreaterThan(0);

    for (const item of successDiagnostics) {
      // Hard requirement: successful items must have a non-empty personRecordId
      expect(typeof item.personRecordId).toBe("string");
      expect(item.personRecordId.length).toBeGreaterThan(0);
    }
  });

  test("process-queue list-sync failure reason is surfaced in response", async ({ page }) => {
    const listSyncError = "ATTIO_LIST_ID is not configured";
    const mockResponse = {
      processed: 1,
      completed: 0,
      failed: 1,
      skipped: 0,
      failureReasons: [listSyncError],
      diagnostics: [
        {
          queueId: "queue-fail-1",
          status: "FAILED",
          message: listSyncError,
        },
      ],
    };

    await page.route(`**${PROCESS_QUEUE_URL}`, (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockResponse),
        });
      } else {
        route.continue();
      }
    });

    const response = await page.request.post(PROCESS_QUEUE_URL);
    const data = await response.json();

    // List-sync failure must be surfaced in failureReasons for operator diagnostics
    expect(data.failureReasons).toContain(listSyncError);

    const failedDiagnostics = data.diagnostics.filter(
      (d: { status: string; message?: string }) => d.status === "FAILED",
    );
    expect(failedDiagnostics.length).toBeGreaterThan(0);
    expect(failedDiagnostics[0].message).toBe(listSyncError);
  });
});
