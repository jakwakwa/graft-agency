---
module: Chatbot Stack
date: 2026-03-16
problem_type: integration_issue
component: assistant
symptoms:
  - "`prisma.agentConfig.findUnique(...)` and `prisma.conversation.findFirst(...)` failed with \"This expression is not callable\" because the Prisma singleton was inferred as incompatible client shapes."
  - "`components/ai-elements/prompt-input.tsx` raised Base UI event contract errors such as `Type '(e: Event) => void' is not assignable to type '(event: BaseUIEvent<...>) => void'`."
  - "`PromptInputHoverCard` used `openDelay` on the wrong wrapper surface and failed with `Property 'openDelay' does not exist on type 'Props<unknown>'`."
  - "`bun run build` later failed at the route boundary with `Type 'UIMessage<...>[]' is not assignable to type 'InputJsonValue'` when persisting chat messages."
root_cause: wrong_api
resolution_type: code_fix
severity: high
tags: [typescript, prisma, ai-sdk, base-ui, chat-widget]
---

# Troubleshooting: TypeScript And Prisma Contract Drift In The Chatbot Stack

## Problem
The initial chatbot implementation spanned Next.js route handlers, AI SDK tools, Prisma persistence, and Base UI wrappers, but several of those boundaries were typed against assumptions rather than the real upstream APIs. The result was a mix of IDE TypeScript failures, broken runtime contracts, and build errors that only surfaced once the full stack was wired together.

## Environment
- Module: Chatbot Stack
- Stage: Stage 0
- OS: darwin 25.4.0
- Affected Component: Assistant/chat route, Prisma singleton, widget prompt input, and conversation persistence
- Key files: `app/api/chat/route.ts`, `lib/db/prisma.ts`, `lib/services/agent.service.ts`, `lib/services/conversation.service.ts`, `components/ai-elements/prompt-input.tsx`, `components/ai-elements/jsx-preview.tsx`
- Date: 2026-03-16

## Symptoms
- Prisma delegate methods became effectively unusable in TypeScript with errors like `This expression is not callable`.
- Base UI menu handlers and hover-card wrappers failed type-checking because the local wrappers used plain DOM events and the wrong timing props.
- The AI tool layer had a hidden runtime bug: the knowledge-search tool only passed `{ query }`, while the service still required a client-aware call path.
- `bun run build` failed after the first wave of fixes because `UIMessage[]` was being written directly into a Prisma JSON field without a serialisation boundary.
- A later review exposed a tenant-isolation hole in conversation persistence: `sessionId` alone was enough to update or read another tenant's conversation.

## What Didn't Work

**Attempted Solution 1:** Fix only the visible IDE diagnostics in the UI wrappers.
- **Why it failed:** The wrapper fixes removed the first layer of noise, but `bun run build` still surfaced hidden contract problems at the route and Prisma boundaries.

**Attempted Solution 2:** Let TypeScript infer a single Prisma singleton shape from a mixed Accelerate/non-Accelerate factory.
- **Why it failed:** The singleton still collapsed into incompatible client signatures. Prisma delegates remained uncallable until the boundary was made explicit.

**Attempted Solution 3:** Treat AI SDK `finalMessages` as directly assignable to Prisma JSON.
- **Why it failed:** The route compiled only after adding an explicit serialisation boundary from UI messages into `Prisma.InputJsonValue`.

## Solution
The fix was to harden every cross-library boundary instead of trying to silence individual errors.

**Code changes**:

```ts
// Before: Base UI handler guessed as a DOM Event
const handleSelect = useCallback((event: Event) => {
  onSelect?.(event);
}, [onSelect]);

// After: derive the event type from the wrapped component
type DropdownMenuItemSelectEvent =
  Parameters<NonNullable<ComponentProps<typeof DropdownMenuItem>["onSelect"]>>[0];

const handleSelect = useCallback((event: DropdownMenuItemSelectEvent) => {
  onSelect?.(event);
}, [onSelect]);
```

