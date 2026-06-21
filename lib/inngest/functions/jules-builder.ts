import { slugFromCompanyName } from "@/lib/engagement/company-slug";
import { ensureJulesSession } from "@/lib/engagement/idempotency";
import { transitionStage } from "@/lib/engagement/stage-machine";
import { inngest } from "@/lib/inngest/client";
import { defaultJulesGithubSource } from "@/lib/services/jules-github.service";
import type { DesignConcept, ProfiledNeeds } from "@/lib/types/engagement";
import { makeOnFailure } from "./_shared/on-failure";

export const julesBuilderHandler = async ({
  event,
  step,
}: {
  event: {
    data: Record<string, unknown>;
  };
  step: {
    run: <T>(id: string, fn: () => T | Promise<T>) => Promise<T>;
    sendEvent: (
      id: string,
      event: {
        name: string;
        data: Record<string, unknown>;
      },
    ) => Promise<unknown>;
  };
}) => {
  const { leadId, clientId, profiledNeeds, prdContent, designConcepts, chosenDesignIndex } = event.data as {
    leadId: string;
    clientId: string;
    profiledNeeds: ProfiledNeeds;
    prdContent: string;
    designConcepts: DesignConcept[];
    chosenDesignIndex: number;
  };

  await step.run("mark-building", () => transitionStage({ leadId, to: "BUILDING", source: "jules-builder" }));

  const isStitchDisabled =
    process.env.STITCH_TEMP_DISABLE === "1" ||
    process.env.STITCH_TEMP_DISABLE === "true" ||
    !designConcepts ||
    designConcepts.length === 0;

  let designDescription: string | undefined;

  if (!isStitchDisabled) {
    const chosenDesign = designConcepts[chosenDesignIndex] ?? designConcepts[0];
    if (!chosenDesign) throw new Error("No design concept found");

    designDescription = `**${chosenDesign.name}**

${chosenDesign.description}


Key components: ${chosenDesign.components.join(", ")}
Style keywords: ${chosenDesign.styleKeywords.join(", ")}${chosenDesign.htmlUrl ? `\n\nStitch design HTML reference: ${chosenDesign.htmlUrl}` : ""}${chosenDesign.screenshotUrl ? `\nStitch design screenshot: ${chosenDesign.screenshotUrl}` : ""}`;
  }

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
};

export const julesBuilderFunction = inngest.createFunction(
  {
    id: "jules-builder",
    name: "Jules Builder",
    retries: 1,
    idempotency: "event.data.leadId",
    onFailure: makeOnFailure("jules-builder", "BUILDING"),
    triggers: [{ event: "engagement/design.completed" }],
  },
  julesBuilderHandler,
);

function buildJulesPrompt(params: {
  profiledNeeds: ProfiledNeeds;
  prdContent: string;
  designDescription?: string;
  companySlug: string;
}): string {
  const dir = `prospects/${params.companySlug}`;

  const designSection = params.designDescription
    ? `

## Design Specification

${params.designDescription}

---`
    : "";

  const step1 = params.designDescription
    ? `1. Create a self-contained Next.js landing page inside \`${dir}/\``
    : `1. Create a self-contained Next.js landing page inside \`${dir}/\`. You must rely solely on the generated PRD above for all design, layout, structure, and color choices.`;

  return `## Build Request — GRAFT.TODAY Prospect Landing Page

${params.prdContent}

---${designSection}

## Build Instructions

Use the \`.agents/skills/frontend-design/SKILL.md\` skill to build the landing page. 
 - It will do most of the heavy lifting for you. 
 - This skill is not a one-shot - you will have to iterate with it a few times to get it right.

Write ALL files inside the directory \`${dir}/\` — do not modify anything outside this directory.

${step1}
2. The landing page should clearly communicate the product's value proposition to the prospect
3. Stack: Next.js 15 App Router, Tailwind CSS v4, TypeScript (or plain HTML/CSS if simpler)
4. Must look polished and professional — this is a sales pitch page, not a prototype skeleton
5. No backend needed — all content is static
6. Do not modify deployment infrastructure files outside \`${dir}/\` (Render service provisioning is handled by the pipeline)
7. All pages must be responsive (mobile-first)
8. Open a PR titled: \`feat: prospect landing page — ${params.profiledNeeds.companyName}\`

The parent pipeline deploys this branch to Render for the prospect (live service URL and/or PR preview).`;
}
