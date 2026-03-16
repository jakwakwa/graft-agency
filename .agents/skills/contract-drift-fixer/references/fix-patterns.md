# Contract Drift Fix Patterns

Reference for the contract-drift-fixer skill. Source: `docs/solutions/integration-issues/typescript-prisma-contract-drift-chatbot-stack-20260316.md`.

## 1. Prisma Singleton (Delegate "Not Callable")

**Symptom:** `prisma.agentConfig.findUnique(...)` or similar fails with "This expression is not callable".

**Cause:** Mixed extended/unextended Prisma clients produce incompatible inferred types.

**Fix:**

```ts
// Before
const prismaClientSingleton = () => {
  if (databaseUrl.startsWith("prisma://")) {
    return new PrismaClient(...).$extends(withAccelerate());
  }
  return new PrismaClient(...);
};

// After
type PrismaClientSingleton = PrismaClient;

const prismaClientSingleton = (): PrismaClientSingleton => {
  if (databaseUrl.startsWith("prisma://")) {
    return new PrismaClient(...).$extends(withAccelerate()) as unknown as PrismaClientSingleton;
  }
  return new PrismaClient(...);
};
```

## 2. Base UI / Radix Event Handlers

**Symptom:** `Type '(e: Event) => void' is not assignable to type '(event: BaseUIEvent<...>) => void'`.

**Cause:** Wrapper used guessed DOM `Event` instead of the wrapped component's event type.

**Fix:**

```ts
// Before
const handleSelect = useCallback((event: Event) => {
  onSelect?.(event);
}, [onSelect]);

// After
type DropdownMenuItemSelectEvent =
  Parameters<NonNullable<ComponentProps<typeof DropdownMenuItem>["onSelect"]>>[0];

const handleSelect = useCallback((event: DropdownMenuItemSelectEvent) => {
  onSelect?.(event);
}, [onSelect]);
```

## 3. Timing Props on Wrong Component

**Symptom:** `Property 'openDelay' does not exist on type 'Props<unknown>'`.

**Cause:** `openDelay`/`closeDelay` placed on a wrapper that does not forward them; the underlying HoverCard or Popover accepts them.

**Fix:** Move the prop to the component that actually accepts it. Check the upstream component's prop interface.

## 4. AI Tool Losing App Context

**Symptom:** Tool passes `{ query }` but service expects `{ clientId, query }`; runtime bug or type mismatch.

**Cause:** Tool created once with a static schema; `clientId` not available at call site.

**Fix:**

```ts
// Before: tool created globally, no clientId
const searchKnowledgeTool = tool({
  inputSchema: z.object({ query: z.string().trim().min(1) }),
  execute: async (input) => agentService.searchKnowledge(input),
});

// After: tools built per request, close over clientId
export const createSearchKnowledgeBaseTool = (clientId: string) =>
  tool({
    inputSchema: z.object({ query: z.string().trim().min(1) }),
    execute: async (input) => {
      return await agentService.searchKnowledge({ clientId, ...input });
    },
  });
```

## 5. Route Handler – UIMessage[] to Prisma JSON

**Symptom:** `Type 'UIMessage<...>[]' is not assignable to type 'InputJsonValue'`.

**Cause:** AI SDK `finalMessages` passed directly to Prisma JSON field without serialisation boundary.

**Fix:**

```ts
// Before
await conversationService.save({
  clientId,
  sessionId,
  messages: finalMessages,
});

// After
const toPrismaJson = (value: UIMessage[]): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

await conversationService.save({
  clientId,
  sessionId,
  messages: toPrismaJson(finalMessages),
});
```

## 6. Tenant Isolation in Conversation Persistence

**Symptom:** `sessionId` alone used for upsert/read; another tenant's conversation could be overwritten or read.

**Cause:** No ownership check before update or read.

**Fix:**

```ts
// Before
await prisma.conversation.upsert({
  where: { sessionId: input.sessionId },
  ...
});

// After
const existingConversation = await prisma.conversation.findUnique({
  where: { sessionId: input.sessionId },
  select: { clientId: true },
});

if (existingConversation && existingConversation.clientId !== input.clientId) {
  throw new Error(`Conversation session "${input.sessionId}" belongs to a different client`);
}
```

## Verification Commands

```bash
bun run test -- tests/unit/services/agent.service.test.ts tests/unit/services/conversation.service.test.ts tests/unit/ai/tools/search-knowledge.test.ts
bun run lint
bun run build
```
