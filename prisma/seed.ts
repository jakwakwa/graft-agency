import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the seed script");
}

/**
 * For prisma+postgres:// URLs (local `prisma dev`), the api_key query param
 * is a base64-encoded JSON payload containing the real `databaseUrl`.
 * Decode it so we can connect directly via TCP with the PrismaPg adapter.
 */
function resolveConnectionString(url: string): string {
  const directUrl = process.env.DIRECT_DATABASE_URL;
  if (directUrl) return directUrl;

  if (url.startsWith("prisma+postgres://") || url.startsWith("prisma://")) {
    const parsed = new URL(url);
    const apiKey = parsed.searchParams.get("api_key");
    if (apiKey) {
      try {
        const payload = JSON.parse(Buffer.from(apiKey, "base64").toString("utf-8"));
        if (payload.databaseUrl) return payload.databaseUrl;
      } catch {
        // Fall through to use the URL as-is
      }
    }
  }

  return url;
}

const connectionString = resolveConnectionString(databaseUrl);
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const client = await prisma.client.upsert({
    where: { clerkOrganizationId: "org_seed_dev" },
    update: {},
    create: {
      clerkOrganizationId: "org_seed_dev",
      businessName: "Kona Dev Agency",
      industry: "Digital Marketing",
      websiteUrl: "https://kona.agency",
      subscriptionActive: true,
      subscriptionStatus: "active",
    },
  });

  await prisma.agentConfig.upsert({
    where: { clientId: client.id },
    update: {},
    create: {
      clientId: client.id,
      systemPrompt:
        "You are a friendly sales assistant for Kona Dev Agency. Help visitors learn about our digital marketing services, capture their contact details, and book appointments.",
      agentName: "Kona",
      greetingMessage: "Hi there! I'm Kona — how can I help you today?",
      widgetPrimaryColour: "#7c3aed",
      knowledgeBase: [
        {
          question: "What services do you offer?",
          answer: "We offer AI-powered chatbots, lead generation, website audits, and digital marketing strategy.",
        },
        {
          question: "What are your prices?",
          answer: "Our plans start at R2,500/month for the Starter package. Contact us for a custom quote.",
        },
        {
          question: "Where are you based?",
          answer: "We're based in Cape Town, South Africa, but work with clients worldwide.",
        },
      ],
    },
  });

  // E2E test client with Cal.com config for scheduling tests
  const e2eClient = await prisma.client.upsert({
    where: { id: "test-client-e2e" },
    update: {},
    create: {
      id: "test-client-e2e",
      clerkOrganizationId: "org_test_e2e",
      businessName: "E2E Test Agency",
      subscriptionActive: true,
      subscriptionStatus: "active",
    },
  });

  await prisma.agentConfig.upsert({
    where: { clientId: e2eClient.id },
    update: {
      calComUsername: "testuser",
      defaultEventSlug: "15min",
    },
    create: {
      clientId: e2eClient.id,
      systemPrompt:
        "You are a friendly assistant. Help with scheduling. When asked about availability, use the checkAvailability tool.",
      agentName: "AI Assistant",
      greetingMessage: "How can I help you today?",
      calComUsername: "testuser",
      defaultEventSlug: "15min",
    },
  });

  const devClientId = "dev-client";
  const devClient = await prisma.client.upsert({
    where: { id: devClientId },
    update: {},
    create: {
      id: devClientId,
      clerkOrganizationId: "org_dev_local",
      businessName: "Dev Agency",
      subscriptionActive: true,
      subscriptionStatus: "active",
    },
  });

  const devCalPath = process.env.CAL_COM_EVENT_SLUG ?? null;
  const parts = devCalPath?.split("/");
  const devCalUsername = parts?.length === 2 ? parts[0] : null;
  const devCalEventSlug = parts?.length === 2 ? parts[1] : null;

  await prisma.agentConfig.upsert({
    where: { clientId: devClient.id },
    update: {
      calComUsername: devCalUsername ?? null,
      defaultEventSlug: devCalEventSlug ?? null,
    },
    create: {
      clientId: devClient.id,
      systemPrompt:
        "You are a friendly sales assistant. Help visitors learn about services, capture contact details, and book appointments.",
      agentName: "Kona",
      greetingMessage: "Hi there! I'm Kona — how can I help you today?",
      widgetPrimaryColour: "#7c3aed",
      calComUsername: devCalUsername ?? null,
      defaultEventSlug: devCalEventSlug ?? null,
      knowledgeBase: [
        {
          question: "What services do you offer?",
          answer: "We offer AI chatbots, lead generation, and digital marketing.",
        },
        { question: "What are your prices?", answer: "Plans start at R2,500/month. Contact us for a quote." },
      ],
    },
  });

  // Automation dashboard: ProspectQueue samples for org_seed_dev
  await prisma.prospectQueue.upsert({
    where: { id: "seed-pq-pending" },
    update: {},
    create: {
      id: "seed-pq-pending",
      clientId: client.id,
      businessName: "Seed Prospect Pending",
      websiteUrl: "https://seed-pending.example.com",
      status: "PENDING",
    },
  });
  await prisma.prospectQueue.upsert({
    where: { id: "seed-pq-completed" },
    update: {},
    create: {
      id: "seed-pq-completed",
      clientId: client.id,
      businessName: "Seed Prospect Completed",
      websiteUrl: "https://seed-completed.example.com",
      status: "COMPLETED",
    },
  });

  console.log(`Seeded client: ${client.id}`);
  console.log(`Seeded E2E client: ${e2eClient.id}`);
  console.log(`Seeded dev client: ${devClient.id}`);
  console.log(`Widget URL (dev): http://localhost:3000/widget/${devClient.id}`);
  if (devCalUsername && devCalEventSlug) {
    console.log(`Dev client Cal.com: ${devCalUsername} / ${devCalEventSlug}`);
  } else {
    console.log(`Dev client Cal.com: not configured`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