```ts
// Before: mixed client shapes caused delegate signatures to become incompatible
const prismaClientSingleton = () => {
  if (databaseUrl.startsWith("prisma://")) {
    return new PrismaClient(...).$extends(withAccelerate());
  }

  return new PrismaClient(...);
};

// After: force one stable exported singleton type
type PrismaClientSingleton = PrismaClient;

const prismaClientSingleton = (): PrismaClientSingleton => {
  if (databaseUrl.startsWith("prisma://")) {
    return new PrismaClient(...).$extends(withAccelerate()) as unknown as PrismaClientSingleton;
  }

  return new PrismaClient(...);
};
```

```ts
// Before: tool contract lost tenant context
execute: async (input) => {
  return await agentService.searchKnowledge(input);
}

// After: tools are built per request and close over clientId
export const createSearchKnowledgeBaseTool = (clientId: string) =>
  tool({
    inputSchema: z.object({ query: z.string().trim().min(1) }),
    execute: async (input) => {
      return await agentService.searchKnowledge({ clientId, ...input });
    },
  });
```

```ts
// Before: route wrote UIMessage[] directly to Prisma JSON
await conversationService.save({
  clientId,
  sessionId,
  messages: finalMessages,
});

// After: normalise messages at the route boundary
const toPrismaJson = (value: UIMessage[]): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

await conversationService.save({
  clientId,
  sessionId,
  messages: toPrismaJson(finalMessages),
});
```

```ts
// Before: conversation records were keyed only by sessionId
await prisma.conversation.upsert({
  where: { sessionId: input.sessionId },
  ...
});

// After: verify client ownership before update/read
const existingConversation = await prisma.conversation.findUnique({
  where: { sessionId: input.sessionId },
  select: { clientId: true },
});

if (existingConversation && existingConversation.clientId !== input.clientId) {
  throw new Error(`Conversation session "${input.sessionId}" belongs to a different client`);
}
```

**Commands run**:

```bash
bun run test -- tests/unit/services/agent.service.test.ts tests/unit/services/conversation.service.test.ts tests/unit/ai/tools/search-knowledge.test.ts tests/unit/api/chat.route.test.ts
bun run lint
bun run build
```

## Why This Works
The root cause was contract drift across library boundaries:

1. Local wrappers were typed against guessed DOM events and props instead of the actual Base UI component contracts.
2. The Prisma singleton mixed extended and unextended clients, which produced incompatible delegate signatures under TypeScript.
3. The AI tool layer hid required app state (`clientId`) outside the tool input contract, so the service and tool no longer agreed on what a valid call looked like.
4. The route handler accepted partially validated request bodies and persisted UI messages without an explicit JSON normalisation boundary.
5. Conversation persistence trusted a globally unique `sessionId` without re-checking tenant ownership.

The solution works because it re-establishes each boundary explicitly:

1. UI event types are derived from the wrapped components, so the wrappers track Base UI instead of drifting from it.
2. The Prisma singleton exports one stable app-facing type, so service calls resolve to callable delegates again.
3. Tool creation is request-scoped, which keeps `clientId` in app code rather than exposing it as model-visible input.
4. The route validates the request body, converts messages into the shape Prisma expects, and fails with a clean `400` for malformed payloads.
5. Conversation writes and reads now enforce tenant ownership instead of assuming `sessionId` alone is safe.

## Prevention
- Derive wrapper event and prop types from the wrapped component with `ComponentProps<typeof ...>` or `Parameters<...>` instead of hand-writing DOM types.
- When Prisma uses multiple initialisation branches, define one stable exported singleton type immediately rather than relying on inferred unions.
- Keep app-only context such as `clientId` in request-scoped factories, not in loosely overloaded service functions.
- Add route-level tests whenever a handler validates JSON input or converts third-party SDK payloads before persistence.
- Treat every “fix the IDE errors” task as incomplete until `bun run build` passes; several of the real bugs here only appeared at compile time.

## Related Issues
No related issues documented yet.
