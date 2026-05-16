import prisma from "../lib/db/prisma";

async function main() {
  console.log("Prisma singleton:", prisma ? "exists" : "null");
  console.log("Prisma $accelerate:", prisma.$accelerate ? "exists" : "undefined");
}

main();
