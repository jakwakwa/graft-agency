---
name: solution-to-skill
description: Extracts documented solutions from docs/solutions/ into reusable skills for future reference. Use when a fix has been documented and the user asks to extract it into a learning skill, or when recurring integration/build issues should become durable agent knowledge.
---

# Solution to Skill (Extract Learning Skill)

## Trigger

Use this skill when:

- A solution has been documented in `docs/solutions/` and the user asks to "extract into a learning skill"
- A recurring integration, build, or env issue has been fixed and should be applied automatically in future sessions
- The user wants institutional knowledge from a solution doc to become a discoverable skill

## Workflow

1. **Identify the solution doc** – Locate the documented fix in `docs/solutions/` (integration-issues, build-errors, patterns, etc.).

2. **Assess reusability** – The solution should be:
   - Recurring (likely to happen again in similar setups)
   - Actionable (clear steps the agent can follow)
   - Self-contained (does not depend on ephemeral context)

3. **Create or update a skill** – In `.cursor/skills/<skill-name>/`:
   - `SKILL.md` – Frontmatter (name, description) + trigger, workflow, root cause, what does not work
   - `references/` – Detailed patterns, code snippets, or checklists

4. **Cross-reference** – Update:
   - The solution doc: add a "Related" / "Extracted to" link to the new skill
   - `docs/solutions/patterns/critical-patterns.md` if the pattern is required reading
   - Other skills that depend on it (e.g. regression-sentinel prerequisites)

5. **Verify** – Ensure the skill description includes trigger terms so the agent can discover it when the symptom recurs.

## Skill Naming

- Lowercase, hyphens, max 64 chars
- Descriptive: `vitest-env-setup`, `contract-drift-fixer`, not `helper` or `utils`

## Example: Vitest DATABASE_URL

**Solution doc:** `docs/solutions/integration-issues/vitest-database-url-not-loaded-testing-20260316.md`

**Extracted skill:** `.cursor/skills/vitest-env-setup/`
- Trigger: "DATABASE_URL is required to initialise Prisma" or env vars empty in Vitest
- Fix: Add `import "dotenv/config"` as first line of `vitest.config.ts`
- References: `references/patterns.md` with correct/incorrect code

**Cross-references added:**
- `critical-patterns.md` (Pattern 1)
- `regression-sentinel/references/test-setup.md`
- Solution doc "Related" section

## What Not to Extract

- One-off fixes with no recurrence risk
- Solutions that depend on highly specific, non-reproducible context
- Time-sensitive workarounds (prefer documenting in solution doc with deprecation notes)

## Related

- Create-skill guidance: `~/.cursor/skills-cursor/create-skill/SKILL.md`
- Critical patterns: `docs/solutions/patterns/critical-patterns.md`
- Solution doc template: `docs/solutions/` frontmatter (module, problem_type, root_cause, etc.)
