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

export interface DesignSystemSpec {
  background: string;
  surface: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  headlineFont: string;
  bodyFont: string;
  effects?: string;
  themeMode?: string;
}

export interface DesignConcept {
  index: number;
  name: string;
  description: string;
  colorScheme: {
    primary: string;
    background: string;
    text: string;
    surface?: string;
    secondary?: string;
    onPrimary?: string;
  };
  components: string[];
  styleKeywords: string[];
  screenId: string;
  projectId: string;
  screenshotUrl?: string;
  htmlUrl?: string;
  /** Full design system spec passed to Stitch, forwarded to jules-builder */
  designSystem?: DesignSystemSpec;
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
  renderServiceId?: string;
  renderServiceUrl?: string;
  deploymentUrl?: string;
  error?: string;
}
