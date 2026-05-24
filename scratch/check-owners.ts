import prisma from "../lib/db/prisma";

async function main() {
  const owners = await prisma.client.findMany({
    where: { isPlatformOwner: true },
    select: { id: true, businessName: true, clerkOrganizationId: true, isPlatformOwner: true },
  });
  console.log("Platform Owners:", JSON.stringify(owners, null, 2));
}

main().catch(console.error);
