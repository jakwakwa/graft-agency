import { slugFromCompanyName } from "@/lib/engagement/company-slug";
import { ensureJulesSession } from "@/lib/engagement/idempotency";
import { transitionStage } from "@/lib/engagement/stage-machine";
import { inngest } from "@/lib/inngest/client";
import { defaultJulesGithubSource } from "@/lib/services/jules-github.service";
import type { DesignConcept, ProfiledNeeds } from "@/lib/types/engagement";
import { makeOnFailure } from "./_shared/on-failure";

export const julesBuilderFunction = inngest.createFunction(
  {
    id: "jules-builder",
    name: "Jules Builder",
    retries: 1,
    idempotency: "event.data.leadId",
    onFailure: makeOnFailure("jules-builder", "BUILDING"),
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

    await step.run("mark-building", () => transitionStage({ leadId, to: "BUILDING", source: "jules-builder" }));

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

    const companySlug = slugFromCompanyName(profiledNeeds.companyName);

    const repoSource = defaultJulesGithubSource();

    // ensureJulesSession is idempotent: if a session was created in a prior attempt
    // it reuses it instead of creating a second one (preventing duplicate Unbroken-style runs).
    const { session } = await step.run("ensure-jules-session", () =>
      ensureJulesSession({
        leadId,
        companyName: profiledNeeds.companyName,
        companySlug,
        makePrompt: () => buildJulesPrompt({ profiledNeeds, prdContent, designDescription, companySlug }),
        repoSource,
        startingBranch: "main",
      }),
    );

    // Render service is provisioned in jules-poller after the PR exists, using the PR head branch
    // so `rootDir` resolves on the branch Jules actually pushed to (not `main` until merge).

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

    return {
      leadId,
      stage: "BUILDING" as const,
      sessionId: session.sessionId,
      sessionUrl: session.sessionUrl,
      renderServiceId: null,
      renderServiceUrl: null,
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
6. Do not modify deployment infrastructure files outside \`${dir}/\` (Render service provisioning is handled by the pipeline)
7. All pages must be responsive (mobile-first)
8. Open a PR titled: \`feat: prospect landing page — ${params.profiledNeeds.companyName}\`

The parent pipeline deploys this branch to Render for the prospect (live service URL and/or PR preview).`;
}
