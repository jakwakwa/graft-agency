import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";
import { type Prisma, PrismaClient } from "../../generated/prisma/client";

/**
 * The Accelerate extension is applied universally so `cacheStrategy` is part
 * of the singleton type everywhere. On adapter-backed clients (dev / direct
 * Postgres), the extension silently strips `cacheStrategy` before executing,
 * and `$accelerate.invalidate()` no-ops when no Accelerate API key is present.
 */
type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

/**
 * Local `prisma dev` encodes the real postgres:// URL inside the api_key
 * query param as a base64 JSON payload. Decode it so we can connect via TCP.
 */
function extractDirectUrl(prismaUrl: string): string | null {
  try {
    const url = new URL(prismaUrl);
    const apiKey = url.searchParams.get("api_key");
    if (!apiKey) return null;
    const payload = JSON.parse(Buffer.from(apiKey, "base64").toString("utf-8"));
    return payload.databaseUrl ?? null;
  } catch {
    return null;
  }
}

const prismaClientSingleton = (): PrismaClientSingleton => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to initialise Prisma");
  }

  const log: Prisma.PrismaClientOptions["log"] = process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];
  const directConnectionString = process.env.DIRECT_DATABASE_URL;

  if (directConnectionString) {
    const adapter = new PrismaPg({
      connectionString: directConnectionString,
    });

    return new PrismaClient({ adapter, log }).$extends(withAccelerate());
  }

  // Local prisma dev: decode the embedded TCP URL and connect directly
  if (databaseUrl.startsWith("prisma+postgres://localhost")) {
    const tcpUrl = extractDirectUrl(databaseUrl);
    if (tcpUrl) {
      const adapter = new PrismaPg({ connectionString: tcpUrl });
      return new PrismaClient({ adapter, log }).$extends(withAccelerate());
    }
  }

  // Remote Prisma Accelerate
  if (databaseUrl.startsWith("prisma://") || databaseUrl.startsWith("prisma+postgres://")) {
    return new PrismaClient({
      accelerateUrl: databaseUrl,
      log,
    }).$extends(withAccelerate());
  }

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  return new PrismaClient({ adapter, log }).$extends(withAccelerate());
};

declare global {
  var prismaGlobal: PrismaClientSingleton | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
