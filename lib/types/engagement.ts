export type ProductType = "web-app" | "website" | "mobile-app" | "dashboard" | "saas";
export type Complexity = "simple" | "medium" | "complex";

/** Which artifact Jules builds for an approved lead. */
export type BuildVariant = "landing" | "campaign";

/**
 * Prospect business archetype, used to pick the dark dashboard preset:
 * `traditional` → Obsidian Scholar (editorial), `niche` → Obsidian Precision.
 */
export type BusinessArchetype = "traditional" | "niche";

/**
 * Campaign Standard Operating Procedure — the operational blueprint produced by
 * the Strategy Engine. Persisted to `ProductSpec.campaignSop` and consumed by
 * Stitch (visual tone) and the offer-dispatcher draft (refined email copy).
 */
export interface CampaignSop {
  /** Refined cold-outreach email the operator forwards to the prospect. */
  refinedEmail: { subject: string; body: string };
  /** Human-readable strategy narrative / operating procedure. */
  strategyNarrative: string;
  /** Conversion objectives / KPIs the campaign targets. */
  objectives: string[];
  /** Visual framework + presentation guidance fed to Stitch and Jules. */
  visualFramework: string;
  /** Tone keywords / dial hints that steer the Stitch design variants. */
  designTone: string[];
  /** Whether the prospect is a traditional or flexible/niche business (drives dark preset choice). */
  businessArchetype?: BusinessArchetype;
  /** Best-practice notes sourced via grounded web search. */
  outreachBestPractices?: string[];
}

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
  engagementObjectives?: string;
  buildVariant?: BuildVariant;
  campaignSop?: CampaignSop;
  designConcepts?: DesignConcept[];
  chosenDesignIndex?: number;
  githubRepo?: string;
  renderServiceId?: string;
  renderServiceUrl?: string;
  deploymentUrl?: string;
  error?: string;
}
