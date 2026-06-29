import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";
import { resolveBuildVariant } from "@/lib/engagement/build-variant";
import { transitionStage } from "@/lib/engagement/stage-machine";
import { generateDesignConcepts } from "@/lib/engagement/stitch-design-concepts";
import { selectStitchPreset } from "@/lib/engagement/stitch-presets";
import { inngest } from "@/lib/inngest/client";
import type { CampaignSop, DesignConcept, DesignSystemSpec, ProfiledNeeds } from "@/lib/types/engagement";
import { makeOnFailure } from "./_shared/on-failure";

// ---------------------------------------------------------------------------
// PRD → StitchDesignRequest parser
// ---------------------------------------------------------------------------

/** Extract a ### sub-section body from the ## Design Direction block */
function extractSubSection(designBlock: string, heading: string): string | undefined {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`###\\s*${escaped}\\s*\\n([\\s\\S]*?)(?=\\n###|$)`, "i");
  return re.exec(designBlock)?.[1]?.trim() || undefined;
}

/** Parse bullet lines (- item) from a block of text */
function parseBullets(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((l) => l.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

/** Parse "- Label: #HEXCODE" or "- Label: rgba(...)" lines into a key→value map */
function parseColourLines(text: string | undefined): Record<string, string> {
  if (!text) return {};
  const map: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const m = line.match(/[-*]\s*\*?\*?(.+?)\*?\*?\s*:\s*(#[0-9A-Fa-f]{3,8}|rgba?\([^)]+\))/);
    if (m?.[1] && m[2]) {
      const key = m[1]
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "_");
      map[key] = m[2].trim();
    }
  }
  return map;
}

/** Parse typography section: looks for headline and body font names */
function parseTypography(text: string | undefined): { headline: string; body: string } {
  const defaults = { headline: "Playfair Display, serif", body: "Inter, sans-serif" };
  if (!text) return defaults;

  const headlineMatch = text.match(/headline[s]?.*?:\s*(.+)/i) ?? text.match(/display.*?:\s*(.+)/i);
  const bodyMatch = text.match(/body.*?:\s*(.+)/i) ?? text.match(/label[s]?.*?:\s*(.+)/i);

  return {
    headline: headlineMatch?.[1]?.trim() || defaults.headline,
    body: bodyMatch?.[1]?.trim() || defaults.body,
  };
}

interface ParsedDesignDirection {
  styleHint: string;
  components: string[];
  sectionBriefs: string[];
  uiElements: string[];
  imageryDirection: string | undefined;
  designSystem: DesignSystemSpec | undefined;
}

function parseDesignDirection(prdContent: string, _profiledNeeds: ProfiledNeeds): ParsedDesignDirection {
  // Extract the full ## Design Direction block
  const designSectionMatch = prdContent.match(/## Design Direction\n([\s\S]*?)(?=\n## [^#]|$)/);
  const designBlock = designSectionMatch?.[1]?.trim() ?? "";

  // Sub-sections
  const visualEffects = extractSubSection(designBlock, "Visual Effects");
  const sectionLayout = extractSubSection(designBlock, "Section Layout");
  const uiElementsRaw = extractSubSection(designBlock, "UI Elements");
  const imageryDirection = extractSubSection(designBlock, "Imagery Direction");
  const colourPalette = extractSubSection(designBlock, "Colour Palette");
  const typography = extractSubSection(designBlock, "Typography");
  const themeMode = extractSubSection(designBlock, "Theme Mode");

  // Build styleHint from visual effects or fall back to entire block first paragraph
  const styleHint = visualEffects ?? designBlock.split("\n")[0] ?? "professional, clean, modern";

  // Section briefs → components list
  const sectionBriefs = parseBullets(sectionLayout);
  const components =
    sectionBriefs.length > 0
      ? sectionBriefs.map((brief) => {
          // Extract the leading label before the colon, e.g. "Hero Section: ..." → "HeroSection"
          const label = brief.split(":")[0]?.trim().replace(/\s+/g, "") ?? brief.slice(0, 20);
          return label;
        })
      : ["HeroSection", "FeaturesSection", "SocialProof", "CTASection"];

  // UI elements
  const uiElements = parseBullets(uiElementsRaw);

  // Colour palette → DesignSystemSpec
  const colours = parseColourLines(colourPalette);
  const fonts = parseTypography(typography);

  const hasColours = Object.keys(colours).length >= 3;
  const designSystem: DesignSystemSpec | undefined = hasColours
    ? {
        background: colours.background ?? "#0F0F0F",
        surface: colours.surface ?? "#1A1A1A",
        primary: colours.primary ?? "#8B5CF6",
        onPrimary: colours.on_primary ?? "#FFFFFF",
        secondary: colours.secondary ?? "#D4AF37",
        onSurface: colours.on_surface ?? "#F3F4F6",
        onSurfaceVariant: colours.on_surface_variant ?? "#9CA3AF",
        outline: colours.outline ?? "rgba(255, 255, 255, 0.1)",
        headlineFont: fonts.headline,
        bodyFont: fonts.body,
        effects: visualEffects?.split(".")[0] ?? undefined,
        themeMode: themeMode?.toLowerCase().includes("dark") ? "dark" : "light",
      }
    : undefined;

  return { styleHint, components, sectionBriefs, uiElements, imageryDirection, designSystem };
}

// ---------------------------------------------------------------------------
// Inngest function
// ---------------------------------------------------------------------------

/**
 * Inngest: PRD → Stitch (@google/stitch-sdk) → three design concept variants.
 * @see https://stitch.withgoogle.com/docs/sdk/ai-sdk/
 */
export const stitchDesignerHandler = async ({
  event,
  step,
}: {
  event: {
    data: Record<string, unknown>;
  };
  step: {
    run: <T>(id: string, fn: () => T | Promise<T>) => Promise<T>;
    sendEvent: (
      id: string,
      event: {
        name: string;
        data: Record<string, unknown>;
      },
    ) => Promise<unknown>;
  };
}) => {
  const { leadId, clientId, profiledNeeds, prdContent, campaignSop } = event.data as {
    leadId: string;
    clientId: string;
    profiledNeeds: ProfiledNeeds;
    prdContent: string;
    campaignSop?: CampaignSop;
  };

  await step.run("mark-designing", () => transitionStage({ leadId, to: "DESIGNING", source: "stitch-designer" }));

  const isStitchDisabled = process.env.STITCH_TEMP_DISABLE === "1" || process.env.STITCH_TEMP_DISABLE === "true";

  let designConcepts: DesignConcept[] = [];
  let chosenIndex = 0;

  if (!isStitchDisabled) {
    const parsed = parseDesignDirection(prdContent, profiledNeeds);

    // Fold the Strategy Engine's campaign tone into the visual direction so the
    // Stitch concepts reflect the campaign, not just the PRD design block.
    const designTone = campaignSop?.designTone ?? [];
    const styleHint = [
      parsed.styleHint,
      designTone.length ? `Campaign tone: ${designTone.join(", ")}.` : "",
      campaignSop?.visualFramework ? `Presentation framework: ${campaignSop.visualFramework}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    // Always apply exactly one of the three presets. Landing → GRAFT Kit;
    // campaign dashboards → a dark preset by business archetype.
    const buildVariant = await step.run("resolve-build-variant", async () => {
      const spec = await prisma.productSpec.findUnique({ where: { leadId }, select: { buildVariant: true } });
      return resolveBuildVariant(spec?.buildVariant);
    });
    const preset = selectStitchPreset({ buildVariant, businessArchetype: campaignSop?.businessArchetype });

    designConcepts = await step.run("generate-designs", () =>
      generateDesignConcepts({
        productName: `${profiledNeeds.companyName} ${profiledNeeds.productType}`,
        description: profiledNeeds.primaryNeed,
        styleHint,
        components: parsed.components,
        industry: profiledNeeds.industry,
        productType: profiledNeeds.productType,
        targetAudience: profiledNeeds.targetAudience,
        sectionBriefs: parsed.sectionBriefs,
        uiElements: parsed.uiElements,
        imageryDirection: parsed.imageryDirection,
        designSystem: parsed.designSystem,
        campaignContext: { visualFramework: campaignSop?.visualFramework, designTone },
        presetDisplayName: preset.displayName,
      }),
    );

    chosenIndex = Math.floor(Math.random() * Math.min(3, designConcepts.length));
  }

  await step.run("save-designs", () =>
    transitionStage({
      leadId,
      to: "DESIGN_COMPLETE",
      source: "stitch-designer",
      data: {
        designConcepts: designConcepts as unknown as Prisma.InputJsonValue,
        chosenDesign: chosenIndex,
      },
    }),
  );

  await step.sendEvent("emit-design-complete", {
    name: "engagement/design.completed",
    data: { leadId, clientId, profiledNeeds, prdContent, campaignSop, designConcepts, chosenDesignIndex: chosenIndex },
  });

  return { leadId, stage: "DESIGN_COMPLETE", conceptCount: designConcepts.length };
};

export const stitchDesignerFunction = inngest.createFunction(
  {
    id: "stitch-designer",
    name: "Stitch Design Concept Generator",
    retries: 2,
    idempotency: "event.data.leadId",
    onFailure: makeOnFailure("stitch-designer", "DESIGNING"),
    triggers: [{ event: "engagement/strategy.completed" }],
  },
  stitchDesignerHandler,
);
