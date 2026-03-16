---
name: contract-drift-fixer
description: Diagnose and fix TypeScript/Prisma contract drift at library boundaries. Use when seeing "This expression is not callable" on Prisma delegates, Base UI event type errors, Prisma InputJsonValue mismatches, or tenant-isolation holes in conversation persistence.
---

# Contract Drift Fixer

## Trigger

Use this skill when:

- Prisma delegate methods fail with "This expression is not callable"
- Base UI or Radix wrappers fail with event type mismatches (e.g. `Event` vs `BaseUIEvent`)
- Props like `openDelay` or `closeDelay` are reported as missing on a wrapper component
- Route handlers fail with `Type 'UIMessage[]' is not assignable to type 'InputJsonValue'`
- AI tools or services lose app context (e.g. `clientId`) between tool input and service call
- Conversation persistence uses `sessionId` alone without verifying `clientId` ownership

## Workflow

1. **Identify the boundary** – Determine which library boundary is drifting (Prisma singleton, UI wrapper, AI tool layer, route handler, or persistence).

2. **Establish ground truth** – Do not iterate on symptoms. Validate the actual API of the upstream library (Prisma client shape, Base UI component props, AI SDK message type, Prisma JSON schema).

3. **Apply the fix pattern** – Use the appropriate pattern from `references/fix-patterns.md`.

4. **Verify** – Run `bun run build` and relevant tests. Treat "fix IDE errors" as incomplete until the build passes.

## Fix Patterns

Load `references/fix-patterns.md` for concrete before/after code examples. Key patterns:

- **Prisma singleton**: Export one stable `PrismaClientSingleton` type; cast extended clients with `as unknown as PrismaClientSingleton`.
- **UI wrappers**: Derive event types via `Parameters<NonNullable<ComponentProps<typeof X>["onSelect"]>>[0]`; place timing props on the component that accepts them.
- **AI tools**: Create tools per request with `createTool(clientId)` so `clientId` is closed over, not in the model schema.
- **Route persistence**: Add `toPrismaJson(value) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue` at the boundary.
- **Tenant isolation**: Before update/read by `sessionId`, fetch `clientId` and throw if it does not match the request's `clientId`.

## Related

- Rule: `.agents/rules/typescript-prisma-contract-drift.mdc` (prevention)
- Solution doc: `docs/solutions/integration-issues/typescript-prisma-contract-drift-chatbot-stack-20260316.md` (full context)
