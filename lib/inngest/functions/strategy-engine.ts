import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import prisma from "@/lib/db/prisma";
import { transitionStage } from "@/lib/engagement/stage-machine";
import { inngest } from "@/lib/inngest/client";
import type { CampaignSop, ProfiledNeeds } from "@/lib/types/engagement";
import { makeOnFailure } from "./_shared/on-failure";

/**
 * Strategy Engine — turns the PRD + operator objectives + the original cold-email
 * draft into a personalised Campaign SOP (refined outreach copy, strategy
 * narrative, and a visual framework that steers the downstream Stitch + Jules
 * build). Grounded with live web search for current cold-outreach best practice.
 */
export async function generateCampaignStrategy(params: {
  profiledNeeds: ProfiledNeeds;
  prdContent: string;
  engagementObjectives: string | null;
  draftSubject: string | null;
  draftBody: string | null;
}): Promise<CampaignSop> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");

  const { profiledNeeds: needs, prdContent, engagementObjectives, draftSubject, draftBody } = params;
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a senior outbound campaign strategist. Compose a personalised engagement campaign for a specific sales prospect.

Prospect: ${needs.companyName} (${needs.industry})
Website: ${needs.websiteUrl}
Primary need: ${needs.primaryNeed}
Pain points: ${needs.painPoints.join("; ")}
Target audience: ${needs.targetAudience}

Campaign objectives (from the operator):
${engagementObjectives?.trim() || "(none specified — infer sensible conversion goals from the prospect profile and PRD)"}

Existing draft cold email to refine:
Subject: ${draftSubject ?? "(none)"}
Body: ${draftBody ?? "(none)"}

Product requirements document (the solution being pitched):
${prdContent}

Do the following:
1. Use Google Search to find current best practices for B2B cold outreach in this prospect's industry.
2. Rewrite the cold email so it is concise, specific to this prospect, references a concrete pain point, and drives the reader to view a personalised demo (a CTA button will be inserted later — write the body so a "view your demo" call-to-action fits naturally).
3. Define the conversion objectives the campaign targets (use the operator's objectives if given, otherwise infer them).
4. Write a short human-readable strategy narrative (the operating procedure: who we're targeting, the angle, why it converts).
5. Describe a visual framework for a single-page personalised presentation/dashboard the prospect will see when they click the CTA — this is NOT a generic landing page; tailor it to what would most persuade THIS prospect.
6. Provide design-tone keywords (e.g. "luxury", "high-tech minimalism", "hyper-modern utility") that will steer the visual design system.

Output strictly as JSON matching the schema.`;

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 120_000);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            refinedEmail: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                body: { type: Type.STRING },
              },
              required: ["subject", "body"],
            },
            strategyNarrative: { type: Type.STRING },
            objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            visualFramework: { type: Type.STRING },
            designTone: { type: Type.ARRAY, items: { type: Type.STRING } },
            outreachBestPractices: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["refinedEmail", "strategyNarrative", "objectives", "visualFramework", "designTone"],
        },
      },
    });
    return JSON.parse(response.text ?? "{}") as CampaignSop;
  } finally {
    clearTimeout(timeout);
  }
}

export const strategyEngineFunction = inngest.createFunction(
  {
    id: "strategy-engine-agent",
    name: "Strategy Engine Agent",
    retries: 3,
    idempotency: "event.data.leadId",
    onFailure: makeOnFailure("strategy-engine", "WRITING_STRATEGY"),
    triggers: [{ event: "engagement/prd.written" }],
  },
  async ({ event, step }) => {
    const { leadId, clientId, profiledNeeds, prdContent } = event.data as {
      leadId: string;
      clientId: string;
      profiledNeeds: ProfiledNeeds;
      prdContent: string;
    };

    await step.run("mark-writing-strategy", () =>
      transitionStage({ leadId, to: "WRITING_STRATEGY", source: "strategy-engine" }),
    );

    const inputs = await step.run("load-strategy-inputs", async () => {
      const [lead, spec] = await Promise.all([
        prisma.lead.findUnique({ where: { id: leadId }, select: { scrapedData: true } }),
        prisma.productSpec.findUnique({ where: { leadId }, select: { engagementObjectives: true } }),
      ]);
      const scraped = (lead?.scrapedData ?? {}) as Record<string, unknown>;
      return {
        engagementObjectives: spec?.engagementObjectives ?? null,
        draftSubject: typeof scraped.draftSubject === "string" ? scraped.draftSubject : null,
        draftBody: typeof scraped.draftBody === "string" ? scraped.draftBody : null,
      };
    });

    const campaignSop = await step.run("generate-strategy", () =>
      generateCampaignStrategy({
        profiledNeeds,
        prdContent,
        engagementObjectives: inputs.engagementObjectives,
        draftSubject: inputs.draftSubject,
        draftBody: inputs.draftBody,
      }),
    );

    await step.run("save-strategy", () =>
      transitionStage({
        leadId,
        to: "STRATEGY_COMPLETE",
        source: "strategy-engine",
        data: { campaignSop: campaignSop as never },
      }),
    );

    await step.sendEvent("emit-strategy-completed", {
      name: "engagement/strategy.completed",
      data: { leadId, clientId, profiledNeeds, prdContent, campaignSop },
    });

    return { leadId, stage: "STRATEGY_COMPLETE" };
  },
);
