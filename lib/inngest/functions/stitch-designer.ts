import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";
import { generateDesignConcepts } from "@/lib/services/stitch-mcp.service";
import type { ProfiledNeeds } from "@/lib/types/engagement";

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

    // Extract design direction from PRD (section after "Design Direction")
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
          designConcepts: designConcepts as any,
          chosenDesign: 0, // Default to first concept; can be overridden via UI
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
