import { type Screen, stitch } from "@google/stitch-sdk";
import type { DesignConcept, DesignSystemSpec } from "@/lib/types/engagement";

/**
 * @google/stitch-sdk — design variants for the engagement pipeline.
 * @see https://stitch.withgoogle.com/docs/sdk/ai-sdk/
 * Env: STITCH_API_KEY (required), STITCH_PROJECT_ID (optional, reuse one Stitch project per dev machine).
 */
export interface StitchDesignRequest {
  productName: string;
  description: string;
  styleHint: string;
  components: string[];
  /** e.g. "golf-club", "fintech", "restaurant" — drives imagery & tone */
  industry: string;
  /** e.g. "website", "web-app", "dashboard" */
  productType: string;
  /** Who the site is for — drives language & UX */
  targetAudience: string;
  /** Specific section-level layout instructions extracted from the PRD */
  sectionBriefs?: string[];
  /** Specific UI elements to include (e.g. "AI chatbot modal", "booking form") */
  uiElements?: string[];
  /** Imagery guidance — what images to show, what to avoid */
  imageryDirection?: string;
  /** Full design system spec (colours, typography, effects) */
  designSystem?: DesignSystemSpec;
}

// ---------------------------------------------------------------------------
// Fallbacks & defaults
// ---------------------------------------------------------------------------

const FALLBACK_SCHEMES: DesignConcept["colorScheme"][] = [
  { primary: "#2563eb", background: "#ffffff", text: "#111827" },
  { primary: "#7c3aed", background: "#0f172a", text: "#f8fafc" },
  { primary: "#f97316", background: "#f9fafb", text: "#1f2937" },
];

const DEFAULT_DESIGN_SYSTEM: DesignSystemSpec = {
  background: "#0F0F0F",
  surface: "#1A1A1A",
  primary: "#8B5CF6",
  onPrimary: "#FFFFFF",
  secondary: "#D4AF37",
  onSurface: "#F3F4F6",
  onSurfaceVariant: "#9CA3AF",
  outline: "rgba(255, 255, 255, 0.1)",
  headlineFont: "Playfair Display, serif",
  bodyFont: "Inter, sans-serif",
  effects: "glassmorphism",
  themeMode: "dark",
};

// ---------------------------------------------------------------------------
// Prompt builder — structured multi-section prompt
// ---------------------------------------------------------------------------

