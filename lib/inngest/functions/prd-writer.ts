import { GoogleGenAI } from "@google/genai";
import prisma from "@/lib/db/prisma";
import { transitionStage } from "@/lib/engagement/stage-machine";
import { inngest } from "@/lib/inngest/client";
import type { ProfiledNeeds } from "@/lib/types/engagement";
import { makeOnFailure } from "./_shared/on-failure";

export async function writePRD(needs: ProfiledNeeds): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a senior product manager writing a PRD for a prototype that will be built in 1 day by an AI coding agent (Jules).

Prospect: ${needs.companyName} (${needs.industry})
Website: ${needs.websiteUrl}
Primary need: ${needs.primaryNeed}
Product type: ${needs.productType}
Pain points: ${needs.painPoints.join("; ")}
Target audience: ${needs.targetAudience}
Complexity: ${needs.estimatedComplexity}

Write a PRD in Markdown. It must include:
1. **Problem Statement** — 2-3 sentences, very specific to this company
2. **Goals** — 3 bullet points
3. **Features (MVP)** — checklist of exactly what to build (no stretch goals; only what fits in 1 day)
4. **Tech Stack** — Next.js 15 App Router, Tailwind CSS, shadcn/ui, Vercel. Do NOT deviate from this stack.
5. **User Stories** — 3-5 stories in "As a [role], I can [action]" format
6. **Success Metrics** — 2 measurable outcomes
7. **Design Direction** — 1 paragraph describing visual style (colours, tone, vibe). Use exactly this Markdown heading (level 2) so downstream tools can parse it: \`## Design Direction\`

Keep the MVP ruthlessly scoped. An AI agent must be able to implement this in 24 hours.`;

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 120_000);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    await step.run("mark-writing-prd", () =>
      transitionStage({ leadId, to: "WRITING_PRD", source: "prd-writer" }),
    );

    const prdContent = await step.run("write-prd", () => writePRD(profiledNeeds));

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
