export interface LeadEngagement {
  stage: string;
  failedStage: string | null;
  deploymentUrl: string | null;
  designConcepts: unknown;
  chosenDesign: number | null;
  offerSentAt: string | null;
}

export interface LeadScrapedData {
  websiteUrl?: string;
  draftSubject?: string;
  draftBody?: string;
  hasChatbot?: boolean;
  hasVoiceAgent?: boolean;
  businessDescription?: string;
  coreServices?: Array<{ name: string; description: string }>;
  painPoints?: string[];
  targetOutreachAngle?: string;
  [key: string]: unknown;
}

export interface LeadItem {
  id: string;
  customerName: string | null;
  email: string | null;
  status: string;
  scrapedData: LeadScrapedData | null;
  engagement: LeadEngagement | null;
}
