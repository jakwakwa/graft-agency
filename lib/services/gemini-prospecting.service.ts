import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import prisma from "@/lib/db/prisma";
import type { Prisma } from "../../generated/prisma/client";
import {
  normalizeProspectCompanyName,
  normalizeProspectWebsiteUrl,
  prospectIdentityKeys,
  scrapedDataWebsiteUrl,
} from "@/lib/utils/prospect-dedupe";
import { SsrfRejectedError, safeFetch, toAbsoluteUrl } from "@/lib/utils/safe-fetch";

interface ProspectResult {
  companyName: string;
  websiteUrl: string;
  aiPresence: boolean;
  painPoints: string[];
  auditSummary: string;
  draftSubject: string;
  draftBody: string;
}

/** Cap CRM rows injected into prompts to stay within model context. */
const MAX_EXCLUSIONS_IN_PROMPT = 120;

export type ProspectingRunResult = {
  added: number;
  duplicates: number;
  errors: number;
  rejected: number;
};

function formatCrmExclusionBlock(leads: { customerName: string | null; scrapedData: unknown }[]): string {
  const lines: string[] = [];
  let stoppedEarly = false;
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    if (!lead) continue;
    const name = lead.customerName?.trim() ?? "";
    const url = scrapedDataWebsiteUrl(lead.scrapedData) ?? "";
    if (!name && !url) continue;
    lines.push(`- ${name || "(unknown name)"}${url ? ` | ${url}` : ""}`);
    if (lines.length >= MAX_EXCLUSIONS_IN_PROMPT) {
      stoppedEarly = i < leads.length - 1;
      break;
    }
  }
  if (lines.length === 0) {
    return "(No existing CRM records with names or websites yet.)";
  }
  const suffix = stoppedEarly ? `\n(Additional CRM records exist; duplicates are still filtered server-side.)` : "";
  return `${lines.join("\n")}${suffix}`;
}

async function loadCrmExclusionSets(clientId: string): Promise<{
  excludedNameKeys: Set<string>;
  excludedUrlKeys: Set<string>;
  leads: { customerName: string | null; scrapedData: unknown }[];
}> {
  const leads = await prisma.lead.findMany({
    where: { clientId },
    select: { customerName: true, scrapedData: true },
  });

  const excludedNameKeys = new Set<string>();
  const excludedUrlKeys = new Set<string>();

  for (const lead of leads) {
    if (lead.customerName) {
      const nk = normalizeProspectCompanyName(lead.customerName);
      if (nk) excludedNameKeys.add(nk);
    }
    const url = scrapedDataWebsiteUrl(lead.scrapedData);
    if (url) {
      const uk = normalizeProspectWebsiteUrl(url);
      if (uk) excludedUrlKeys.add(uk);
    }
  }

  return { excludedNameKeys, excludedUrlKeys, leads };
}

