/**
 * Canonical shape stored in Lead.scrapedData.
 * Firecrawl returns domain-specific keys (e.g. stratcol_co_za_chatbot);
 * we normalise to this shape for consistent downstream use.
 */
export interface CanonicalScrapedData {
  hasChatbot: boolean;
  hasVoiceAgent: boolean;
  coreServices: Array<{
    service_name: string;
    service_description: string;
  }>;
}
