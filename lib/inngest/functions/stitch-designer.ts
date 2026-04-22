import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";
import { generateDesignConcepts } from "@/lib/engagement/stitch-design-concepts";
import { inngest } from "@/lib/inngest/client";
import type { ProfiledNeeds } from "@/lib/types/engagement";

/**
 * Inngest: PRD → Stitch (@google/stitch-sdk) → three design concept variants.
 * @see https://stitch.withgoogle.com/docs/sdk/ai-sdk/
 */
export const stitchDesignerFunction = inngest.createFunction(
  {
    id: "stitch-designer",
    name: "Stitch Design Concept Generator",
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
      prisma.productSpec.update({ where: { leadId }, data: { stage: "DESIGNING" } }),
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
      prisma.productSpec.update({
        where: { leadId },
        data: {
          stage: "DESIGN_COMPLETE",
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
