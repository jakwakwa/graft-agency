import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";
import { createJulesSession } from "@/lib/services/jules-github.service";
import type { DesignConcept, ProfiledNeeds } from "@/lib/types/engagement";

function getJulesRepoSource(): string {
  return process.env.JULES_SOURCE_REPO?.trim() ?? "sources/github/jakwakwa/graft-today-engagement-demo-builds";
}

export const julesBuilderFunction = inngest.createFunction(
  {
    id: "jules-builder",
    name: "Jules Builder",
    triggers: [{ event: "engagement/design.completed" }],
  },
  async ({ event, step }) => {
    const { leadId, clientId, profiledNeeds, prdContent, designConcepts, chosenDesignIndex } = event.data as {
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

    const chosenDesign = designConcepts[chosenDesignIndex] ?? designConcepts[0];
    if (!chosenDesign) throw new Error("No design concept found");

    const designDescription = `**${chosenDesign.name}**

${chosenDesign.description}

Colour scheme:
- Primary: ${chosenDesign.colorScheme.primary}
- Background: ${chosenDesign.colorScheme.background}
- Text: ${chosenDesign.colorScheme.text}

Key components: ${chosenDesign.components.join(", ")}
Style keywords: ${chosenDesign.styleKeywords.join(", ")}${chosenDesign.htmlUrl ? `\n\nStitch design HTML reference: ${chosenDesign.htmlUrl}` : ""}${chosenDesign.screenshotUrl ? `\nStitch design screenshot: ${chosenDesign.screenshotUrl}` : ""}`;

    const companySlug = profiledNeeds.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);

    const repoSource = getJulesRepoSource();

    const session = await step.run("create-jules-session", async () =>
      createJulesSession({
        repoSource,
        startingBranch: "main",
        title: `Prospect landing page: ${profiledNeeds.companyName}`,
        prompt: buildJulesPrompt({ profiledNeeds, prdContent, designDescription, companySlug }),
        requirePlanApproval: false,
      }),
    );

    await step.run("save-build-info", () =>
      prisma.productSpec.update({
        where: { leadId },
        data: {
          githubRepo: repoSource,
          githubIssueUrl: session.sessionUrl,
          julesSessionId: session.sessionId,
          julesState: session.state,
          julesLastPolledAt: new Date(),
        },
      }),
    );

    await step.sendEvent("emit-build-started", {
      name: "engagement/build.started",
      data: {
        leadId,
        clientId,
        profiledNeeds,
        githubRepo: repoSource,
        issueUrl: session.sessionUrl,
        julesSessionId: session.sessionId,
      },
    });

    // Stage stays BUILDING. `jules-poller` drives the transition to
    // BUILDING_COMPLETE or FAILED based on the real Jules session state.
    return {
      leadId,
      stage: "BUILDING" as const,
      sessionId: session.sessionId,
      sessionUrl: session.sessionUrl,
    };
  },
);

function buildJulesPrompt(params: {
  profiledNeeds: ProfiledNeeds;
  prdContent: string;
  designDescription: string;
  companySlug: string;
}): string {
  const dir = `prospects/${params.companySlug}`;
  return `## Build Request — GRAFT.TODAY Prospect Landing Page

${params.prdContent}

---

## Design Specification

${params.designDescription}

---

## Build Instructions

Write ALL files inside the directory \`${dir}/\` — do not modify anything outside this directory.

1. Create a self-contained Next.js landing page inside \`${dir}/\`
2. The landing page should clearly communicate the product's value proposition to the prospect
3. Stack: Next.js 15 App Router, Tailwind CSS v4, TypeScript (or plain HTML/CSS if simpler)
4. Must look polished and professional — this is a sales pitch page, not a prototype skeleton
5. No backend needed — all content is static
6. Include a \`${dir}/render.yaml\` for Render preview deployments (see AGENTS.md for format)
7. All pages must be responsive (mobile-first)
8. Open a PR titled: \`feat: prospect landing page — ${params.profiledNeeds.companyName}\`

The output of this PR will be shown to the prospect as a Render preview URL to pitch GRAFT.TODAY's capabilities.`;
}
