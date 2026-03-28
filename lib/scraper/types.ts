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

/**
 * Structured audit data produced by Gemini generateObject from scraped markdown.
 * Stored in Lead.scrapedData alongside draft fields.
 */
export interface ProspectAudit {
  hasChatbot: boolean;
  hasVoiceAgent: boolean;
  businessDescription: string;
  coreServices: Array<{ name: string; description: string }>;
  painPoints: string[];
  targetOutreachAngle: string;
}

/**
 * Full shape stored in Lead.scrapedData for outbound prospects.
 * Combines audit data with the generated email draft.
 */
export interface OutboundLeadData extends ProspectAudit {
  websiteUrl?: string;
  draftSubject: string;
  draftBody: string;
}
