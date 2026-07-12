import prisma from "../lib/db/prisma";
import "dotenv/config";

async function main() {
  console.log("Seed (Test): Seeding test database...");

  const platformClientId = process.env.PLATFORM_CLIENT_ID || "user_2pk52n7x3n7x3n7x3n7x3n7x3n7";
  const platformOrgId = process.env.PLATFORM_CLERK_ORG_ID || "org_2pk52n7x3n7x3n7x3n7x3n7x3n7";

  // 1. Ensure a Platform Owner exists
  const platformOwner = await prisma.client.upsert({
    where: { clerkUserId: platformClientId },
    update: {
      isPlatformOwner: true,
      clerkOrganizationId: platformOrgId,
      businessName: "Graft Platform (Test)",
      deletedAt: null,
    },
    create: {
      clerkUserId: platformClientId,
      clerkOrganizationId: platformOrgId,
      businessName: "Graft Platform (Test)",
      isPlatformOwner: true,
    },
  });
  console.log(`Seed (Test): Platform Owner created/updated: ${platformOwner.id}`);

  // 2. Ensure an Active Agency exists
  const activeAgency = await prisma.client.upsert({
    where: { subdomain: "active-agency" },
    update: {
      businessName: "Active Growth Agency",
      subscriptionActive: true,
      subscriptionStatus: "active",
      deletedAt: null,
    },
    create: {
      clerkUserId: "user_active_agency_test",
      clerkOrganizationId: "org_active_agency_test",
      businessName: "Active Growth Agency",
      subdomain: "active-agency",
      subscriptionActive: true,
      subscriptionStatus: "active",
    },
  });
  console.log(`Seed (Test): Active Agency created/updated: ${activeAgency.id}`);

  // 4. Ensure ProspectingConfig exists for Platform Owner
  await prisma.prospectingConfig.upsert({
    where: { clientId: platformOwner.id },
    update: {
      cronEnabled: true,
      cronFrequency: "daily",
    },
    create: {
      clientId: platformOwner.id,
      cronEnabled: true,
      cronFrequency: "daily",
    },
  });
  console.log(`Seed (Test): ProspectingConfig ensured for Platform Owner.`);

  // 5. Add some Leads for the Active Agency
  const lead1 = await prisma.lead.upsert({
    where: { calBookingUid: "test-booking-1" },
    update: { status: "BOOKED" },
    create: {
      clientId: activeAgency.id,
      customerName: "John Doe",
      email: "john@example.com",
      source: "INBOUND",
      status: "BOOKED",
      calBookingUid: "test-booking-1",
    },
  });

  const lead2 = await prisma.lead.upsert({
    where: { calBookingUid: "test-booking-2" },
    update: { status: "CONTACTED" },
    create: {
      clientId: activeAgency.id,
      customerName: "Jane Smith",
      email: "jane@smith-corp.com",
      source: "OUTBOUND_PROSPECT",
      status: "CONTACTED",
      calBookingUid: "test-booking-2",
    },
  });

  const lead3 = await prisma.lead.upsert({
    where: { calBookingUid: "test-booking-3" },
    update: { status: "SCRAPED" },
    create: {
      clientId: activeAgency.id,
      customerName: "Bob Builder",
      email: "bob@construction.com",
      source: "OUTBOUND_PROSPECT",
      status: "SCRAPED",
      calBookingUid: "test-booking-3",
    },
  });

  const lead4 = await prisma.lead.upsert({
    where: { calBookingUid: "test-booking-4" },
    update: { status: "CLOSED" },
    create: {
      clientId: activeAgency.id,
      customerName: "Alice Wonderland",
      email: "alice@magic.com",
      source: "INBOUND",
      status: "CLOSED",
      calBookingUid: "test-booking-4",
    },
  });
  console.log("Seed (Test): Leads seeded.");

  // 6. Add a ProductSpec for Lead 1 and Lead 4
  await prisma.productSpec.upsert({
    where: { leadId: lead1.id },
    update: { stage: "DESIGNING" },
    create: {
      leadId: lead1.id,
      clientId: activeAgency.id,
      stage: "DESIGNING",
      prdContent: "Test PRD content for John Doe",
      designConcepts: { concepts: ["Concept 1", "Concept 2"] },
    },
  });

  await prisma.productSpec.upsert({
    where: { leadId: lead4.id },
    update: { stage: "DEPLOYED" },
    create: {
      leadId: lead4.id,
      clientId: activeAgency.id,
      stage: "DEPLOYED",
      prdContent: "Final PRD for Alice",
      deploymentUrl: "https://wonderland-test.vercel.app",
    },
  });
  console.log("Seed (Test): ProductSpecs seeded.");

  // 7. Add some Operational Events
  await prisma.operationalEvent.create({
    data: {
      clientId: activeAgency.id,
      category: "SYSTEM",
      eventType: "test.seed",
      status: "INFO",
      message: "Test database seeded successfully",
    },
  });
  console.log("Seed (Test): OperationalEvent seeded.");

  // 8. Add Email Templates
  await prisma.emailTemplate.upsert({
    where: { id: "test-template-welcome" },
    update: {},
    create: {
      id: "test-template-welcome",
      clientId: activeAgency.id,
      name: "Welcome Email",
      subject: "Welcome to Graft",
      body: "Hello {{name}}, welcome to our platform!",
      isDefault: true,
    },
  });
  console.log("Seed (Test): EmailTemplate seeded.");

  console.log("Seed (Test): Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed (Test): Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
