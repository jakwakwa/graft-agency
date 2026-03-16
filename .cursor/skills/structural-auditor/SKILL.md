---
name: structural-auditor
description: Maps file trees for new features, verifies no logic duplication, and proposes module splits. Use before creating any new feature or when the user invokes the Gold Rush Feature Pipeline.
---

# Structural Auditor

## Trigger

Use this skill whenever:

- The user asks to build a new feature
- The Gold Rush Feature Pipeline is invoked (Step 01: Blueprint)
- The user asks to "map out the structure" or "plan the module split"

## Workflow

1. **Map the file tree** for the feature:
   - List every file to create or edit
   - Group by layer: components, hooks, services, lib, types

2. **Verify no existing logic is duplicated**:
   - Search for similar patterns in `lib/services/`, `lib/`, `components/`
   - If overlap exists, propose reuse or extraction instead of duplication

3. **Propose the module split**:
   - Components: `components/<feature>/<component>.tsx` (e.g. `components/chat/chat-window.tsx`, `components/chat/chat-message.tsx`)
   - Hooks: `hooks/use-<feature>-logic.ts` or `hooks/use-<feature>.ts`
   - Services: `lib/services/<feature>.service.ts`
   - Types: `types/<feature>.ts` or inline in the module

## Output Format

Produce a structured plan:

```markdown
## File Tree

### New files
- `components/feature/component-a.tsx`
- `components/feature/component-b.tsx`
- `hooks/use-feature-logic.ts`
- `lib/services/feature.service.ts`

### Edit existing
- `app/route/page.tsx` (wire up new components)

### Reuse existing
- `lib/utils.ts` (no changes)
```

## Guardrails

- No component exceeds 150 lines. If it would, split into sub-components.
- Logic stays in hooks or services, not in components.
