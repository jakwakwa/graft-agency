import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db/prisma";
import { transitionStage } from "@/lib/engagement/stage-machine";
import { julesBuilderHandler } from "@/lib/inngest/functions/jules-builder";
import type { CampaignSop, DesignConcept, ProfiledNeeds } from "@/lib/types/engagement";

let capturedPrompt: string | undefined;

vi.mock("@/lib/engagement/stage-machine", () => ({
  transitionStage: vi.fn(),
}));

vi.mock("@/lib/services/jules-github.service", () => ({
  defaultJulesGithubSource: vi.fn(() => ({ owner: "test-owner", repo: "test-repo" })),
}));

vi.mock("@/lib/engagement/idempotency", () => ({
  ensureJulesSession: vi.fn((params: { makePrompt: () => string }) => {
    capturedPrompt = params.makePrompt();
    return {
      session: {
        sessionId: "sess-123",
        sessionUrl: "https://github.com/issues/1",
      },
    };
  }),
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    productSpec: {
      // Default to the legacy landing-page variant so the prompt assertions below hold.
      findUnique: vi.fn(() => Promise.resolve({ buildVariant: "landing" })),
    },
  },
}));

vi.mock("@google/genai", () => ({}));
vi.mock("@google/stitch-sdk", () => ({}));

