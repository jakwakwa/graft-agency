import prisma from "./lib/db/prisma";

async function main() {
  const ownerClerkUserId = "user_3B0Q5jAcfhpfg4TAblGff4b9kyX";
  const ownerClientId = "e1f1f5a4-3012-45b4-bf2e-9c4daa4e1d5d";

  const updated = await prisma.client.update({
    where: { id: ownerClientId },
    data: { clerkUserId: ownerClerkUserId },
  });

  console.log("Updated owner row:", JSON.stringify(updated, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
