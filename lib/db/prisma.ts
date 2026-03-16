import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";
import { type Prisma, PrismaClient } from "../../generated/prisma/client";

type PrismaClientSingleton = PrismaClient;

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

    return new PrismaClient({
      adapter,
      log,
    });
  }

  if (databaseUrl.startsWith("prisma://") || databaseUrl.startsWith("prisma+postgres://")) {
    return new PrismaClient({
      accelerateUrl: databaseUrl,
      log,
    }).$extends(withAccelerate()) as unknown as PrismaClientSingleton;
  }

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  return new PrismaClient({
    adapter,
    log,
  });
};

declare global {
  var prismaGlobal: PrismaClientSingleton | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
