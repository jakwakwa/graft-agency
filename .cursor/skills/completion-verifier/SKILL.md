---
name: completion-verifier
description: Verifies task completion by checking for TODO/FIXME tags, env var documentation, and gaps. Use when the agent says "I have finished X" or "task is complete", or at Gold Rush Step 05.
---

# Completion Verifier

## Trigger

Use this skill whenever:

- The agent says "I have finished X", "task is complete", or "implementation complete"
- Gold Rush Feature Pipeline Step 05: Verification
- The user asks "did you verify this is complete?"

## Workflow

1. **Grep for TODO/FIXME** in changed files:
   ```bash
   grep -r "// TODO\|// FIXME" <changed-files-or-directories>
   ```
   If any found, report them and do not declare completion until resolved or explicitly deferred.

2. **Check env var documentation**:
   - If new environment variables were introduced, verify they are documented in `.env.example`
   - If `.env.example` missing a required var, add it.

3. **Report gaps**:
   - List any logic that was not implemented
   - List any tests that were not added (per testing-governance)
   - Suggest updating `GAPS.md` with outstanding items

## Output Format

```markdown
## Completion Verification

- [ ] `// TODO` / `// FIXME` in changed files: None found / [list]
- [ ] New env vars documented in `.env.example`: Yes / No
- [ ] Outstanding items: [list or "None"]

**Verdict:** Ready for completion / Blocked by [reason]
```

## Guardrails

- Never claim a task is complete without running this verification.
- If tests fail or build fails, the task is not complete.
