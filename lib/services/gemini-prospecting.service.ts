import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import prisma from "@/lib/db/prisma";

interface ProspectResult {
  companyName: string;
  websiteUrl: string;
  aiPresence: boolean;
  painPoints: string[];
  auditSummary: string;
  draftSubject: string;
  draftBody: string;
}

export const geminiProspectingService = {
  async findAndAuditProspects(config: {
    clientId: string;
    searchCriteria: { industries?: string[]; locations?: string[]; keywords?: string[] } | null;
    valueProposition?: string | null;
  }): Promise<{ created: number; errors: number }> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");

    const ai = new GoogleGenAI({ apiKey });

    const criteria = config.searchCriteria ?? {};
    const industries = criteria.industries ?? [];
    const locations = criteria.locations ?? [];
    const keywords = criteria.keywords ?? [];

    const targetAudience =
      [
        industries.length ? industries.join(", ") : "",
        locations.length ? `in ${locations.join(", ")}` : "",
        keywords.length ? `(${keywords.join(", ")})` : "",
      ]
        .filter(Boolean)
        .join(" ")
        .trim() || "small businesses";

    const valueProposition = config.valueProposition ?? "AI automation solutions to save time and grow revenue";

    // Step 1: Find businesses using Google Search (grounded)
    const mapsResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `Find 3 real businesses matching this target: "${targetAudience}". Return their names and any available website URLs or contact info.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const businessesFound = mapsResponse.text ?? "";

    // Step 2: Audit each business and draft personalised outreach emails
    const prompt = `Here are some businesses found:
${businessesFound}

For each of these businesses:
1. Use Google Search to find their actual website URL if not provided, and audit their online presence to determine if they are currently using visible AI technologies (like chatbots, AI agents).
2. Identify 2-3 potential pain points based on their industry and online presence.
3. Draft a highly personalised cold outreach email offering this value proposition: "${valueProposition}". The email should mention a specific pain point and how our solution helps. Keep it concise and professional.

Return the results as a JSON array.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              companyName: { type: Type.STRING },
              websiteUrl: { type: Type.STRING },
              aiPresence: {
                type: Type.BOOLEAN,
                description: "True if they already have AI/chatbots visible on their site",
              },
              painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              auditSummary: {
                type: Type.STRING,
                description: "Short summary of their online presence and why they are a good fit.",
              },
              draftSubject: { type: Type.STRING, description: "Cold email subject line" },
              draftBody: {
                type: Type.STRING,
                description: "The personalised outreach email body.",
              },
            },
            required: [
              "companyName",
              "websiteUrl",
              "aiPresence",
              "painPoints",
              "auditSummary",
              "draftSubject",
              "draftBody",
            ],
          },
        },
      },
    });

    const text = response.text ?? "[]";
    const prospects: ProspectResult[] = JSON.parse(text);

    let created = 0;
    let errors = 0;

    for (const prospect of prospects) {
      try {
        await prisma.lead.create({
          data: {
            clientId: config.clientId,
            customerName: prospect.companyName,
            source: "OUTBOUND_PROSPECT",
            status: "DRAFT_PENDING",
            scrapedData: {
              websiteUrl: prospect.websiteUrl,
              draftSubject: prospect.draftSubject,
              draftBody: prospect.draftBody,
              businessDescription: prospect.auditSummary,
              hasChatbot: prospect.aiPresence,
              hasVoiceAgent: false,
              painPoints: prospect.painPoints,
              targetOutreachAngle: "",
              coreServices: [],
            },
          },
        });
        created++;
      } catch {
        errors++;
      }
    }

    return { created, errors };
  },
};
