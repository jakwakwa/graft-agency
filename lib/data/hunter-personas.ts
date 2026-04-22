export interface HunterPersona {
  id: string;
  name: string;
  role: string;
  subtitle: string;
  tags: string[];
  description: string;
  promptModifier: string;
  keywordBoosts: string[];
}

export const HUNTER_PERSONAS: HunterPersona[] = [
  {
    id: "modern-sales-rep",
    name: "Modern",
    role: "Sales Rep",
    subtitle: "Ruthless Scout",
    tags: ["#Innovation", "#Security"],
    description: "Aggressive and creative problem identifier. Leads with competitor pressure and ROI urgency.",
    promptModifier:
      "Write with urgency and ROI metrics. Lead with what competitors are already doing with AI. Focus on top-line revenue impact and what they're losing by not acting.",
    keywordBoosts: ["no chatbot", "manual process", "small team"],
  },
  {
    id: "agency-cto",
    name: "Agency",
    role: "CTO",
    subtitle: "Technical Lead",
    tags: ["#Efficiency", "#DevOps"],
    description: "Focuses on scalability, security, and cloud migration. Speaks the language of engineers.",
    promptModifier:
      "Speak to integration simplicity, API-first architecture, and engineering ROI. Mention specific tech stack compatibility and how the solution plugs into existing infrastructure.",
    keywordBoosts: ["legacy systems", "API integration", "technical debt"],
  },
  {
    id: "sme-champion",
    name: "SME",
    role: "Champion",
    subtitle: "Local Business Ally",
    tags: ["#Local", "#CostSavings"],
    description: "Builds trust with owner-operated SMEs through warm, cost-conscious outreach.",
    promptModifier:
      "Keep tone warm and relatable. Focus on time saved per week and staff cost reduction. Avoid jargon. Reference local context (load-shedding, South African market conditions).",
    keywordBoosts: ["small business", "owner-operated", "no staff", "local"],
  },
  {
    id: "fintech-insider",
    name: "FinTech",
    role: "Insider",
    subtitle: "Compliance Closer",
    tags: ["#Fintech", "#Compliance"],
    description: "Navigates regulated industries with precision. Audit-trail and POPIA-aware pitching.",
    promptModifier:
      "Emphasise compliance safety, POPIA adherence, audit trails, and FICA process automation. Lead with risk reduction, not just efficiency.",
    keywordBoosts: ["financial services", "compliance", "accounting", "bookkeeping"],
  },
  {
    id: "growth-hacker",
    name: "Growth",
    role: "Hacker",
    subtitle: "Pipeline Maximizer",
    tags: ["#Growth", "#Funnel"],
    description: "Data-driven closer obsessed with conversion metrics and pipeline velocity.",
    promptModifier:
      "Use conversion metrics and pipeline velocity language. Reference what percentage of leads typically drop off and how AI plugs the gap. Suggest A/B framing where relevant.",
    keywordBoosts: ["ecommerce", "leads", "conversions", "missed calls"],
  },
  {
    id: "consultative-advisor",
    name: "Advisor",
    role: "Consultant",
    subtitle: "Trust Builder",
    tags: ["#Enterprise", "#Relationship"],
    description: "Long-game enterprise advisor. Earns trust before pitching — suggests discovery over close.",
    promptModifier:
      "Lead with understanding their business first. Offer a no-obligation discovery call. Do not hard-sell. Reference industry trends and position us as a thought partner.",
    keywordBoosts: ["enterprise", "B2B", "consulting", "professional services"],
  },
  {
    id: "healthtech-specialist",
    name: "HealthTech",
    role: "Specialist",
    subtitle: "Patient Flow Expert",
    tags: ["#Healthcare", "#Efficiency"],
    description: "Targets clinics and practices with patient throughput and appointment automation angles.",
    promptModifier:
      "Focus on appointment no-shows, after-hours call handling, and patient communication. Reference how AI can handle routine queries without clinical staff involvement.",
    keywordBoosts: ["clinic", "medical practice", "dental", "healthcare", "appointments"],
  },
  {
    id: "ecom-accelerator",
    name: "eComm",
    role: "Accelerator",
    subtitle: "Conversion Hunter",
    tags: ["#DTC", "#Automation"],
    description: "Targets online retailers with cart recovery, support automation, and upsell AI angles.",
    promptModifier:
      "Lead with cart abandonment rates, support ticket volume, and upsell automation. Quantify the revenue left on the table from slow response times and manual support.",
    keywordBoosts: ["online store", "shopify", "ecommerce", "DTC", "cart abandonment"],
  },
];
