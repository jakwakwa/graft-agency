---
title: "Autonomous Prisma migrations via GitHub Actions (P1013 fix)"
date: "2026-06-21"
category: "integration-issues"
tags:
  - "prisma"
  - "prisma-postgres"
  - "migrations"
  - "github-actions"
  - "vercel"
  - "ci-cd"
  - "deployment"
severity: "high"
status: "solved"
components:
  - "Prisma Migrate (prisma migrate deploy)"
  - "GitHub Actions (.github/workflows/deploy.yml)"
  - "Prisma Postgres database"
  - "Vercel hosting"
related_files:
  - "prisma.config.ts"
  - ".github/workflows/deploy.yml"
  - "lib/db/prisma.ts"
  - "package.json"
---

# Autonomous Prisma migrations via GitHub Actions (P1013 fix)

How database migrations for the agency app are applied to production, why the
previous setup failed, and how to operate the replacement. This is both a
solution record and the runbook for running migrations going forward.

## Symptom

Every push to `main` produced two **failing** checks (while Vercel deployed the
app just fine):

1. **`Prisma Compute Deploy`** (Prisma's beta GitHub integration) ran
   `prisma migrate deploy` and exited 1:

   ```
   Error: P1013: The provided database string is invalid.
   The scheme is not recognized in database URL.
   ⚠️ This is failure #8 on main with the same error.
   ```

2. **`deploy`** (a hand-added GitHub Actions workflow) failed at setup:

   ```
   Error: Unable to resolve action `prisma/project-compute`, repository not found
   ```

Key observation that pointed at the diagnosis: **Vercel deployed successfully 6+
times during the same window.** The app host (Vercel) and the migration
mechanism are completely independent — so the failures only affected the
database schema step, never the running app.

## Root Cause

Three distinct problems, layered:

1. **P1013 — wrong URL scheme for migrate.** In **Prisma 7**, `prisma migrate
   deploy` connects using `datasource.url` from `prisma.config.ts` (Prisma 7
   removed `datasource.directUrl` — the single `url` is what the migrate CLI
   uses). That was set to `env("DATABASE_URL")`, which in production is the
   Prisma Postgres **pooled / Accelerate** URL (`prisma+postgres://…`). The
   migrate engine only accepts a **direct** `postgresql://` connection and
   rejects the `prisma+postgres` scheme → P1013. (The runtime client is
   *supposed* to use the Accelerate URL — see [lib/db/prisma.ts](../../../lib/db/prisma.ts) —
   but migrations are not.)

2. **Non-existent GitHub action.** `.github/workflows/deploy.yml` referenced
   `prisma/project-compute/github-action@main`, which is not a real published
   action → "repository not found".

3. **Environment-scoped secret (found during testing).** The fix needs a
   `DIRECT_DATABASE_URL` secret. It was first created on the **Production**
   GitHub *Environment*, but the workflow job did not declare
   `environment: Production`, so it could not read the secret and failed its
   guard ("secret not set"). A job can only read environment-scoped secrets
   when it declares that environment.

## Working Fix

1. **`prisma.config.ts`** — point migrate at a direct URL, with a local-dev
   fallback:

   ```ts
   // Prefer the direct postgresql:// URL; fall back to DATABASE_URL locally,
   // where .env already holds a direct connection string.
   const migrationUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
   if (!migrationUrl) {
     throw new Error("Prisma migrations require a direct postgresql:// connection string...");
   }
   export default defineConfig({
     schema: "prisma/schema.prisma",
     migrations: { path: "prisma/migrations" },
     datasource: { url: migrationUrl },
   });
   ```

2. **`.github/workflows/deploy.yml`** — replaced the broken workflow with a real
   one (`name: Migrate database`):
   - Triggers on push to `main` limited to `prisma/migrations/**`,
     `prisma/schema.prisma`, `prisma.config.ts`, plus manual `workflow_dispatch`.
   - `concurrency` group so two migration jobs never run at once.
   - `environment: Production` so the job can read the env-scoped secret (and
     each run is recorded as a Production deployment).
   - Guard step that fails early with a clear message if `DIRECT_DATABASE_URL`
     is missing, then `bun install --frozen-lockfile` and `bunx prisma migrate deploy`.

3. **Secret** — added `DIRECT_DATABASE_URL` (the **direct** `db.prisma.io`
   connection string from the Prisma Console) as a secret on the **Production**
   GitHub Environment.

4. **Removed the redundant mechanism** — disconnected the beta "Prisma Compute"
   GitHub auto-deploy. The Prisma Postgres **database is kept**; only the
   auto-deploy integration is removed.

## How it works now (architecture)

Three independent systems, one responsibility each:

| System | Responsibility | DB connection |
| --- | --- | --- |
| **Vercel** | Build (`prisma generate && next build`) + host the app | `DATABASE_URL` = `prisma+postgres://…` (pooled / Accelerate). **Does not run migrations.** |
| **GitHub Actions — "Migrate database"** | Apply schema migrations (`prisma migrate deploy`) | `DIRECT_DATABASE_URL` = `postgresql://…@db.prisma.io…` (direct) |
| **Prisma Postgres** | The database | direct host `db.prisma.io` · pooled host `pooled.db.prisma.io` |

**Environment-variable split (important):**

- **Vercel** keeps only `DATABASE_URL` (pooled). This is correct for serverless
  — pooling + caching.
- **GitHub Actions** has `DIRECT_DATABASE_URL` (direct) on the Production
  environment.
- **Do NOT add `DIRECT_DATABASE_URL` to Vercel.** `lib/db/prisma.ts` *prefers*
  it when present and would switch the running app from the pooled connection
  to direct connections — risking Postgres connection exhaustion under
  serverless load.

## Runbook: running migrations

**Prerequisites:** local `.env` with a direct `postgresql://` `DATABASE_URL`;
push access to `main`; the `DIRECT_DATABASE_URL` secret on the Production
GitHub Environment (already configured).

**Normal flow — change the schema:**

1. Edit `prisma/schema.prisma`.
2. Create the migration locally: `bun run db:migrate:dev`
   (writes a folder under `prisma/migrations/`).
3. Commit the migration folder + schema and push to `main`.
4. The **"Migrate database"** workflow triggers automatically and runs
   `prisma migrate deploy` against production.

**Run it manually (no schema change needed):**

- GitHub → **Actions → "Migrate database" → Run workflow**, or
- `gh workflow run deploy.yml -R jakwakwa/graft-agency --ref main`

**Check state / watch a run:**

- `bun run db:migrate:status` (locally, against your `.env` DB)
- `gh run watch <run-id> -R jakwakwa/graft-agency --exit-status`

**Rollback / failure handling:** `prisma migrate deploy` is **forward-only and
non-destructive** — it only applies committed, not-yet-applied migrations; it
never resets or drops data. To undo a bad migration, write a new *forward*
migration that reverses it and push (do not hand-delete an applied migration
folder). If a migration half-applies, fix the SQL/state and re-run — the
`concurrency` group guarantees no overlapping runs.

**Escalation:** the database lives in the Prisma Console (`db.prisma.io`).
Connection/credential issues are resolved there (regenerate the direct
connection string → update the `DIRECT_DATABASE_URL` Production secret).

## Verification

- Manual dispatch run `27899723233` (2026-06-21) finished **green in 35s**, all
  steps including "Apply migrations" passing. Secret resolved (shown masked as
  `***`).
- `prisma migrate deploy` output:

  ```
  Datasource "db": PostgreSQL database "postgres", schema "public" at "...db.prisma.io:5432"
  26 migrations found in prisma/migrations
  No pending migrations to apply.
  ```

  → production schema is in sync (all 26 migrations applied); pipeline confirmed
  end-to-end (auth + connection + state check).

## Known follow-ups / gotchas

- ⚠️ **Pooled vs direct host.** The verification run connected via
  `pooled.db.prisma.io` — i.e. the `DIRECT_DATABASE_URL` secret currently holds
  the **pooled** string. It succeeded only because nothing was pending. Prisma
  warns that real DDL through the pooler can fail with lock/session errors.
  **Swap the secret value to the direct host `db.prisma.io`** (drop the
  `pooled.` prefix; copy the "direct connection" string from the Prisma Console)
  **before the next schema change.**
- 🧹 **Delete the redundant repository-level `DIRECT_DATABASE_URL` secret.** The
  workflow uses the **Production environment** secret; a duplicate repo secret
  exists and should be removed to avoid two sources of truth.
- Keep the beta **"Prisma Compute" auto-deploy disconnected**.
- Harmless: `actions/checkout@v4` runs on Node 24 (Node 20 deprecation notice).
  Bump to `@v5` when convenient.

## Prevention

- For Prisma Postgres + Prisma 7, always give `prisma migrate` a **direct**
  `postgresql://` URL (host `db.prisma.io`) — never the `prisma+postgres://`
  pooled URL.
- Keep migrations **out of the Vercel build**; run them in CI with the direct
  connection so app hosting and schema changes stay independent and observable.
- When a workflow uses a **GitHub Environment** secret, the job must declare
  `environment: <name>` — otherwise `secrets.*` resolves empty.

## Related notes

- [prisma-config-env-dot-notation-lint.md](../build-errors/prisma-config-env-dot-notation-lint.md)
  — `prisma.config.ts` / env access.
- [vitest-database-url-not-loaded-testing-20260316.md](./vitest-database-url-not-loaded-testing-20260316.md)
  — `DATABASE_URL` loading in tests.
- [inngest-prospecting-scheduler-replaces-vercel-cron-20260328.md](./inngest-prospecting-scheduler-replaces-vercel-cron-20260328.md)
  — analogous "replaced a deploy/automation mechanism" record.
