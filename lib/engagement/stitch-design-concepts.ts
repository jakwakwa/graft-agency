import type { Screen } from "@google/stitch-sdk";
import { createStitchClient } from "@/lib/engagement/stitch-client";
import type { DesignConcept, DesignSystemSpec } from "@/lib/types/engagement";

/**
 * @google/stitch-sdk — design variants for the engagement pipeline.
 * @see https://stitch.withgoogle.com/docs/sdk/ai-sdk/
 * Auth: gt-stitch-api service account via OAuth2 Bearer (see lib/engagement/stitch-client.ts).
 * Env: GCP_STITCH_SA_ACCOUNT_BASE64_KEY + GCP_PROJECT_ID (required),
 *      STITCH_PROJECT_ID (optional, reuse one Stitch project per dev machine).
 */
export interface StitchDesignRequest {
  productName: string;
  description: string;
  styleHint: string;
  components: string[];
  industry: string;
  productType: string;
  targetAudience: string;
  sectionBriefs?: string[];
  uiElements?: string[];
  imageryDirection?: string;
  designSystem?: DesignSystemSpec;
  /** Campaign SOP guidance from the Strategy Engine that steers tone + framing. */
  campaignContext?: { visualFramework?: string; designTone?: string[] };
  /** displayName of the Stitch preset (one of the three) to apply to the variants; resolved by name at runtime. */
  presetDisplayName?: string;
}

// ---------------------------------------------------------------------------
// Fallbacks & defaults
// ---------------------------------------------------------------------------

const FALLBACK_SCHEMES: DesignConcept["colorScheme"][] = [
  { primary: "#4d7bd7ff", background: "#191f2aff", text: "#d8e2f6ff" },
  { primary: "#ed9f38ff", background: "#eceafaff", text: "#f8fafc" },
  { primary: "#000000ff", background: "#080a0fff", text: "#49505aff" },
];

