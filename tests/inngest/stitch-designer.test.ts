import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { transitionStage } from "@/lib/engagement/stage-machine";
import { generateDesignConcepts } from "@/lib/engagement/stitch-design-concepts";
import { stitchDesignerHandler } from "@/lib/inngest/functions/stitch-designer";
import type { DesignConcept, ProfiledNeeds } from "@/lib/types/engagement";

// Mock external modules
vi.mock("@/lib/engagement/stage-machine", () => ({
  transitionStage: vi.fn(),
}));

vi.mock("@/lib/engagement/stitch-design-concepts", () => ({
  generateDesignConcepts: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    productSpec: {
      findUnique: vi.fn(() => Promise.resolve({ buildVariant: "campaign" })),
    },
  },
}));

vi.mock("@google/genai", () => ({}));
vi.mock("@google/stitch-sdk", () => ({}));

describe("stitchDesignerHandler", () => {
  const originalEnv = process.env.STITCH_TEMP_DISABLE;

  beforeEach(() => {
    vi.clearAllMocks();
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
    prdContent: "## Design Direction\n### Visual Effects\nModern look\n### Section Layout\n- Hero: text",
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
    { value: "1", expectedBypass: true, desc: "string '1'" },
    { value: "true", expectedBypass: true, desc: "string 'true'" },
    { value: "0", expectedBypass: false, desc: "string '0'" },
    { value: "false", expectedBypass: false, desc: "string 'false'" },
    { value: "", expectedBypass: false, desc: "empty string" },
    { value: "TRUE", expectedBypass: false, desc: "uppercase 'TRUE'" },
    { value: "tRuE", expectedBypass: false, desc: "mixed case 'tRuE'" },
    { value: "random", expectedBypass: false, desc: "arbitrary string" },
    { value: undefined, expectedBypass: false, desc: "undefined" },
  ];

  for (const t of testMatrix) {
    describe(`When STITCH_TEMP_DISABLE is ${t.desc}`, () => {
      beforeEach(() => {
        if (t.value === undefined) {
          delete process.env.STITCH_TEMP_DISABLE;
        } else {
          process.env.STITCH_TEMP_DISABLE = t.value;
        }
      });

      it(`correctly handles bypass state: expectedBypass=${t.expectedBypass}`, async () => {
        const mockStep = {
          run: vi.fn(async <T>(_id: string, fn: () => T | Promise<T>) => await fn()),
          sendEvent: vi.fn(async (_id: string, _event: { name: string; data: Record<string, unknown> }) =>
            Promise.resolve(undefined),
          ),
        };

        vi.mocked(generateDesignConcepts).mockResolvedValue(sampleConcepts);

        const result = await stitchDesignerHandler({
          event: { data: sampleEventData },
          step: mockStep,
        });

        // Verify mark-designing state transition occurred
        expect(transitionStage).toHaveBeenCalledWith({
          leadId: "lead-123",
          to: "DESIGNING",
          source: "stitch-designer",
        });

        if (t.expectedBypass) {
          expect(generateDesignConcepts).not.toHaveBeenCalled();
          expect(result.conceptCount).toBe(0);
          expect(result.stage).toBe("DESIGN_COMPLETE");

          // Verify save-designs saved an empty array of designConcepts
          expect(transitionStage).toHaveBeenCalledWith({
            leadId: "lead-123",
            to: "DESIGN_COMPLETE",
            source: "stitch-designer",
            data: {
              designConcepts: [],
              chosenDesign: 0,
            },
          });

          // Verify the event emitted contains empty designConcepts
          expect(mockStep.sendEvent).toHaveBeenCalledWith("emit-design-complete", {
            name: "engagement/design.completed",
            data: {
              leadId: "lead-123",
              clientId: "client-456",
              profiledNeeds: sampleEventData.profiledNeeds,
              prdContent: sampleEventData.prdContent,
              designConcepts: [],
              chosenDesignIndex: 0,
            },
          });
        } else {
          expect(generateDesignConcepts).toHaveBeenCalled();
          expect(result.conceptCount).toBe(1);
          expect(result.stage).toBe("DESIGN_COMPLETE");

          // Verify save-designs saved the concepts
          expect(transitionStage).toHaveBeenCalledWith({
            leadId: "lead-123",
            to: "DESIGN_COMPLETE",
            source: "stitch-designer",
            data: {
              designConcepts: sampleConcepts,
              chosenDesign: 0,
            },
          });

          // Verify the event emitted contains the concepts
          expect(mockStep.sendEvent).toHaveBeenCalledWith("emit-design-complete", {
            name: "engagement/design.completed",
            data: {
              leadId: "lead-123",
              clientId: "client-456",
              profiledNeeds: sampleEventData.profiledNeeds,
              prdContent: sampleEventData.prdContent,
              designConcepts: sampleConcepts,
              chosenDesignIndex: 0,
            },
          });
        }
      });
    });
  }
});
