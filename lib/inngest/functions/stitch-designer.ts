import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";
import { generateDesignConcepts } from "@/lib/engagement/stitch-design-concepts";
import { transitionStage } from "@/lib/engagement/stage-machine";
import { inngest } from "@/lib/inngest/client";
import type { ProfiledNeeds } from "@/lib/types/engagement";
import { makeOnFailure } from "./_shared/on-failure";

/**
 * Inngest: PRD → Stitch (@google/stitch-sdk) → three design concept variants.
 * @see https://stitch.withgoogle.com/docs/sdk/ai-sdk/
 */
export const stitchDesignerFunction = inngest.createFunction(
  {
    id: "stitch-designer",
    name: "Stitch Design Concept Generator",
    retries: 2,
    idempotency: "event.data.leadId",
    onFailure: makeOnFailure("stitch-designer", "DESIGNING"),
    triggers: [{ event: "engagement/prd.written" }],
  },
  async ({ event, step }) => {
    const { leadId, clientId, profiledNeeds, prdContent } = event.data as {
      leadId: string;
      clientId: string;
      profiledNeeds: ProfiledNeeds;
      prdContent: string;
    };

    await step.run("mark-designing", () =>
      transitionStage({ leadId, to: "DESIGNING", source: "stitch-designer" }),
    );

    const designSectionMatch = prdContent.match(/## Design Direction\n([\s\S]*?)(?=\n##|$)/);
    const styleHint = designSectionMatch?.[1]?.trim() ?? "professional, clean, modern";

    const designConcepts = await step.run("generate-designs", () =>
      generateDesignConcepts({
        productName: `${profiledNeeds.companyName} ${profiledNeeds.productType}`,
        description: profiledNeeds.primaryNeed,
        styleHint,
        components: ["HeroSection", "BookingForm", "FeaturesList", "CTASection"],
      }),
    );

    await step.run("save-designs", () =>
      transitionStage({
        leadId,
        to: "DESIGN_COMPLETE",
        source: "stitch-designer",
        data: {
          designConcepts: designConcepts as unknown as Prisma.InputJsonValue,
          chosenDesign: 0,
        },
      }),
    );

    await step.sendEvent("emit-design-complete", {
      name: "engagement/design.completed",
      data: { leadId, clientId, profiledNeeds, prdContent, designConcepts, chosenDesignIndex: 0 },
    });

    return { leadId, stage: "DESIGN_COMPLETE", conceptCount: designConcepts.length };
  },
);
