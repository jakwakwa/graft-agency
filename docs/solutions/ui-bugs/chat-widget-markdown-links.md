---
title: "Chat widget assistant messages render markdown as plain text"
date: "2026-03-16"
category: "ui-bugs"
problem_type: "rendering"
component: "chat-widget"
tags:
  - "chat-widget"
  - "markdown"
  - "streamdown"
  - "ui"
---

## Problem

The chat widget's `MessageBubble` rendered assistant text with `{part.text}` as plain text, so markdown (including links like Cal.com booking URLs) was shown as raw `[text](url)` instead of clickable links. Users reported that booking confirmation links were "not totally showed" or displayed incorrectly.

### Symptoms

- Assistant messages displayed as plain text
- Markdown links (e.g. `[text](url)`) not clickable—shown as raw markdown
- Cal.com booking confirmation links not rendered or displayed correctly

## Root cause

The chat widget (`app/widget/[clientId]/_components/chat-widget.tsx`) rendered assistant text parts as plain text (`{part.text}`) instead of using a markdown renderer. The main app uses `Streamdown` in `components/ai-elements/message.tsx` for assistant content via `MessageResponse`, but the widget was built separately and never used it.

## Solution

### 1. Import Streamdown

```tsx
import { Streamdown } from "streamdown";
```

### 2. Render assistant text with Streamdown; keep user text plain

In `MessageBubble`, for `part.type === "text"`:

- **User messages:** render `part.text` as plain text.
- **Assistant messages:** wrap `part.text` in `<Streamdown>` so markdown (including links) is rendered.

### 3. Code change

```tsx
if (part.type === "text" && part.text) {
  return (
    <div
      key={`text-${part.text.slice(0, 20)}`}
      className={`rounded-2xl px-3 py-2 text-sm [&_a]:underline [&_a]:text-primary [&_a]:hover:opacity-80 ${
        isUser ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"
      }`}
    >
      {isUser ? (
        part.text
      ) : (
        <Streamdown className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{part.text}</Streamdown>
      )}
    </div>
  );
}
```

### 4. Styling

- Link styling: `[&_a]:underline [&_a]:text-primary [&_a]:hover:opacity-80` so links are underlined, use the primary colour, and dim on hover.
- Streamdown spacing: `[&>*:first-child]:mt-0 [&>*:last-child]:mb-0` to avoid extra vertical spacing inside the bubble.

### Summary

| Before | After |
|--------|-------|
| Assistant text: `{part.text}` (plain) | Assistant text: `<Streamdown>{part.text}</Streamdown>` |
| Links shown as raw URLs | Links rendered as clickable `<a>` elements |
| No link styling | `[&_a]:underline [&_a]:text-primary [&_a]:hover:opacity-80` |

## Prevention

### Reuse shared message renderer

- **Single source of truth:** All chat UIs (widget, dashboard, conversation) should render assistant text via `MessageResponse` from `@/components/ai-elements/message`.
- **No local markdown renderers:** Do not add new `Streamdown`, `ReactMarkdown`, or similar usage in chat UIs. Import and use `MessageResponse`.
- **Rule of thumb:** If a component renders AI-generated markdown, it must use `MessageResponse` (or a thin wrapper around it).

### Design system for chat bubbles

- Introduce a shared `AssistantBubble` that wraps `MessageResponse` for assistant text and applies shared bubble styles.
- Document in `docs/living-sop.md` or `components/ai-elements/README.md` that chat bubbles must use `MessageResponse` for assistant content.

### Governance rule

Add a rule: *"When adding or changing chat UIs that display AI-generated text, use `MessageResponse` from `@/components/ai-elements/message`. Do not introduce new Streamdown or ReactMarkdown usage for assistant messages."*

## Testing

### Playwright: links are rendered and clickable

```ts
test("renders markdown links as clickable anchor elements in assistant messages", async ({ page }) => {
  await page.goto(`/widget/${TEST_CLIENT_ID}`);

  const input = page.getByLabel("Chat message");
  await input.fill("Give me a link to example.com");
  await page.getByLabel("Send message").click();

  const assistantBubble = page.locator('[class*="rounded-bl-sm"][class*="bg-muted"]').first();
  await expect(assistantBubble).toBeVisible({ timeout: 30000 });

  const link = assistantBubble.locator("a[href]").first();
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", /.+/);
});
```

### Regression checklist

When changing chat UI or message rendering:

- [ ] Run the "markdown links as clickable" Playwright test.
- [ ] Manually send a message that includes `[text](url)` and confirm the link is clickable.
- [ ] Confirm no new `Streamdown` or `ReactMarkdown` usage was added for assistant messages.

## Related

- **`components/ai-elements/message.tsx`** — `MessageResponse` uses Streamdown with plugins (cjk, code, math, mermaid)
- **`components/ai-elements/reasoning.tsx`** — Uses Streamdown with same plugins
- **`docs/solutions/integration-issues/typescript-prisma-contract-drift-chatbot-stack-20260316.md`** — Related chat widget / AI stack context
- **`tests/e2e/widget-chat.spec.ts`** — Chat Widget E2E suite
