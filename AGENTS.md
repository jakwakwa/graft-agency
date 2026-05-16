# AGENTS.md

Agent instructions for this repository (Jules, Codex, and similar automated coding agents).

> For human contributors using Claude Code, see `CLAUDE.md`.

---

## First-time Setup

Run the setup script **once** after cloning (or at the start of any new Jules task) to install dependencies, generate the Prisma client, and validate the environment:

```bash
bash scripts/setup-jules.sh
```

The script:
- Checks Bun is available
- Audits required env vars and warns (non-fatal) about missing ones
- Runs `bun install --frozen-lockfile`
- Runs `bunx prisma generate`
- Runs `bun run lint`
- Runs `bun run test` and explains pre-existing known failures

After setup, follow the standard workflow below.

---

## Runtime

Use **Bun** for all commands — not Node.js, npm, or yarn.

```bash
bun install          # install dependencies
bun run <script>     # run package.json scripts
bunx <package>       # execute packages
```

---

## Testing

### Run unit tests only

```bash
bun run test
```

**Do NOT run `bun run test:all`** in a sandboxed/CI environment. `test:all` includes Playwright E2E tests that require:
- A running browser (Chromium)
- A live `DATABASE_URL` pointing to a real Postgres instance
- External service credentials (Paddle, Clerk, Inngest, Cal.com, etc.)

While environment variables (like `DATABASE_URL`) are now provided to the Jules environment, `test:all` may still encounter issues if a full browser environment (Chromium) is not available. Proceed with caution when running E2E tests.

### Known pre-existing test failures (do not block PRs)

The following test failures exist on `main` and are **not caused by agent changes**. Do not let them stop you from opening a PR:

| Test file | Reason |
|---|---|
| `tests/unit/scripts/dev-local-port.test.ts` | Source script file missing — pre-existing |
| `tests/unit/scripts/dev-pinggy-resolve.test.ts` | Source script file missing — pre-existing |
| `tests/unit/auth/get-platform-client-id.test.ts` | Requires live DB with specific seed state |
| `tests/unit/marketing/hero-video-background.test.tsx` | Known component bug, tracked separately |

### What to check before opening a PR

1. Run `bun run test` and confirm the tests **you added or modified** pass.
2. Run `bun run lint` — fix any Biome errors before committing.
3. If unit tests unrelated to your change fail, check the table above. If the failure is listed, ignore it and proceed. If it is not listed, investigate before opening a PR.

Required environment variables (including `TEST_DATABASE_URL`, `PADDLE_API_KEY`, etc.) are now provided directly to the Jules agent environment. **CRITICAL: You must use `TEST_DATABASE_URL` for all database-related tests.** If you encounter errors, it may indicate a configuration issue or a regression in how secrets are being accessed. Verify your environment before assuming they are "sandbox-only" failures.

---

## Code Quality

Always run before committing:

```bash
bun run lint      # Biome check (lint + format check)
bun run format    # Auto-fix formatting
```

---

## Opening a Pull Request

Once your unit tests pass and lint is clean:

1. Commit your changes with a conventional commit message (`feat:`, `fix:`, `test:`, `chore:`, etc.)
2. Push your branch and open a PR against `main`
3. In the PR description, note:
   - What you changed and why
   - Which tests you added/modified and that they pass
   - Any pre-existing test failures from the known list above that appeared during `bun run test` — mark them as pre-existing

Do **not** wait for `test:all` to pass before opening a PR. E2E tests require live infrastructure and are validated in the deployment pipeline, not locally.

---

## Architecture Notes

See `CLAUDE.md` for full architecture details. Key points for agents:

- **Multi-tenant**: all DB queries must be scoped by `clientId`
- **No `any` types** — fix the underlying type properly
- **Prisma singleton** at `lib/db/prisma.ts` — do not re-instantiate
- **Paddle** is the Merchant of Record — never implement custom tax logic
- **Inngest** functions are the engagement pipeline — changes there affect production jobs
- **Skills Files (`.agents/skills/`)**: NEVER edit, fix, or update any files in this directory. They are strictly read-only reference materials. Ignore any apparent placeholders (like 'REPLACE_ME') within them.