const DEFAULT_DESIGN_SYSTEM: DesignSystemSpec = {
  background: "#17181dff",
  surface: "#38607071",
  primary: "#5571ccff",
  onPrimary: "#f4fafaff",
  secondary: "#08aca3ff",
  onSurface: "#2e313dff",
  onSurfaceVariant: "#dae1eaff",
  outline: "rgba(176, 243, 237, 0.1)",
  headlineFont: "Poppins, sans-serif",
  bodyFont: "Geist, sans-serif",
  effects: "",
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
    `GRAFT.TODAY is an agency that is selling Ai Concierge Agent Bots. They need a bespoke and interactive presentation laid out on the web for their prospective client: ${request.productName}.`,
    `This is a real-world ${request.industry} ${request.productType}.
    `,
  ];
  ideaLines.push(
    `The vibe should be a premium blend of rich ${request.industry} tradition and ultra-modern digital excellence.`,
    `Visual direction: ${request.styleHint}
    
## 0. BRIEF INFERENCE (Read the Room Before Anything Else)

Before touching code or tweaking dials, **infer what the user actually wants**. Most LLM design output is bad because the model jumps to a default aesthetic instead of reading the room.

### 0.A Read these signals first
1. **Page kind** - landing (SaaS / consumer / agency / event), portfolio (dev / designer / creative studio), redesign (preserve vs overhaul), editorial / blog.
2. **Vibe words** the user used - "minimalist", "calm", "Linear-style", "Awwwards", "brutalist", "premium consumer", "Apple-y", "playful", "serious B2B", "editorial", "agency-y", "glassy", "dark tech".
3. **Reference signals** - URLs they linked, screenshots they pasted, products they named, brands they're competing with.
4. **Audience** - B2B procurement dashboard vs. design-conscious consumer. The audience picks the aesthetic, not your taste.

### 0.D Anti-Default Discipline
Do not default to: AI-purple gradients, centered hero over dark mesh, three equal feature cards, generic glassmorphism on everything, infinite-loop micro-animations everywhere, Inter + slate-900. These are the LLM defaults. Reach past them deliberately based on the design read.
---

## 1. THE THREE DIALS (Core Configuration)

## 2. DESIGN ENGINEERING DIRECTIVES (Bias Correction)

LLMs default to clichés. Override these defaults proactively. Each rule has a context-aware override path.

### 3.1 Typography
* **Display / Headlines:** Default "text-4xl md:text-6xl tracking-tighter leading-none".
* **Body / Paragraphs:** Default "text-base text-gray-600 leading-relaxed max-w-[65ch]".
* **Sans font choice:**
  * **Discouraged as default:** "Inter". Pick "Geist", "Outfit", "Cabinet Grotesk", "Satoshi", or a brand-appropriate serif first.
* **Pairings to know:** "Geist" + "Geist Mono", "Satoshi" + "JetBrains Mono", "Cabinet Grotesk" + "Inter Tight", "GT America" + "IBM Plex Mono".
* **AVOID Inter as default.** See Section 4.1. Override path exists.
* **NO oversized H1s** that just scream. Control hierarchy with weight + color, not raw scale.
* **Serif constraints:** Serif for editorial / luxury / publication. Not for dashboards.
* **ITALIC DESCENDER CLEARANCE (mandatory):** When italic is used in display type and the word contains a descender letter ("y g j p q"), "leading-[1]" or "leading-none" will clip the descender. Use "leading-[1.1]" minimum and add "pb-1" or "mb-1" reserve on the wrapping element. Audit every italic word in display headlines before shipping.

### 4 Materiality, Shadows, Cards
* Use cards ONLY when elevation communicates real hierarchy. Otherwise group with "border-t", "divide-y", or negative space.
* When a shadow is used, tint it to the background hue. No pure-black drop shadows on light backgrounds.
* For "VISUAL_DENSITY > 7": generic card containers are banned. Data metrics breathe in plain layout.
* **SHAPE CONSISTENCY LOCK (mandatory):** Pick ONE corner-radius scale for the page and stick to it. Options: all-sharp (radius 0), all-soft (radius 12-16px), all-pill (full radius for interactive). Mixed systems are allowed only when there is a documented rule (e.g. "buttons are full-pill, cards are 16px, inputs are 8px") and that rule is followed everywhere. Round buttons in a square layout, or square cards on a pill-button page, is broken design.

### 5 Interactive UI States
LLMs default to "static successful state only." Always implement full cycles:
* **Loading:** Skeletal loaders matching the final layout's shape. Avoid generic circular spinners.

## 6. AI TELLS (Forbidden Patterns)

Avoid these signatures

### 7.A Layout & Spacing
* **Mathematically perfect** padding and margins. No floating elements with awkward gaps.
* **NO 3-column equal feature cards.** The generic "three identical cards horizontally" feature row is banned. Use 2-column zig-zag, asymmetric grid, scroll-pinned, or horizontal-scroll alternative.

### 7.B Content & Data ("Jane Doe" Effect)
* **NO generic names.** "John Doe", "Sarah Chan", "Jack Su" → use creative, realistic, locale-appropriate names.
* **NO generic avatars.** No SVG "egg" or Lucide user icons → use believable photo placeholders or specific styling.
* **NO startup-slop brand names.** "Acme", "Nexus", "SmartFlow", "Cloudly" → invent contextual, premium names that sound real.
* **NO filler verbs.** "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize" → concrete verbs only.
    `,
  );
  sections.push(`# IDEA\n${ideaLines.join("\n")}

`);

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
      `# IMAGERY\nEnsure all background and card images depict real, high-end ${request.industry} scenery relevant to ${request.productName}..`,
    );
  }

  // ── DESIGN SYSTEM ─────────────────────────────────────────────────────────
  const designSystemBlock = [
    `- **Theme Strategy**: ${ds.themeMode ? ds.themeMode.charAt(0).toUpperCase() + ds.themeMode.slice(1) : "Dark"} mode.`,
  ];
  sections.push(designSystemBlock.join("\n"));

  // ── FINAL INSTRUCTION ─────────────────────────────────────────────────────
  sections.push(
    `Target audience: ${request.targetAudience}.`,
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

async function screenToDesignConcept(
  screen: Screen,
  index: number,
  request: StitchDesignRequest,
): Promise<DesignConcept> {
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

async function _engageMentPipelineThumbnails(screen: Screen) {
  const screenshot = screen.getImage();
  return screenshot;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateDesignConcepts(request: StitchDesignRequest): Promise<DesignConcept[]> {
  const { stitch, client } = await createStitchClient();

  try {
    const existingId = process.env.STITCH_PROJECT_ID?.trim();
    const project = existingId
      ? stitch.project(existingId)
      : await stitch.createProject(request.productName.slice(0, 80));

    const base = await project.generate(buildBasePrompt(request), "DESKTOP", "GEMINI_3_PRO");

    const variantInstruction = [
      "Create three meaningfully different visual treatments for the same product goals and content.",
      // `Respect this direction: ${request.styleHint}.`,
      `Cover these areas: ${request.components.join(", ")}.`,
      request.designSystem?.effects ? `Maintain ${request.designSystem.effects} effects across all variants.` : "",
      request.campaignContext?.designTone?.length
        ? `Honour the campaign tone: ${request.campaignContext.designTone.join(", ")}.`
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
        // SDK type is malformed — `aspects` should be Array<aspect> but is typed as `"TEXT_CONTENT"[]`
        aspects: ["TEXT_FONT", "IMAGES", "LAYOUT"] as unknown as "TEXT_CONTENT"[],
      },
      "DESKTOP",
      "GEMINI_3_PRO",
    );

    if (screens.length < 1) {
      throw new Error(
        "Stitch returned no design variants; check the gt-stitch-api service account and project access.",
      );
    }

    const take = Math.min(3, screens.length);
    const variantScreens = screens.slice(0, take);

    // Apply the chosen preset design system to THIS run's variant screens so the
    // concepts inherit the preset's colours/typography. The preset is resolved by
    // displayName (account-agnostic). Scoped to our own screens (never the whole
    // shared project). Best-effort: a failure here must not sink the build — the
    // variants are still usable without the preset re-render.
    if (request.presetDisplayName) {
      try {
        const systems = await project.listDesignSystems();
        const match = systems.find((d) => (d.data as { displayName?: string } | undefined)?.displayName === request.presetDisplayName);
        if (!match) {
          throw new Error(
            `preset "${request.presetDisplayName}" not found in project ${project.projectId}; ` +
              "ensure the three presets exist in this Stitch project (STITCH_PROJECT_ID).",
          );
        }
        const ds = project.designSystem(match.id);
        const ourSourceIds = new Set(variantScreens.map((s) => s.screenId));
        const projectData = (await client.callTool("get_project", {
          name: `projects/${project.projectId}`,
        })) as { screenInstances?: Array<{ id: string; sourceScreen: string }> };
        const instances = (projectData.screenInstances ?? [])
          .filter((si) => ourSourceIds.has(si.sourceScreen))
          .map((si) => ({ id: si.id, sourceScreen: si.sourceScreen }));
        if (instances.length > 0) {
          await ds.apply(instances);
        }
      } catch (err) {
        console.error(
          `[stitch] failed to apply preset "${request.presetDisplayName}"; using unstyled variants:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    return await Promise.all(variantScreens.map((screen, i) => screenToDesignConcept(screen, i, request)));
  } finally {
    await client.close().catch(() => {});
  }
}
