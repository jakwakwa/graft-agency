---
name: completion-verifier
description: Verifies task completion by checking for TODO/FIXME tags, env var documentation, Living SOP (docs/living-sop.md) updates, and gaps. Use when the agent says "I have finished X" or "task is complete", or at Gold Rush Step 05.
---

# Completion Verifier

## Trigger

Use this skill whenever:

- The agent says "I have finished X", "task is complete", or "implementation complete"
- Gold Rush Feature Pipeline Step 05: Verification
- The user asks "did you verify this is complete?"
If you are about to say "task complete", "done", or "implementation complete" and have NOT run this skill in this turn, you MUST run it first. Do not skip.


## Workflow

1. **Grep for TODO/FIXME** in changed files:
   ```bash
   grep -r "// TODO\|// FIXME" <changed-files-or-directories>
   ```
   If any found, report them and do not declare completion until resolved or explicitly deferred.

2. **Check env var documentation**:
   - If new environment variables were introduced, verify they are documented in `.env.example`
   - If `.env.example` missing a required var, add it.

3. **Enforce Living SOP update** (mandatory):
   - If the completed work touched any of these, `living-sop.md` MUST have been updated:
     - Schema/model or migration changes (`prisma/schema.prisma`, `prisma/migrations/`)
     - New API route or service (`app/api/`, `lib/services/`)
     - Middleware or tenant-routing changes (`middleware.ts`, `proxy.ts`)
     - Test strategy or command changes (`package.json` scripts, `vitest.config.ts`, `playwright.config.*`)
     - Deployment or environment process changes
   - Verify the "Update Block" at the bottom of `docs/living-sop.md` reflects the change (last updated date, what changed, verification performed).
   - If `docs/living-sop.md` was not updated when it should have been, block completion and instruct the agent to update it.

4. **Kill any dev server you started**:
   - If you ran `bun run dev`, `next dev`, or started a server on port 3000 during this session, kill it before declaring completion.
   - Use `lsof -i :3000` to find the PID, then `kill <pid>` (or `kill -9 <pid>` if needed).
   - Do not leave orphaned dev processes; they block port 3000 and cause lock-file conflicts.

5. **Report gaps**:
   - List any logic that was not implemented
   - List any tests that were not added (per testing-governance)
   - Suggest updating `GAPS.md` with outstanding items

## Output Format

```markdown
## Completion Verification

- [ ] `// TODO` / `// FIXME` in changed files: None found / [list]
- [ ] New env vars documented in `.env.example`: Yes / No
- [ ] `docs/living-sop.md` updated (if work touched schema, API, middleware, tests, or deployment): Yes / No / N/A
- [ ] Dev server killed (if started): Yes / N/A
- [ ] Outstanding items: [list or "None"]

**Verdict:** Ready for completion / Blocked by [reason]
```

## Guardrails

- Never claim a task is complete without running this verification.
- If tests fail or build fails, the task is not complete.
- If the work touched schema, API, middleware, tests, or deployment and `docs/living-sop.md` was not updated, the task is not complete. Update the Living SOP and its Update Block before declaring done.
- If you started a dev server during this session, kill it before declaring completion. Do not leave orphaned processes.
