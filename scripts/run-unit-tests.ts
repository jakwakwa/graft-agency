import { startPrismaDevServer } from "@prisma/dev";

const server = await startPrismaDevServer({
  name: `graft-unit-tests-${process.pid}`,
  persistenceMode: "stateless",
});

const databaseUrl = server.database.connectionString;
const testEnvironment = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DIRECT_DATABASE_URL: databaseUrl,
  TEST_DATABASE_URL: databaseUrl,
};

async function run(command: string[]) {
  const child = Bun.spawn(command, {
    env: testEnvironment,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  return await child.exited;
}

try {
  const migrationExitCode = await run(["bunx", "prisma", "migrate", "deploy"]);
  if (migrationExitCode !== 0) {
    throw new Error(`Test database migration failed with exit code ${migrationExitCode}`);
  }

  process.exitCode = await run(["bunx", "vitest", "run", ...Bun.argv.slice(2)]);
} finally {
  await server.close?.();
}
