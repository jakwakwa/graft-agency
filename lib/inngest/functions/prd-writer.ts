import { GoogleGenAI } from "@google/genai";
import prisma from "@/lib/db/prisma";
import { resolveBuildVariant } from "@/lib/engagement/build-variant";
import { transitionStage } from "@/lib/engagement/stage-machine";
import { inngest } from "@/lib/inngest/client";
import type { BuildVariant, ProfiledNeeds } from "@/lib/types/engagement";
import { makeOnFailure } from "./_shared/on-failure";

/**
 * The structured `## Design Direction` block both variants must emit — it is the
 * contract `stitch-designer` parses, so the sub-headings must stay identical.
 */
const DESIGN_DIRECTION_SPEC = `**Design Direction** — A comprehensive, structured design brief. Use exactly this Markdown heading (level 2): \`## Design Direction\`. Within this section, use the following sub-headings (level 3):

   ### Visual Effects
   Name the primary visual effect to apply across the UI (e.g. "heavy glassmorphism", "neumorphism", "bold gradients"). Describe how to apply it (frosted glass panels, translucent overlays, background blur, etc).

   ### Section Layout
   One bullet per major page section. For each section, describe its purpose and ideal layout in one sentence.

   ### UI Elements
   List 2-4 specific interactive UI elements to include. Be specific about placement and style.

   ### Imagery Direction
   One paragraph describing what real-world imagery to use (specific to the prospect's industry) and what to explicitly AVOID (e.g. "no software dashboards, no tech illustrations, no generic stock photos").

   ### Colour Palette
   Provide at least 6 named colours with hex codes in this exact format:
   - Background: #XXXXXX
   - Surface: #XXXXXX
   - Primary: #XXXXXX
   - On-Primary: #XXXXXX
   - Secondary: #XXXXXX
   - On-Surface: #XXXXXX
   - On-Surface Variant: #XXXXXX
   - Outline: rgba(X, X, X, X)

   ### Typography
   Name a specific, tailored headline font (e.g. "Newsreader" or "Cabinet Grotesk") and a distinctive body font (e.g. "Geist", "Outfit", or "DM Sans"). Do NOT default to "Inter" or "Playfair Display". Be creative and match the fonts to the project's vibe. Include the font category.

   ### Theme Mode
   State "dark" or "light".`;

function buildLandingPrdPrompt(needs: ProfiledNeeds): string {
  return `You are a senior product manager writing a PRD for a prototype that will be built in 1 day by an AI coding agent (Jules).

Prospect: ${needs.companyName} (${needs.industry})
Website: ${needs.websiteUrl}
Primary need: ${needs.primaryNeed}
Product type: ${needs.productType}
Pain points: ${needs.painPoints.join("; ")}
Target audience: ${needs.targetAudience}
Complexity: ${needs.estimatedComplexity}

Write a PRD in Markdown for a polished LANDING PAGE / product prototype for ${needs.companyName}. It must include:
1. **Problem Statement** — 2-3 sentences, very specific to this company
2. **Goals** — 3 bullet points
3. **Features (MVP)** — checklist of exactly what to build (no stretch goals; only what fits in 1 day)
4. **Tech Stack** — Next.js 15 App Router, Tailwind CSS, shadcn/ui, Vercel. Do NOT deviate from this stack.
5. **User Stories** — 3-5 stories in "As a [role], I can [action]" format
6. **Success Metrics** — 2 measurable outcomes
7. ${DESIGN_DIRECTION_SPEC}

For Section Layout, include at least: Hero, Features/Services, Social Proof/Lifestyle, and Footer/CTA.

Keep the MVP ruthlessly scoped. An AI agent must be able to implement this in 24 hours.`;
}

function buildCampaignPrdPrompt(needs: ProfiledNeeds): string {
  return `You are a senior product manager writing a PRD for a personalised ENGAGEMENT CAMPAIGN PRESENTATION (a single-page "campaign dashboard") that an AI coding agent (Jules) will build in 1 day.

IMPORTANT: This is NOT ${needs.companyName}'s own website or a landing page for their business. It is a high-fidelity, single-page sales presentation that ${needs.companyName} will land on when they click the call-to-action in our cold outreach email. Its only job is to persuade ${needs.companyName} to engage with US — by showing we understand their business and can solve their pain points.

Prospect being pitched: ${needs.companyName} (${needs.industry})
Website: ${needs.websiteUrl}
Their primary need: ${needs.primaryNeed}
Their pain points: ${needs.painPoints.join("; ")}
Who they serve: ${needs.targetAudience}

Write a PRD in Markdown for this campaign presentation. It must include:
1. **Problem Statement** — 2-3 sentences naming the specific pain points of ${needs.companyName} that this campaign speaks to.
2. **Goals** — 3 bullet points framed as CONVERSION goals for the presentation (e.g. book a call, reply, request the build) — not goals for the prospect's own product.
3. **Features (MVP)** — the SECTIONS of the single-page presentation, as a checklist. Cover: a personalised hero pitch addressed to ${needs.companyName}; a short "we see your problem" diagnosis of their pain points; a preview of the solution we'd build for them; credibility/proof; and a prominent primary call-to-action (book a call / reply). No multi-page nav, no real backend.
4. **Tech Stack** — Next.js 15 App Router, Tailwind CSS, shadcn/ui, Vercel. Do NOT deviate from this stack.
5. **User Stories** — 3-5 stories from the prospect's point of view as they read the pitch ("As ${needs.companyName}, I can …").
6. **Success Metrics** — 2 measurable conversion outcomes (e.g. CTA click-through, call booked).
7. ${DESIGN_DIRECTION_SPEC}

For Section Layout, describe the presentation's sections: Personalised Hero Pitch, Pain-Point Diagnosis, Solution Preview, Proof/Credibility, and a strong Call-to-Action.

Keep it ruthlessly scoped to a single persuasive page an AI agent can implement in 24 hours.`;
}

export async function writePRD(needs: ProfiledNeeds, buildVariant: BuildVariant = "campaign"): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = buildVariant === "campaign" ? buildCampaignPrdPrompt(needs) : buildLandingPrdPrompt(needs);

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 120_000);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });
    return response.text ?? "";
  } finally {
    clearTimeout(timeout);
  }
}

export const prdWriterFunction = inngest.createFunction(
  {
    id: "prd-writer-agent",
    name: "PRD Writer Agent",
    retries: 3,
    idempotency: "event.data.leadId",
    onFailure: makeOnFailure("prd-writer", "WRITING_PRD"),
    triggers: [{ event: "engagement/lead.profiled" }],
  },
  async ({ event, step }) => {
    const { leadId, clientId, profiledNeeds } = event.data as {
      leadId: string;
      clientId: string;
      profiledNeeds: ProfiledNeeds;
    };

    await step.run("mark-writing-prd", () => transitionStage({ leadId, to: "WRITING_PRD", source: "prd-writer" }));

    const buildVariant = await step.run("resolve-build-variant", async () => {
      const spec = await prisma.productSpec.findUnique({ where: { leadId }, select: { buildVariant: true } });
      return resolveBuildVariant(spec?.buildVariant);
    });

    const prdContent = await step.run("write-prd", () => writePRD(profiledNeeds, buildVariant));

    await step.run("save-prd", () =>
      transitionStage({ leadId, to: "PRD_WRITTEN", source: "prd-writer", data: { prdContent } }),
    );

    await step.sendEvent("emit-prd-written", {
      name: "engagement/prd.written",
      data: { leadId, clientId, profiledNeeds, prdContent },
    });

    return { leadId, stage: "PRD_WRITTEN" };
  },
);