async function verifyProspects(
  prospects: ProspectResult[],
  ai: GoogleGenAI
): Promise<{ verified: ProspectResult[]; rejectedCount: number }> {
  if (prospects.length === 0) return { verified: [], rejectedCount: 0 };

  const reachableButBlockedStatuses = new Set([401, 403, 429]);

  const tierAResults = await Promise.all(
    prospects.map(async (p) => {
      // Build an absolute URL for network checks; normalizeProspectWebsiteUrl is
      // for identity/dedupe only (it strips the scheme).
      const absoluteUrl = toAbsoluteUrl(p.websiteUrl);
      if (!absoluteUrl) return { prospect: p, passed: false };

      try {
        const res = await safeFetch(absoluteUrl, {
          method: "GET",
          signal: AbortSignal.timeout(6000),
        });
        // 2xx/3xx are fine. Accept a small subset of 4xx statuses that can still
        // indicate a reachable site that is blocking or rate-limiting requests.
        // Reject other 4xx statuses such as 404/410, and reject 5xx responses.
        return { prospect: p, passed: res.ok || reachableButBlockedStatuses.has(res.status) };
      } catch (err) {
        if (err instanceof SsrfRejectedError) {
          return { prospect: p, passed: false };
        }
        return { prospect: p, passed: false };
      }
    })
  );

  const survivingTierA = tierAResults.filter((r) => r.passed).map((r) => r.prospect);
  const tierARejectedCount = prospects.length - survivingTierA.length;

  if (survivingTierA.length === 0) {
    return { verified: [], rejectedCount: tierARejectedCount };
  }

  // Tier B - LLM Judge
  try {
    const listForGemini = survivingTierA.map((p) => ({
      companyName: p.companyName,
      websiteUrl: p.websiteUrl,
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `For each entry below, use Google Search to confirm (a) the company is a real, currently operating business and (b) the URL actually resolves to that company's official site. Return exists=false if you cannot find evidence; do NOT guess.

List:
${JSON.stringify(listForGemini, null, 2)}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              companyName: { type: Type.STRING },
              websiteUrl: { type: Type.STRING },
              exists: { type: Type.BOOLEAN },
              websiteMatchesCompany: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
            },
            required: ["companyName", "websiteUrl", "exists", "websiteMatchesCompany"],
          },
        },
      },
    });

    const results = JSON.parse(response.text ?? "[]") as Array<{
      companyName: string;
      websiteUrl: string;
      exists: boolean;
      websiteMatchesCompany: boolean;
    }>;

    const verified = survivingTierA.filter((p) => {
      const match = results.find(
        (r) =>
          normalizeProspectWebsiteUrl(r.websiteUrl) === normalizeProspectWebsiteUrl(p.websiteUrl)
      );
      return match?.exists && match?.websiteMatchesCompany;
    });

    return {
      verified,
      rejectedCount: tierARejectedCount + (survivingTierA.length - verified.length),
    };
  } catch (err) {
    console.error("Tier B verification failed, falling back to Tier A results:", err);
    return { verified: survivingTierA, rejectedCount: tierARejectedCount };
  }
}

export const geminiProspectingService = {
  async findAndAuditProspects(config: {
    clientId: string;
    searchCriteria: { industries?: string[]; locations?: string[]; keywords?: string[] } | null;
    valueProposition?: string | null;
  }): Promise<ProspectingRunResult> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");

    const { excludedNameKeys, excludedUrlKeys, leads } = await loadCrmExclusionSets(config.clientId);
    const crmExclusionBlock = formatCrmExclusionBlock(leads);

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

    const exclusionInstructions = `
The following companies are already in our CRM. You must NOT suggest, return, or audit any of them — find different real businesses only.

Already in CRM (company name and/or website):
${crmExclusionBlock}
`;

    // Step 1: Find businesses using Google Search (grounded)
    const mapsResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find 5 real businesses matching this target: "${targetAudience}". Return their names and any available website URLs or contact info.

${exclusionInstructions}

Return only businesses that are clearly NOT in the CRM list above. If a match would overlap the list, pick a different company.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const businessesFound = mapsResponse.text ?? "";

    // Step 2: Audit each business and draft personalised outreach emails
    const prompt = `Here are some businesses found:
${businessesFound}

${exclusionInstructions}

For each of these businesses (only those not in the CRM list):
1. Use Google Search to find their actual website URL if not provided, and audit their online presence to determine if they are currently using visible AI technologies (like chatbots, AI agents, or voice agents).
2. Identify 2-3 potential pain points based on their industry and online presence.
3. Draft a highly personalised cold outreach email offering this value proposition: "${valueProposition}". The email should mention a specific pain point and how our solution helps. Keep it concise and professional.

Omit any business that matches the CRM list by name or website. Return the results as a JSON array (may be fewer than 5 if some were excluded).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
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
    let prospects: ProspectResult[];
    try {
      prospects = JSON.parse(text) as ProspectResult[];
      if (!Array.isArray(prospects)) prospects = [];
    } catch {
      return { added: 0, duplicates: 0, errors: 1, rejected: 0 };
    }

    // Step 3: Verify prospects to filter hallucinations
    const { verified: verifiedProspects, rejectedCount } = await verifyProspects(prospects, ai);

    let added = 0;
    let duplicates = 0;
    let errors = 0;

    const seenInBatchNameKeys = new Set<string>();
    const seenInBatchUrlKeys = new Set<string>();

    const leadsToCreate: Prisma.LeadCreateManyInput[] = [];

    for (const prospect of verifiedProspects) {
      const { nameKey, urlKey } = prospectIdentityKeys(prospect.companyName, prospect.websiteUrl);

      const matchesCrm =
        (nameKey.length > 0 && excludedNameKeys.has(nameKey)) || (urlKey.length > 0 && excludedUrlKeys.has(urlKey));
      const matchesBatch =
        (nameKey.length > 0 && seenInBatchNameKeys.has(nameKey)) ||
        (urlKey.length > 0 && seenInBatchUrlKeys.has(urlKey));

      if (matchesCrm || matchesBatch) {
        duplicates++;
        continue;
      }

      if (!nameKey.length && !urlKey.length) {
        errors++;
        continue;
      }

      leadsToCreate.push({
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
      });

    }

    if (leadsToCreate.length > 0) {
      try {
        const result = await prisma.lead.createMany({
          data: leadsToCreate,
          skipDuplicates: true,
        });
        added += result.count;

        // update tracking sets only for successfully created batches
        for (const lead of leadsToCreate) {
          const { nameKey, urlKey } = prospectIdentityKeys(lead.customerName, scrapedDataWebsiteUrl(lead.scrapedData));
          if (nameKey.length > 0) {
            seenInBatchNameKeys.add(nameKey);
            excludedNameKeys.add(nameKey);
          }
          if (urlKey.length > 0) {
            seenInBatchUrlKeys.add(urlKey);
            excludedUrlKeys.add(urlKey);
          }
        }
      } catch {
        // fallback to per-row create to preserve partial progress
        for (const lead of leadsToCreate) {
          try {
            await prisma.lead.create({
              data: lead,
            });
            added++;
            const { nameKey, urlKey } = prospectIdentityKeys(lead.customerName, scrapedDataWebsiteUrl(lead.scrapedData));
            if (nameKey.length > 0) {
              seenInBatchNameKeys.add(nameKey);
              excludedNameKeys.add(nameKey);
            }
            if (urlKey.length > 0) {
              seenInBatchUrlKeys.add(urlKey);
              excludedUrlKeys.add(urlKey);
            }
          } catch {
            errors++;
          }
        }
      }
    }

    return { added, duplicates, errors, rejected: rejectedCount };
  },
};
