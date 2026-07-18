import { performance } from "node:perf_hooks";

// Mock prisma to simulate DB calls with latency
const mockPrisma = {
  lead: {
    count: async () => {
      await new Promise((r) => setTimeout(r, 50));
      return 10;
    },
  },
  conversation: {
    count: async () => {
      await new Promise((r) => setTimeout(r, 50));
      return 5;
    },
  },
  agentConfig: {
    findUnique: async () => {
      await new Promise((r) => setTimeout(r, 50));
      return {};
    },
  },
  prospectingConfig: {
    findUnique: async () => {
      await new Promise((r) => setTimeout(r, 50));
      return {};
    },
  },
  operationalEvent: {
    findMany: async () => {
      await new Promise((r) => setTimeout(r, 50));
      return [];
    },
  },
};

const clientId = "mock-id";

async function runSequential() {
  const start = performance.now();
  const leadsCount = await mockPrisma.lead.count();
  const activeConversationsCount = await mockPrisma.conversation.count();
  const conversionCount = await mockPrisma.lead.count();
  const agentConfig = await mockPrisma.agentConfig.findUnique();
  const prospectingConfig = await mockPrisma.prospectingConfig.findUnique();
  const logs = await mockPrisma.operationalEvent.findMany();
  const end = performance.now();
  return end - start;
}

async function runConcurrent() {
  const start = performance.now();
  const [leadsCount, activeConversationsCount, conversionCount, agentConfig, prospectingConfig, logs] =
    await Promise.all([
      mockPrisma.lead.count(),
      mockPrisma.conversation.count(),
      mockPrisma.lead.count(),
      mockPrisma.agentConfig.findUnique(),
      mockPrisma.prospectingConfig.findUnique(),
      mockPrisma.operationalEvent.findMany(),
    ]);
  const end = performance.now();
  return end - start;
}

async function main() {
  console.log("Warming up...");
  await runSequential();
  await runConcurrent();

  let seqTotal = 0;
  let concTotal = 0;
  const ITERS = 10;

  for (let i = 0; i < ITERS; i++) {
    seqTotal += await runSequential();
    concTotal += await runConcurrent();
  }

  const seqAvg = seqTotal / ITERS;
  const concAvg = concTotal / ITERS;

  console.log(`Sequential Average: ${seqAvg.toFixed(2)}ms`);
  console.log(`Concurrent Average: ${concAvg.toFixed(2)}ms`);
  console.log(`Speedup: ${(seqAvg / concAvg).toFixed(2)}x`);
}

main();
