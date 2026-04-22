export type ProductType = "web-app" | "website" | "mobile-app" | "dashboard" | "saas";
export type Complexity = "simple" | "medium" | "complex";

export interface ProfiledNeeds {
  leadId: string;
  companyName: string;
  websiteUrl: string;
  industry: string;
  painPoints: string[];
  primaryNeed: string;
  productType: ProductType;
  targetAudience: string;
  estimatedComplexity: Complexity;
}

export interface DesignConcept {
  index: number;
  name: string;
  description: string;
  colorScheme: { primary: string; background: string; text: string };
  components: string[];
  styleKeywords: string[];
  screenId: string;
  projectId: string;
  screenshotUrl?: string;
  htmlUrl?: string;
}

export interface LeadPipelineEvent {
  leadId: string;
  clientId: string;
  stage: string;
  profiledNeeds?: ProfiledNeeds;
  prdContent?: string;
  designConcepts?: DesignConcept[];
  chosenDesignIndex?: number;
  githubRepo?: string;
  deploymentUrl?: string;
  error?: string;
}