describe("julesBuilderHandler", () => {
  const originalEnv = process.env.STITCH_TEMP_DISABLE;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedPrompt = undefined;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.STITCH_TEMP_DISABLE;
    } else {
      process.env.STITCH_TEMP_DISABLE = originalEnv;
    }
  });

  const sampleEventData = {
    leadId: "lead-123",
    clientId: "client-456",
    profiledNeeds: {
      companyName: "Acme Corp",
      productType: "website" as const,
      primaryNeed: "Build landing page",
      industry: "tech",
      targetAudience: "developers",
    } as ProfiledNeeds,
    prdContent: "## PRD Content",
  };

  const sampleConcepts: DesignConcept[] = [
    {
      index: 0,
      name: "Concept 1",
      description: "A super clean look",
      colorScheme: { primary: "#fff", background: "#000", text: "#ccc" },
      components: ["Hero"],
      styleKeywords: ["modern"],
    } as unknown as DesignConcept,
  ];

  const testMatrix = [
    // 1. STITCH_TEMP_DISABLE is set (should bypass regardless of designConcepts)
    { envValue: "1", concepts: sampleConcepts, expectedBypass: true, desc: "STITCH_TEMP_DISABLE='1' with concepts" },
    {
      envValue: "true",
      concepts: sampleConcepts,
      expectedBypass: true,
      desc: "STITCH_TEMP_DISABLE='true' with concepts",
    },
    { envValue: "1", concepts: [], expectedBypass: true, desc: "STITCH_TEMP_DISABLE='1' with empty concepts" },
    {
      envValue: "1",
      concepts: undefined as unknown as DesignConcept[],
      expectedBypass: true,
      desc: "STITCH_TEMP_DISABLE='1' with undefined concepts",
    },

    // 2. STITCH_TEMP_DISABLE is not set or false, but concepts are missing (should bypass gracefully)
    { envValue: "0", concepts: [], expectedBypass: true, desc: "STITCH_TEMP_DISABLE='0' with empty concepts" },
    {
      envValue: "0",
      concepts: undefined as unknown as DesignConcept[],
      expectedBypass: true,
      desc: "STITCH_TEMP_DISABLE='0' with undefined concepts",
    },
    {
      envValue: undefined,
      concepts: [],
      expectedBypass: true,
      desc: "STITCH_TEMP_DISABLE=undefined with empty concepts",
    },
    {
      envValue: undefined,
      concepts: undefined as unknown as DesignConcept[],
      expectedBypass: true,
      desc: "STITCH_TEMP_DISABLE=undefined with undefined concepts",
    },

    // 3. STITCH_TEMP_DISABLE is not set or false, and concepts are present (should NOT bypass)
    { envValue: "0", concepts: sampleConcepts, expectedBypass: false, desc: "STITCH_TEMP_DISABLE='0' with concepts" },
    {
      envValue: "false",
      concepts: sampleConcepts,
      expectedBypass: false,
      desc: "STITCH_TEMP_DISABLE='false' with concepts",
    },
    {
      envValue: undefined,
      concepts: sampleConcepts,
      expectedBypass: false,
      desc: "STITCH_TEMP_DISABLE=undefined with concepts",
    },
    {
      envValue: "random",
      concepts: sampleConcepts,
      expectedBypass: false,
      desc: "STITCH_TEMP_DISABLE='random' with concepts",
    },
  ];

  for (const t of testMatrix) {
    it(`behaves correctly when ${t.desc}`, async () => {
      if (t.envValue === undefined) {
        delete process.env.STITCH_TEMP_DISABLE;
      } else {
        process.env.STITCH_TEMP_DISABLE = t.envValue;
      }

      const mockStep = {
        run: vi.fn(async <T>(_id: string, fn: () => T | Promise<T>) => await fn()),
        sendEvent: vi.fn(async (_id: string, _event: { name: string; data: Record<string, unknown> }) =>
          Promise.resolve(undefined),
        ),
      };

      const result = await julesBuilderHandler({
        event: {
          data: {
            ...sampleEventData,
            designConcepts: t.concepts,
            chosenDesignIndex: 0,
          },
        },
        step: mockStep,
      });

      expect(transitionStage).toHaveBeenCalledWith({
        leadId: "lead-123",
        to: "BUILDING",
        source: "jules-builder",
      });

      expect(result.stage).toBe("BUILDING");
      expect(result.sessionId).toBe("sess-123");
      expect(capturedPrompt).toBeDefined();

      if (t.expectedBypass) {
        expect(capturedPrompt).not.toContain("## Design Specification");
        expect(capturedPrompt).toContain(
          "1. Create a self-contained Next.js landing page inside `prospects/acme-corp/`. You must rely solely on the generated PRD above for all design, layout, structure, and color choices.",
        );
      } else {
        expect(capturedPrompt).toContain("## Design Specification");
        expect(capturedPrompt).toContain("**Concept 1**");
        expect(capturedPrompt).toContain(
          "1. Create a self-contained Next.js landing page inside `prospects/acme-corp/`\n",
        );
      }
    });
  }

  describe("chosenDesignIndex and designConcepts edge cases when STITCH_TEMP_DISABLE is NOT active", () => {
    beforeEach(() => {
      delete process.env.STITCH_TEMP_DISABLE;
    });

    it("should fallback to designConcepts[0] when chosenDesignIndex is out of bounds", async () => {
      const mockStep = {
        run: vi.fn(async <T>(_id: string, fn: () => T | Promise<T>) => await fn()),
        sendEvent: vi.fn(async (_id: string, _event: { name: string; data: Record<string, unknown> }) =>
          Promise.resolve(undefined),
        ),
      };

      await julesBuilderHandler({
        event: {
          data: {
            ...sampleEventData,
            designConcepts: sampleConcepts,
            chosenDesignIndex: 5, // out of bounds
          },
        },
        step: mockStep,
      });

      expect(capturedPrompt).toContain("## Design Specification");
      expect(capturedPrompt).toContain("**Concept 1**");
    });

    it("should fallback to designConcepts[0] when chosenDesignIndex is undefined", async () => {
      const mockStep = {
        run: vi.fn(async <T>(_id: string, fn: () => T | Promise<T>) => await fn()),
        sendEvent: vi.fn(async (_id: string, _event: { name: string; data: Record<string, unknown> }) =>
          Promise.resolve(undefined),
        ),
      };

      await julesBuilderHandler({
        event: {
          data: {
            ...sampleEventData,
            designConcepts: sampleConcepts,
            chosenDesignIndex: undefined as unknown as number,
          },
        },
        step: mockStep,
      });

      expect(capturedPrompt).toContain("## Design Specification");
      expect(capturedPrompt).toContain("**Concept 1**");
    });

    it("should throw if designConcepts has non-empty length but no element at 0 (sparse array scenario)", async () => {
      const mockStep = {
        run: vi.fn(async <T>(_id: string, fn: () => T | Promise<T>) => await fn()),
        sendEvent: vi.fn(async (_id: string, _event: { name: string; data: Record<string, unknown> }) =>
          Promise.resolve(undefined),
        ),
      };

      const sparseConcepts: DesignConcept[] = [];
      sparseConcepts[1] = sampleConcepts[0]; // index 0 is undefined, index 1 is defined
      sparseConcepts.length = 2;

      await expect(
        julesBuilderHandler({
          event: {
            data: {
              ...sampleEventData,
              designConcepts: sparseConcepts,
              chosenDesignIndex: 0,
            },
          },
          step: mockStep,
        }),
      ).rejects.toThrow("No design concept found");
    });
  });

  describe("buildVariant routing", () => {
    beforeEach(() => {
      delete process.env.STITCH_TEMP_DISABLE;
    });

    it("builds the campaign-dashboard prompt when buildVariant is 'campaign'", async () => {
      (prisma.productSpec.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ buildVariant: "campaign" });

      const campaignSop: CampaignSop = {
        refinedEmail: { subject: "Quick idea for Acme", body: "Hi — saw your site…" },
        strategyNarrative: "Lead with the booking pain point.",
        objectives: ["Book a discovery call"],
        visualFramework: "Bold hero, proof band, single CTA.",
        designTone: ["luxury", "high-tech minimalism"],
      };

      const mockStep = {
        run: vi.fn(async <T>(_id: string, fn: () => T | Promise<T>) => await fn()),
        sendEvent: vi.fn(async () => Promise.resolve(undefined)),
      };

      await julesBuilderHandler({
        event: { data: { ...sampleEventData, designConcepts: sampleConcepts, chosenDesignIndex: 0, campaignSop } },
        step: mockStep,
      });

      expect(capturedPrompt).toContain("engagement campaign presentation");
      expect(capturedPrompt).toContain("## Campaign Strategy");
      expect(capturedPrompt).toContain("Lead with the booking pain point.");
      expect(capturedPrompt).toContain("feat: campaign dashboard — Acme Corp");
      expect(capturedPrompt).not.toContain("feat: prospect landing page");
    });
  });
});
