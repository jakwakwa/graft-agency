// Usage: bun scripts/provision-reseller.ts <clerkOrgId> <businessName>
// Example: bun scripts/provision-reseller.ts org_2abc123 "Acme Agency"
import prisma from "@/lib/db/prisma";

const [clerkOrgId, businessName] = process.argv.slice(2);

if (!clerkOrgId || !businessName) {
  console.error("Usage: bun scripts/provision-reseller.ts <clerkOrgId> <businessName>");
  process.exit(1);
}

try {
  const existing = await prisma.client.findUnique({
    where: { clerkOrganizationId: clerkOrgId },
  });

  if (existing) {
    const updated = await prisma.client.update({
      where: { clerkOrganizationId: clerkOrgId },
      data: { isReseller: true, businessName },
    });
    console.log("Updated existing client → isReseller: true");
    console.log(
      JSON.stringify({ id: updated.id, businessName: updated.businessName, isReseller: updated.isReseller }, null, 2),
    );
  } else {
    const created = await prisma.client.create({
      data: { clerkOrganizationId: clerkOrgId, businessName, isReseller: true },
    });
    console.log("Created new reseller client");
    console.log(
      JSON.stringify({ id: created.id, businessName: created.businessName, isReseller: created.isReseller }, null, 2),
    );
  }
} catch (error) {
  console.error("[provision-reseller] Database error:", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
