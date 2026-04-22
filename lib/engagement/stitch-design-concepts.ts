import { type Screen, stitch } from "@google/stitch-sdk";
import type { DesignConcept } from "@/lib/types/engagement";

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
}

const FALLBACK_SCHEMES: DesignConcept["colorScheme"][] = [
  { primary: "#2563eb", background: "#ffffff", text: "#111827" },
  { primary: "#7c3aed", background: "#0f172a", text: "#f8fafc" },
  { primary: "#f97316", background: "#f9fafb", text: "#1f2937" },
];

function buildBasePrompt(request: StitchDesignRequest): string {
  return [
    `Product: ${request.productName}`,
    `Goal: ${request.description}`,
    `Visual direction: ${request.styleHint}`,
    `Include these UI areas: ${request.components.join(", ")}.`,
    "One cohesive landing or marketing screen (desktop) that includes these sections.",
  ].join("\n");
}

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
  const schemeIndex = index % FALLBACK_SCHEMES.length;
  const colors = FALLBACK_SCHEMES[schemeIndex];
  if (!colors) {
    throw new Error("stitch-design-concepts: missing fallback color scheme");
  }
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
  };
}

export async function generateDesignConcepts(request: StitchDesignRequest): Promise<DesignConcept[]> {
  if (!process.env.STITCH_API_KEY?.trim()) {
    throw new Error("STITCH_API_KEY is not set (required for @google/stitch-sdk).");
  }

  const existingId = process.env.STITCH_PROJECT_ID?.trim();
  const project = existingId
    ? stitch.project(existingId)
    : await stitch.createProject(request.productName.slice(0, 80));

  const base = await project.generate(buildBasePrompt(request), "DESKTOP");

  const variantInstruction = [
    "Create three meaningfully different visual treatments for the same product goals and content.",
    `Respect this direction: ${request.styleHint}.`,
    `Cover these areas: ${request.components.join(", ")}.`,
  ].join(" ");

  const screens = await base.variants(
    variantInstruction,
    {
      variantCount: 3,
      creativeRange: "EXPLORE",
      aspects: ["COLOR_SCHEME", "LAYOUT", "TEXT_CONTENT"],
    },
    "DESKTOP",
  );

  if (screens.length < 1) {
    throw new Error("Stitch returned no design variants; check STITCH_API_KEY and project access.");
  }

  const take = Math.min(3, screens.length);
  return Promise.all(
    screens.slice(0, take).map((screen, i) => screenToDesignConcept(screen, i, request)),
  );
}