function buildBasePrompt(request: StitchDesignRequest): string {
  const ds = request.designSystem ?? DEFAULT_DESIGN_SYSTEM;
  const sections: string[] = [];

  // ── IDEA ──────────────────────────────────────────────────────────────────
  const ideaLines = [
    `A premium web landing page for ${request.productName}.`,
    `This is a real-world ${request.industry} ${request.productType}, NOT a SaaS or software company dashboard.`,
  ];
  if (ds.effects) {
    ideaLines.push(
      `Apply heavy ${ds.effects} effects (frosted glass, translucent panels with background blur, subtle light borders) to all cards, navigation bars, and overlays.`,
    );
  }
  ideaLines.push(
    `The vibe should be a premium blend of rich ${request.industry} tradition and ultra-modern digital excellence.`,
    `Use an elegant, traditional ${ds.headlineFont.split(",")[0]?.trim() ?? "serif"} font for headings and a clean, legible ${ds.bodyFont.split(",")[0]?.trim() ?? "sans-serif"} for body text.`,
    `Visual direction: ${request.styleHint}`,
  );
  sections.push(`# IDEA\n${ideaLines.join("\n")}`);

  // ── CONTENT & LAYOUT ─────────────────────────────────────────────────────
  if (request.sectionBriefs && request.sectionBriefs.length > 0) {
    const layoutLines = request.sectionBriefs.map((brief) => `- ${brief}`);
    sections.push(`# CONTENT & LAYOUT\n${layoutLines.join("\n")}`);
  } else {
    // Derive sensible defaults from components list
    const defaultLayout = request.components.map(
      (comp) =>
        `- ${comp}: A visually striking section showcasing the key value proposition for ${request.targetAudience}.`,
    );
    sections.push(`# CONTENT & LAYOUT\n${defaultLayout.join("\n")}`);
  }

  // ── SPECIFIC UI ELEMENTS ──────────────────────────────────────────────────
  if (request.uiElements && request.uiElements.length > 0) {
    const uiLines = request.uiElements.map((el) => `- ${el}`);
    sections.push(`# SPECIFIC UI ELEMENTS\n${uiLines.join("\n")}`);
  }

  // ── IMAGERY ───────────────────────────────────────────────────────────────
  if (request.imageryDirection) {
    sections.push(`# IMAGERY\n${request.imageryDirection}`);
  } else {
    sections.push(
      `# IMAGERY\nEnsure all background and card images depict real, high-end ${request.industry} scenery relevant to ${request.productName}. Absolutely no software dashboards, tech illustrations, or generic SaaS graphics.`,
    );
  }

  // ── DESIGN SYSTEM ─────────────────────────────────────────────────────────
  const designSystemBlock = [
    "# DESIGN SYSTEM",
    "## Overview",
    `A modern ${ds.themeMode ?? "dark"}-mode interface featuring deep backgrounds, vibrant primary accents, and elegant secondary tones. The system provides a high-contrast foundation perfectly suited for sleek modern UI aesthetics.`,
    "## Colours",
    `- **Background** (${ds.background}): Deepest base level for the application.`,
    `- **Surface** (${ds.surface}): Elevated cards, panels, and contained sections.`,
    `- **Primary** (${ds.primary}): Call-to-action buttons, active states, and key highlights.`,
    `- **On-Primary** (${ds.onPrimary}): High-contrast text on top of primary elements.`,
    `- **Secondary** (${ds.secondary}): Accent details and supporting UI components.`,
    `- **On-Surface** (${ds.onSurface}): Primary typography and core reading material.`,
    `- **On-Surface Variant** (${ds.onSurfaceVariant}): Muted text, secondary labels, and helper copy.`,
    `- **Outline** (${ds.outline}): Structural borders and subtle dividers.`,
    "## Typography",
    `- **Headlines & Display**: ${ds.headlineFont} for elegant, impactful focal points.`,
    `- **Body & Labels**: ${ds.bodyFont} for high legibility across standard interface elements and metadata.`,
    "## Background Images",
    `- **Cyber Gradient**: A dual-point radial gradient blending the primary and secondary colours, used for subtle atmospheric background illumination.`,
    "## Configuration",
    `- **Theme Strategy**: ${ds.themeMode ? ds.themeMode.charAt(0).toUpperCase() + ds.themeMode.slice(1) : "Dark"} mode.`,
  ];
  sections.push(designSystemBlock.join("\n"));

  // ── FINAL INSTRUCTION ─────────────────────────────────────────────────────
  sections.push(
    `One cohesive, premium landing page (desktop) combining all the above sections and design system. Target audience: ${request.targetAudience}.`,
  );

  return sections.join("\n\n");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function styleKeywordsFromHint(styleHint: string, index: number): string[] {
  const words = styleHint
    .split(/[\s,]+/)
    .map((w) => w.trim())
    .filter(Boolean)
    .slice(0, 4);
  const base = words.length > 0 ? words : ["modern", "clean", "product"];
  return [...base, `variant-${index + 1}`].slice(0, 5);
}

function screenLabel(screen: Screen, index: number): string {
  const data = screen.data as Record<string, unknown> | undefined;
  if (data && typeof data.title === "string" && data.title.trim()) {
    return data.title.trim();
  }
  if (data && typeof data.name === "string") {
    const last = data.name.split("/").pop();
    if (last && last !== data.name) return last;
  }
  return `Concept ${index + 1}`;
}

async function screenToDesignConcept(screen: Screen, index: number, request: StitchDesignRequest): Promise<DesignConcept> {
  const ds = request.designSystem;
  const schemeIndex = index % FALLBACK_SCHEMES.length;
  const fallback = FALLBACK_SCHEMES[schemeIndex];
  if (!fallback) {
    throw new Error("stitch-design-concepts: missing fallback color scheme");
  }

  // Prefer the design-system colours when available, otherwise use fallback
  const colors: DesignConcept["colorScheme"] = ds
    ? {
        primary: ds.primary,
        background: ds.background,
        text: ds.onSurface,
        surface: ds.surface,
        secondary: ds.secondary,
        onPrimary: ds.onPrimary,
      }
    : fallback;

  const [htmlUrl, screenshotUrl] = await Promise.all([
    screen.getHtml().catch(() => undefined),
    screen.getImage().catch(() => undefined),
  ]);
  return {
    index,
    name: screenLabel(screen, index),
    description: `${request.productName}: ${request.description}. Visual direction: ${request.styleHint}. Design option ${index + 1} of 3.`,
    colorScheme: colors,
    components: request.components,
    styleKeywords: styleKeywordsFromHint(request.styleHint, index),
    screenId: screen.screenId,
    projectId: screen.projectId,
    screenshotUrl,
    htmlUrl,
    designSystem: ds,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateDesignConcepts(request: StitchDesignRequest): Promise<DesignConcept[]> {
  if (!process.env.STITCH_API_KEY?.trim()) {
    throw new Error("STITCH_API_KEY is not set (required for @google/stitch-sdk).");
  }

  const existingId = process.env.STITCH_PROJECT_ID?.trim();
  const project = existingId
    ? stitch.project(existingId)
    : await stitch.createProject(request.productName.slice(0, 80));

  const base = await project.generate(buildBasePrompt(request), "DESKTOP", "GEMINI_3_PRO");

  const variantInstruction = [
    "Create three meaningfully different visual treatments for the same product goals and content.",
    `Respect this direction: ${request.styleHint}.`,
    `Cover these areas: ${request.components.join(", ")}.`,
    request.designSystem?.effects
      ? `Maintain ${request.designSystem.effects} effects across all variants.`
      : "",
    `All variants must feel premium and targeted at ${request.targetAudience}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const screens = await base.variants(
    variantInstruction,
    {
      variantCount: 3,
      creativeRange: "EXPLORE",
      aspects: ["TEXT_FONT", "IMAGES", "LAYOUT"],
    },
    "DESKTOP",
    "GEMINI_3_PRO",
  );

  if (screens.length < 1) {
    throw new Error("Stitch returned no design variants; check STITCH_API_KEY and project access.");
  }

  const take = Math.min(3, screens.length);
  return Promise.all(
    screens.slice(0, take).map((screen, i) => screenToDesignConcept(screen, i, request)),
  );
}
