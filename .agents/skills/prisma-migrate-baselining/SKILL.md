---
name: prisma-migrate-baselining
description: Guides Prisma Migrate baselining for databases that existed before Migrate was adopted. Use when adding Migrate to an existing database with data that must not be reset, when deploy would re-apply DDL that already exists, or when marking initial migrations as already applied via migrate resolve.
---

# Prisma Migrate: Baselining

## When to use this skill

Invoke when:

- The database predates Prisma Migrate and already holds production (or shared) data that **must not** be wiped.
- The first migration would `CREATE` objects that already exist, so `prisma migrate deploy` would fail.
- You need to initialise migration history so **new** environments can be created from migrations, whilst **existing** databases skip the baseline SQL.

**Local development:** If the only target is a disposable database, you may prefer `prisma migrate dev` with reset and reseed instead of a full baseline workflow. Baselining remains essential for **non-resettable** targets (for example production) where the schema already matches an initial migration.

**Does not apply to MongoDB.** For MongoDB, use [`db push`](https://www.prisma.io/docs/orm/prisma-migrate/workflows/prototyping-your-schema) rather than `migrate deploy` for the equivalent workflow.

## Why baselining exists

1. **New development databases** should apply the **full** migration history from an empty state, including a baseline migration that represents “state before Migrate”.
2. **Existing production databases** already contain that baseline state. `migrate deploy` must **skip** baseline migrations and only apply **later** migrations.
3. Baselining marks chosen migration folder names as **already applied** in `_prisma_migrations`, so Prisma will not run their SQL on databases where objects already exist.

You may edit the baseline migration SQL to include objects Prisma cannot model (for example stored procedures or triggers); keep the Prisma schema as the source of truth for everything else.

## Procedure

### 1. Prepare `prisma/migrations`

- If `prisma/migrations` already exists, archive, rename, or remove it (only when you are deliberately resetting migration history as part of this workflow).
- Create `prisma/migrations`.
- Create a subdirectory for the baseline whose name sorts first, for example `0_init` (prefix `0_` or a timestamp both work; order is lexicographic).

### 2. Generate baseline SQL

From the repository root, generate a script from an empty database to the current `schema.prisma`:

```bash
bunx prisma migrate diff \
  --from-empty \
  --to-schema prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql
```

Review `migration.sql` for anything unsafe or redundant before proceeding.

### 3. Mark the baseline as applied (existing databases only)

On each database that **already matches** this baseline (for example production), record it without executing the SQL:

```bash
bunx prisma migrate resolve --applied 0_init
```

Repeat `--applied` for every baseline folder name you intend to skip on that database.

### 4. Apply subsequent migrations normally

- **New environments:** run `prisma migrate deploy` (or `migrate dev` in development) so the full chain applies; the baseline runs on empty databases.
- **Baselined production:** `deploy` skips migrations marked applied and runs only migrations **after** the baseline.

## Verification

- After `resolve --applied`, confirm rows exist in `_prisma_migrations` for the baseline name with a successful state.
- Run `prisma migrate status` against each environment to ensure “pending” only lists migrations you expect.

## References

- [Baselining a database (Prisma Docs)](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining)
- [Adding Prisma Migrate to a project with an existing database](https://www.prisma.io/docs/orm/prisma-migrate/getting-started#adding-to-an-existing-project)
