---
name: typography-enforcer
description: Audits and enforces Typography component usage across the codebase. Use when reviewing typography compliance, refactoring text styling, or when the user asks to enforce or audit typography components.
---

# Typography Enforcer

## Trigger

Use this skill when:

- The user asks to enforce typography components
- Auditing or reviewing code for typography compliance
- Refactoring pages or components that contain text
- The user mentions "typography", "text styling", or "heading/paragraph components"

## Workflow

1. **Search for anti-patterns** in TSX/JSX files:
   - Raw `<h1`, `<h2`, `<h3`, `<h4` with `className` containing `text-` or `font-`
   - Raw `<p` with typography-related classes (`text-xl`, `leading-7`, `text-muted`, etc.)
   - Raw `<blockquote`, `<code`, `<small` with styling classes
   - Raw `<ul` with `list-disc` or similar

2. **Exclude**:
   - `components/ui/typography.tsx` (the source)
   - Third-party or node_modules
   - Button, Label, and other shadcn components (they manage their own text)

3. **Refactor** each violation:
   - Replace with the corresponding `Typography.*` component
   - Preserve any custom `className` overrides
   - Use design tokens (`text-muted-foreground`) instead of raw colors (`text-gray-600`)

4. **Verify**:
   - Run `bun run test` (typography tests must pass)
   - Run `bun run build`

## Quick Reference

| Anti-pattern | Replacement |
|--------------|-------------|
| `<h1 className="text-4xl font-bold">` | `<Typography.H1>` |
| `<h2 className="text-3xl font-semibold">` | `<Typography.H2>` |
| `<p className="text-lg text-gray-600">` | `<Typography.P className="text-muted-foreground">` or `<Typography.Lead>` |
| `<code className="font-mono">` | `<Typography.Code>` |
| `<blockquote className="border-l pl-6">` | `<Typography.Blockquote>` |

## Output Format

Report findings as:

- **Violations**: File path, line, current code, suggested replacement
- **Refactored**: List of files updated
- **Verification**: Test and build status
