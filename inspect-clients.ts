import prisma from "./lib/db/prisma";

async function main() {
  const clients = await prisma.client.findMany();
  console.log(JSON.stringify(clients, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
