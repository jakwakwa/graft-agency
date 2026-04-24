import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import prisma from "@/lib/db/prisma";
import { transitionStage } from "@/lib/engagement/stage-machine";
import { inngest } from "@/lib/inngest/client";
import type { ProfiledNeeds } from "@/lib/types/engagement";
import { makeOnFailure } from "./_shared/on-failure";

export async function profileLead(leadId: string, clientId: string): Promise<ProfiledNeeds> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");

  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  const scraped = (lead.scrapedData ?? {}) as Record<string, any>;

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a product discovery expert. Based on this prospect profile, determine exactly what digital product would solve their core problem.

Company: ${scraped.companyName ?? lead.customerName}
Website: ${scraped.websiteUrl ?? "unknown"}
Current AI presence: ${scraped.aiPresence ? "Yes" : "No"}
Audit summary: ${scraped.auditSummary ?? ""}
Known pain points: ${(scraped.painPoints as string[] | undefined)?.join(", ") ?? ""}
Draft outreach context: ${scraped.draftBody ?? ""}

Research their industry deeply. Identify the single most impactful product that could be built in 1-2 days as a prototype.
Output your analysis as structured JSON matching the schema exactly.`;

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 120_000); // 2 min cap for Gemini w/ thinking + search
  let response: Awaited<ReturnType<typeof ai.models.generateContent>>;
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            websiteUrl: { type: Type.STRING },
            industry: { type: Type.STRING },
            painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            primaryNeed: { type: Type.STRING },
            productType: { type: Type.STRING, enum: ["web-app", "website", "dashboard", "saas"] },
            targetAudience: { type: Type.STRING },
            estimatedComplexity: { type: Type.STRING, enum: ["simple", "medium", "complex"] },
          },
          required: [
            "companyName",
            "websiteUrl",
            "industry",
            "painPoints",
            "primaryNeed",
            "productType",
            "targetAudience",
            "estimatedComplexity",
          ],
        },
      },
    });
  } finally {
    clearTimeout(timeout);
  }

  const needs = JSON.parse(response.text ?? "{}") as ProfiledNeeds;
  needs.leadId = leadId;
  return needs;
}

export const leadProfilerFunction = inngest.createFunction(
  {
    id: "lead-profiler-agent",
    name: "Lead Profiler Agent",
    retries: 3,
    idempotency: "event.data.leadId",
    onFailure: makeOnFailure("profiler", "PROFILING"),
    triggers: [{ event: "engagement/lead.approved" }],
  },
  async ({ event, step }) => {
    const { leadId, clientId } = event.data as { leadId: string; clientId: string };

    await step.run("mark-profiling", async () => {
      const existing = await prisma.productSpec.findUnique({ where: { leadId }, select: { stage: true } });
      if (!existing) {
        await prisma.productSpec.create({ data: { leadId, clientId, stage: "PROFILING", errorMessage: null } });
      } else {
        await transitionStage({ leadId, to: "PROFILING", source: "profiler", data: { errorMessage: null } });
      }
    });

    const profiledNeeds = await step.run("profile-lead", () => profileLead(leadId, clientId));

    await step.run("save-profiled-needs", () =>
      transitionStage({
        leadId,
        to: "PROFILED",
        source: "profiler",
        data: { profiledNeeds: profiledNeeds as never },
      }),
    );

    await step.sendEvent("emit-profiled", {
      name: "engagement/lead.profiled",
      data: { leadId, clientId, profiledNeeds },
    });

    return { leadId, stage: "PROFILED" };
  },
);
