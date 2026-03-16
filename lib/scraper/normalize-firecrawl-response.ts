import type { CanonicalScrapedData } from "./types";

type UnknownRecord = Record<string, unknown>;

/**
 * Normalises Firecrawl agent response to our canonical scraped data shape.
 * Firecrawl returns domain-specific keys (e.g. stratcol_co_za_chatbot, stratcol_co_za_voice_agent)
 * based on the URL. We match by key patterns and extract the values.
 */
export function normalizeFirecrawlResponse(raw: unknown): CanonicalScrapedData {
  const obj = typeof raw === "object" && raw !== null ? (raw as UnknownRecord) : {};

  const hasChatbot = findBooleanByKeyPattern(obj, ["chatbot"], ["citation"]);
  const hasVoiceAgent = findBooleanByKeyPattern(obj, ["voice_agent"], ["citation"]);
  const coreServices = findCoreServicesArray(obj);

  return {
    hasChatbot,
    hasVoiceAgent,
    coreServices,
  };
}

function findBooleanByKeyPattern(obj: UnknownRecord, includePatterns: string[], excludePatterns: string[]): boolean {
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    const matchesInclude = includePatterns.some((p) => keyLower.includes(p));
    const matchesExclude = excludePatterns.some((p) => keyLower.includes(p));
    if (matchesInclude && !matchesExclude && typeof value === "boolean") {
      return value;
    }
  }
  return false;
}

function findCoreServicesArray(obj: UnknownRecord): CanonicalScrapedData["coreServices"] {
  for (const [key, value] of Object.entries(obj)) {
    if (!key.toLowerCase().includes("core_services")) continue;
    if (!Array.isArray(value)) continue;

    return value
      .filter((item): item is UnknownRecord => typeof item === "object" && item !== null)
      .map((item) => ({
        service_name: String(item.service_name ?? ""),
        service_description: String(item.service_description ?? ""),
      }))
      .filter((s) => s.service_name.length > 0);
  }
  return [];
}
