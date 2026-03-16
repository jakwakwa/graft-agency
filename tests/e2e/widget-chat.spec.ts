import { expect, test } from "@playwright/test";

const TEST_CLIENT_ID = "test-client-e2e";

test.describe("Chat Widget", () => {
  test("loads the widget page with greeting message", async ({ page }) => {
    await page.goto(`/widget/${TEST_CLIENT_ID}`);

    // Greeting should be visible when no messages exist
    const greeting = page.locator("text=How can I help you today");
    await expect(greeting).toBeVisible({ timeout: 10000 });
  });

  test("displays agent name from AgentConfig", async ({ page }) => {
    await page.goto(`/widget/${TEST_CLIENT_ID}`);

    // Header should show the agent name (or default)
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header).toContainText(/AI Assistant|[A-Z]/);
  });

  test("sends a message and receives a streamed response", async ({ page }) => {
    await page.goto(`/widget/${TEST_CLIENT_ID}`);

    const input = page.getByLabel("Chat message");
    await expect(input).toBeVisible();

    await input.fill("Hello, I need help");
    await page.getByLabel("Send message").click();

    // User message should appear
    await expect(page.getByText("Hello, I need help")).toBeVisible();

    // Should get an assistant response (may take a moment for streaming)
    const assistantMessages = page.locator('[class*="rounded-bl-sm"][class*="bg-muted"]');
    await expect(assistantMessages.first()).toBeVisible({ timeout: 30000 });
  });

  test("shows tool status pill during tool execution", async ({ page }) => {
    await page.goto(`/widget/${TEST_CLIENT_ID}`);

    const input = page.getByLabel("Chat message");
    await input.fill("My name is Test User and my email is test@example.com");
    await page.getByLabel("Send message").click();

    // Tool status pill should eventually appear (pending or complete)
    const toolStatus = page.locator("text=/Saving your details|Details saved|Checking|Working/");
    await expect(toolStatus.first()).toBeVisible({ timeout: 30000 });
  });

  test("persists messages across page refresh via sessionStorage", async ({ page }) => {
    await page.goto(`/widget/${TEST_CLIENT_ID}`);

    const input = page.getByLabel("Chat message");
    await input.fill("Persistence test message");
    await page.getByLabel("Send message").click();

    // Wait for the message to appear
    await expect(page.getByText("Persistence test message")).toBeVisible();

    // Reload the page
    await page.reload();

    // The message should still be visible after reload (hydrated from sessionStorage)
    await expect(page.getByText("Persistence test message")).toBeVisible({
      timeout: 5000,
    });
  });

  test("responds to 'When are you free?' with availability or helpful message", async ({ page }) => {
    await page.goto(`/widget/${TEST_CLIENT_ID}`);

    const input = page.getByLabel("Chat message");
    await expect(input).toBeVisible();
    await input.fill("When are you free?");
    await page.getByLabel("Send message").click();

    // User message should appear
    await expect(page.getByText("When are you free?")).toBeVisible();

    // Kona should respond — either with slot suggestions or a message about calendar config
    const assistantMessages = page.locator('[class*="rounded-bl-sm"][class*="bg-muted"]');
    await expect(assistantMessages.first()).toBeVisible({ timeout: 30000 });

    // Response should mention availability, slots, or calendar (or explain config is needed)
    const responseText = await assistantMessages.first().textContent();
    const hasRelevantResponse =
      /slot|available|calendar|book|time|schedule|configured|config/i.test(responseText ?? "") ||
      /\d{1,2}:\d{2}/.test(responseText ?? "");
    expect(hasRelevantResponse).toBe(true);
  });
});
