import { nanoid } from "nanoid";
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";
import { createBuildRepo, createJulesIssue } from "@/lib/services/jules-github.service";
import type { DesignConcept, ProfiledNeeds } from "@/lib/types/engagement";

export const julesBuilderFunction = inngest.createFunction(
  {
    id: "jules-builder",
    name: "Jules GitHub Builder",
    triggers: [{ event: "engagement/design.completed" }],
  },
  async ({ event, step }) => {
    const { leadId, clientId, profiledNeeds, prdContent, designConcepts, chosenDesignIndex } =
      event.data as {
        leadId: string;
        clientId: string;
        profiledNeeds: ProfiledNeeds;
        prdContent: string;
        designConcepts: DesignConcept[];
        chosenDesignIndex: number;
      };

    await step.run("mark-building", () =>
      prisma.productSpec.update({ where: { leadId }, data: { stage: "BUILDING" } }),
    );

    const companySlug = profiledNeeds.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);
    const buildId = nanoid(8).toLowerCase();

    const buildRepo = await step.run("create-build-repo", () =>
      createBuildRepo({ companySlug, buildId }),
    );

    const chosenDesign = designConcepts[chosenDesignIndex] ?? designConcepts[0];
    const designDescription = `**${chosenDesign.name}**

${chosenDesign.description}

Colour scheme:
- Primary: ${chosenDesign.colorScheme.primary}
- Background: ${chosenDesign.colorScheme.background}  
- Text: ${chosenDesign.colorScheme.text}

Key components: ${chosenDesign.components.join(", ")}
Style keywords: ${chosenDesign.styleKeywords.join(", ")}`;

    const issueUrl = await step.run("create-jules-issue", () =>
      createJulesIssue({ repoFullName: buildRepo.repoFullName, prdContent, designDescription }),
    );

    await step.run("save-build-info", () =>
      prisma.productSpec.update({
        where: { leadId },
        data: { githubRepo: buildRepo.repoFullName, githubIssueUrl: issueUrl },
      }),
    );

    await step.sendEvent("emit-build-started", {
      name: "engagement/build.started",
      data: { leadId, clientId, profiledNeeds, githubRepo: buildRepo.repoFullName, issueUrl },
    });

    return { leadId, stage: "BUILDING", githubRepo: buildRepo.repoFullName, issueUrl };
  },
);
