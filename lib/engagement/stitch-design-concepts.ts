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
    `A premium web landing page for ${request.productName}.`,
    `This is a real-world ${request.industry} ${request.productType}.
    `,
  ];
  if (ds.effects) {
    ideaLines.push(
      `Apply heavy ${ds.effects} effects (frosted glass, translucent panels with background blur, subtle light borders) to all cards, navigation bars, and overlays.`,
    );
  }
  ideaLines.push(
    `The vibe should be a premium blend of rich ${request.industry} tradition and ultra-modern digital excellence.`,
    `Use an elegant, traditional ${ds.headlineFont.split(",")[0]?.trim() ?? "serif"} font for headings and a clean, legible ${ds.bodyFont.split(",")[0]?.trim() ?? "sans-serif"} for body text.`,
    `Visual direction: ${request.styleHint}
    
    
## 0. BRIEF INFERENCE (Read the Room Before Anything Else)

Before touching code or tweaking dials, **infer what the user actually wants**. Most LLM design output is bad because the model jumps to a default aesthetic instead of reading the room.

### 0.A Read these signals first
1. **Page kind** - landing (SaaS / consumer / agency / event), portfolio (dev / designer / creative studio), redesign (preserve vs overhaul), editorial / blog.
2. **Vibe words** the user used - "minimalist", "calm", "Linear-style", "Awwwards", "brutalist", "premium consumer", "Apple-y", "playful", "serious B2B", "editorial", "agency-y", "glassy", "dark tech".
3. **Reference signals** - URLs they linked, screenshots they pasted, products they named, brands they're competing with.
4. **Audience** - B2B procurement panel vs. design-conscious consumer vs. recruiter scanning a portfolio. The audience picks the aesthetic, not your taste.

### 0.D Anti-Default Discipline
Do not default to: AI-purple gradients, centered hero over dark mesh, three equal feature cards, generic glassmorphism on everything, infinite-loop micro-animations everywhere, Inter + slate-900. These are the LLM defaults. Reach past them deliberately based on the design read.
---

## 1. THE THREE DIALS (Core Configuration)

After the design read, set three dials. Every layout, motion, and density decision below is gated by these.

* DESIGN_VARIANCE: 8 - 1 = Perfect Symmetry, 10 = Artsy Chaos
* MOTION_INTENSITY: 6 - 1 = Static, 10 = Cinematic / Physics
* VISUAL_DENSITY: 4 - 1 = Art Gallery / Airy, 10 = Cockpit / Packed Data

**Baseline:** 8 / 6 / 4. Use these unless the design read overrides them. Do not ask the user to edit this file - overrides happen conversationally.

### 1.A Dial Inference (design read → dial values)
| Signal | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| "minimalist / clean / calm / editorial / Linear-style" | 5-6 | 3-4 | 2-3 |
| "premium consumer / Apple-y / luxury / brand" | 7-8 | 5-7 | 3-4 |
| "playful / wild / Dribbble / Awwwards / experimental / agency" | 9-10 | 8-10 | 3-4 |
| "landing page / portfolio / marketing site (default)" | 7-9 | 6-8 | 3-5 |
| "trust-first / public-sector / regulated / accessibility-critical" | 3-4 | 2-3 | 4-5 |
| "redesign - preserve" | match existing | +1 | match existing |
| "redesign - overhaul" | +2 | +2 | match existing |

### 1.B Use-Case Presets
| Use case | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| Landing (SaaS, mainstream) | 7 | 6 | 4 |
| Landing (Agency / creative) | 9 | 8 | 3 |
| Landing (Premium consumer) | 7 | 6 | 3 |

### 1.C How the Dials Drive Output
Use these as global variables. Cross-references throughout this document refer to these exact variable names - never invent aliases like LAYOUT_VARIANCE or ANIM_LEVEL.

## 2. BRIEF → DESIGN SYSTEM MAP

Once you have the design read (Section 0) and dials (Section 1), pick the right foundation. Do not invent CSS for things that have an official package. Do not pretend an aesthetic trend is an official system.

For these directions, there is **no single official package**. Build with native CSS + Tailwind + a maintained component library. Be honest in code comments about what is borrowed inspiration vs. official material.

| Aesthetic | Honest implementation |
|---|---|
| Glassmorphism / "frosted glass" | backdrop-filter, layered borders, highlight overlays. Provide solid-fill fallback for prefers-reduced-transparency. |
| Bento (Apple-style tile grids) | CSS Grid with mixed cell sizes. No single library owns this. |
| Brutalism | Native CSS, monospace, raw borders. No library. |
| Editorial / magazine | Serif type, asymmetric grid, generous whitespace. No library. |
| Dark tech / hacker | Mono + accent neon, terminal motifs. No library. |
| Aurora / mesh gradients | SVG or layered radial gradients. No library. |
| Kinetic typography | Native CSS animations, scroll-driven animations, GSAP for hijacks. No library. |
| **Apple Liquid Glass** | Apple documents this for Apple platforms only. **There is no official liquid-glass.css
|.** Web implementations are approximations using backdrop-filter + layered borders + highlights. Label clearly as approximation. |

---

## 3. DESIGN ENGINEERING DIRECTIVES (Bias Correction)

LLMs default to clichés. Override these defaults proactively. Each rule has a context-aware override path.

### 3.1 Typography
* **Display / Headlines:** Default "text-4xl md:text-6xl tracking-tighter leading-none".
* **Body / Paragraphs:** Default "text-base text-gray-600 leading-relaxed max-w-[65ch]".
* **Sans font choice:**
  * **Discouraged as default:** "Inter". Pick "Geist", "Outfit", "Cabinet Grotesk", "Satoshi", or a brand-appropriate serif first.
* **Pairings to know:** "Geist" + "Geist Mono", "Satoshi" + "JetBrains Mono", "Cabinet Grotesk" + "Inter Tight", "GT America" + "IBM Plex Mono".

* **SERIF DISCIPLINE (VERY DISCOURAGED AS DEFAULT):**
  * Serif is **very discouraged as the default font for any project.** "It feels creative / premium / editorial" is NOT a reason to reach for serif. The agent's default mental model that "creative brief = serif" is the single most-tested AI tell in production rounds.
  * **Serif is only acceptable when ONE of these is explicitly true:**
    - The brand brief literally names a serif font, OR
    - The aesthetic family is genuinely editorial / luxury / publication / manuscript / heritage / vintage AND you can articulate why this specific serif fits this specific brand
  * For everything else (creative agency, design studio, modern brand, premium consumer, portfolio, lifestyle), **default sans-serif display** (Geist Display, ABC Diatype, Söhne Breit, Cabinet Grotesk Display, Migra Sans, GT Walsheim, Inter Display, PP Neue Montreal). Sans display fonts are not "boring" — they are the default for the same reason black is the default in fashion.
  * **EMPHASIS RULE (related):** When you want to emphasize a word within a headline (the kinetic "and "spatial" design" type move), use **italic or bold of the SAME font**. Do NOT inject a random serif word into a sans headline (or vice versa) just to add visual interest. Mixed-family emphasis is amateur. Italic/bold emphasis in the same family is the right move.
  * **Specifically BANNED as defaults:** "Fraunces" and "Instrument_Serif" (the two LLM-favorite display serifs).
  * **If a serif is justified** (rare, per the above), rotate from this pool, do NOT reuse the same serif across consecutive projects: PP Editorial New, GT Sectra Display, Cardinal Grotesque, Reckless Neue, Tiempos Headline, Recoleta, Cormorant Garamond, Playfair Display, EB Garamond, IvyPresto, Migra, Editorial Old, Saol Display, Söhne Breit Kursiv, Domaine Display, Canela, Schnyder, Tobias, NB Architekt, ITC Galliard.

* **ITALIC DESCENDER CLEARANCE (mandatory):** When italic is used in display type and the word contains a descender letter ("y g j p q"), "leading-[1]" or "leading-none" will clip the descender. Use "leading-[1.1]" minimum and add "pb-1" or "mb-1" reserve on the wrapping element. Audit every italic word in display headlines before shipping.

### 4.2 Color Calibration (STILL CAN BE OVERRIDDEN - USER OVERRIDES ONLY)
* Max 1 accent color. Saturation < 80% by default.
* **THE LILA RULE:** The "AI Purple / Blue glow" aesthetic is discouraged as a default. No automatic purple button glows, no random neon gradients. Use neutral bases (Zinc / Slate / Stone) with high-contrast singular accents (Emerald, Electric Blue, Deep Rose, Burnt Orange, etc.).
* **Override:** if the brand or brief explicitly asks for purple / violet / lila, embrace it. But execute with intent: consistent palette, harmonised neutrals, restrained gradients. Not generic AI gradient slop.
* **One palette per project.** Do not fluctuate between warm and cool grays within the same project.
* **COLOR CONSISTENCY LOCK (mandatory):** Once an accent color is chosen for a page, it is used on the WHOLE page. A warm-grey site does not suddenly get a blue CTA in section 7. A rose-accented site does not get a teal status badge in the footer. Pick one accent, lock it, audit every component before shipping.

* **PREMIUM-CONSUMER PALETTE BAN (mandatory, second-most-recurring AI-tell):**
  * For premium-consumer briefs (cookware, wellness, artisan, luxury, heritage craft, DTC home goods, etc.) the LLM default is **warm beige/cream + brass/clay/oxblood/ochre + espresso/ink dark text**. Concretely banned hex families as default backgrounds and accents:
    - Backgrounds: "#f5f1ea" (can still be overridden - **USER OVERRIDES ONLY**) , "#f7f5f1", "#fbf8f1", "#efeae0", "#ece6db", "#faf7f1", "#e8dfcb" (all "warm paper / cream / chalk / bone")
    - Accents: "#b08947", "#b6553a", "#9a2436", "#9c6e2a", "#bc7c3a", "#7d5621" (all "brass / clay / oxblood / ochre")
    - Text: "#1a1714", "#1a1814", "#1b1814" (all "espresso / warm near-black")
  * This palette is BANNED as the default reach for premium-consumer briefs. Every premium-consumer site you have ever shipped uses this exact palette. The brand becomes invisible.
  * **Default alternatives (rotate, do not reuse):**
    - **Cold Luxury:** silver-grey + chrome + smoke (think Tesla, Apple Watch Hermes-without-the-leather)
    - **Forest:** deep green + bone + amber accent (think Filson, Patagonia premium)
    - **Black and Tan:** true off-black + warm tan, sharp contrast, no beige
    - **Cobalt + Cream:** saturated blue against a single neutral, no brass
    - **Terracotta + Slate:** warm rust against cool grey, no brass
    - **Olive + Brick + Paper:** muted olive plus brick-red accent
    - **Pure monochrome + single saturated pop:** off-white + off-black + one bright accent (electric blue, emerald, hot pink, etc.)
  * **Palette-rotation rule:** if the previous premium-consumer project you generated used the beige+brass family, this one MUST use a different family. Do not ship the same warm-craft palette twice in a row.
  * **Override:** the beige+brass+espresso palette is acceptable ONLY when the brand brief explicitly names those colors, or when the brand identity is genuinely vintage / artisan / warm-craft AND you can articulate why this specific palette fits this specific brand. Default-reaching for it because "this is a cookware brief" is banned.

### 4.3 Layout Diversification
* **ANTI-CENTER BIAS:** Centered Hero / H1 sections are avoided when "DESIGN_VARIANCE > 4". Force "Split Screen" (50/50), "Left-aligned content / right-aligned asset", "Asymmetric white-space", or scroll-pinned structures.

### 4.4 Materiality, Shadows, Cards
* Use cards ONLY when elevation communicates real hierarchy. Otherwise group with "border-t", "divide-y", or negative space.
* When a shadow is used, tint it to the background hue. No pure-black drop shadows on light backgrounds.
* For "VISUAL_DENSITY > 7": generic card containers are banned. Data metrics breathe in plain layout.
* **SHAPE CONSISTENCY LOCK (mandatory):** Pick ONE corner-radius scale for the page and stick to it. Options: all-sharp (radius 0), all-soft (radius 12-16px), all-pill (full radius for interactive). Mixed systems are allowed only when there is a documented rule (e.g. "buttons are full-pill, cards are 16px, inputs are 8px") and that rule is followed everywhere. Round buttons in a square layout, or square cards on a pill-button page, is broken design.

### 4.5 Interactive UI States
LLMs default to "static successful state only." Always implement full cycles:
* **Loading:** Skeletal loaders matching the final layout's shape. Avoid generic circular spinners.
* **Empty States:** Beautifully composed; indicate how to populate.
* **Error States:** Clear, inline (forms), or contextual (toasts only for transient).
* **Tactile Feedback:** On ":active", use "-translate-y-[1px]" or "scale-[0.98]" to simulate a physical push.
* **BUTTON CONTRAST CHECK (mandatory, a11y):** Before shipping any button, verify the button text is readable against the button background. White button + white text, "bg-white" CTA with "text-white" label, transparent button against the page background with no border → all banned. Audit every CTA: contrast ratio WCAG AA min (4.5:1 for body, 3:1 for large text 18px+). Same rule applies to ghost buttons over photographic backgrounds (use a backdrop, scrim, or stroke).
* **CTA BUTTON WRAP BAN (mandatory):** Button text MUST fit on one line at desktop. If a label like "VIEW SELECTED WORK" wraps to 2 or 3 lines, the button is broken. Fix by EITHER shortening the label (3 words max for primary CTAs, ideally 1-2) OR widening the button (do not artificially constrain "max-width" on CTAs). Wrapped CTAs at desktop are a Pre-Flight Fail.
* **NO DUPLICATE CTA INTENT (mandatory):** Two CTAs with the same intent on one page is a Pre-Flight Fail. Examples of same intent: "Get in touch" + "Contact us" + "Let's talk" + "Start a project" + "Start something" + "Reach out" = all "contact" intent → pick ONE label and use it everywhere on the page (nav, hero, footer). Same for "Try free" + "Get started" + "Sign up free" (all "signup" intent) and "View work" + "See selected work" + "Browse projects" (all "portfolio" intent). One label per intent.
* **FORM CONTRAST CHECK (mandatory, a11y):** Form inputs, placeholder text, focus rings, helper text, and error text all pass WCAG AA contrast against the section background. Light placeholders on a near-white form, white form on white page section, form labels grayer than 4.5:1 contrast → all banned. Audit every form before shipping.

### 4.6 Data & Form Patterns
* Label ABOVE input. Helper text optional but present in markup. Error text BELOW input. Standard "gap-2" for input blocks.
* No placeholder-as-label. Ever.

### 4.7 Layout Discipline (Hard Rules. Failing any of these is shipping broken work)

* **Hero MUST fit in the initial viewport.** Headline max 2 lines on desktop, subtext max **20 words** AND max 3-4 lines, CTAs visible without scroll. If the copy is too long: reduce font scale OR cut copy. If you cannot describe the value-prop in 20 words of subtext, the value-prop is unclear, not the rule too tight. Never let the hero overflow and force scroll to find the CTA.
* **Hero font-scale discipline.** Plan font size and image size *together*. If the hero asset is large and the headline is more than 6 words, do not start at "text-7xl/text-8xl". Default sensible range: "text-4xl md:text-5xl lg:text-6xl" for most heroes; "text-6xl md:text-7xl" only when the headline is 3-5 words. A 4-line hero headline is always a font-size error, never a copy-length error.
* **HERO TOP PADDING CAP (mandatory):** Hero top padding max "pt-24" (≈6rem) at desktop. More than that means the hero content floats halfway down the viewport and reads as a layout bug, not as intentional space. If your hero needs more breathing room, increase font scale or asset size, not top padding.
* **HERO STACK DISCIPLINE (max 4 text elements).** The hero is a single moment, not a feature list. Allowed text elements, max 4 in total:
  1. Eyebrow (small uppercase label) OR brand strip OR neither - pick zero or one
  2. Headline (max 2 lines, see above)
  3. Subtext (max 20 words, max 4 lines)
  4. CTAs (1 primary + max 1 secondary)
  - **BANNED in the hero:** tiny tagline below CTAs ("Works with GitHub, GitLab, and self-hosted Git"), trust micro-strip ("Used by engineering teams at..."), pricing teaser ("Free for solo, $10/user for teams"), feature bullet list, social-proof avatar row. All of those move to dedicated sections directly below the hero.
  - If you have an eyebrow AND a tagline below CTAs in the same hero, drop the tagline. If you have a brand strip AND a tagline, drop the tagline. One small text element per hero, max.
* **"Used by" / "Trusted by" logo wall belongs UNDER the hero, never inside it.** The hero is for the value prop and primary CTA. The logo wall is a separate section directly below. Do not stuff trust logos into the same flex row as the hero copy.
* **Navigation MUST render on a single line on desktop.** If items don't fit at "lg" (1024px), condense labels, drop secondary items, or move to a hamburger. A two-line nav at desktop is broken design.
* **Navigation height cap: 80px max desktop, default 64-72px.** No huge "agency" nav bars that eat 15% of the viewport.
* **Bento grids MUST have rhythm, not one-sided repetition.** Do not stack 6 left-image / right-text rows. Vary the composition: alternate full-width feature rows, asymmetric tile sizes, vertical breaks.
* **BENTO CELL COUNT RULE (mandatory):** A bento grid has EXACTLY as many cells as you have content for. 3 items → 3 cells (1+2 split, or 2+1, or asymmetric trio). 5 items → 5 cells (2+3, 3+2, hero+4, etc.). If your grid has an empty cell in the middle or at the end, you planned wrong. Re-shape the grid; do not paste a blank tile.
* **Section-Layout-Repetition Ban.** Once you use a layout family for a section (e.g., 3-column-image-cards, full-width-quote, split-text-image), that family can appear at most ONCE on the page. "Selected commissions" must not look like "What we do." A landing page with 8 sections must use at least 4 different layout families.
* **ZIGZAG ALTERNATION CAP (mandatory).** Alternating "left-image + right-text" then "left-text + right-image" zigzag layout = banal. Max 2 sections in a row with this image+text-split pattern. The 3rd consecutive image+text split is a Pre-Flight Fail. Break the pattern with a full-width section, a vertical-stack section, a bento grid, a marquee, or a different layout family.
* **EYEBROW RESTRAINT (mandatory, the #1 violated rule in production tests).** An "eyebrow" is the small uppercase wide-tracking label sitting above a section headline (e.g. "FOUR COLORWAYS", "SELECTED WORK", "THE HARDWARE", "Git-native task management"). Typical CSS signature: "text-[11px] uppercase tracking-[0.18em]", "font-mono text-[10.5px] uppercase tracking-[0.22em]". Every AI-built site puts an eyebrow above EVERY section header, producing the same templated rhythm. Hard rule:
  - **Maximum 1 eyebrow per 3 sections.** Hero counts as 1. So a page with 9 sections may use at most 3 eyebrows total.
  - If section A has an eyebrow, the next 2 sections cannot have one.
  - **Pre-Flight Check is mechanical:** count instances of "uppercase tracking" (or similar small-caps mono labels above headlines) across all section components. If count > ceil(sectionCount / 3), the output fails.
  - **What to do instead of an eyebrow:** drop it entirely. The headline alone is enough. If you need to categorize a section, the section's location on the page already categorizes it; no label needed.
* **SPLIT-HEADER BAN (mandatory).** The pattern "left big headline + right small explainer paragraph" as a section header (left col-span-7/8, right col-span-4/5 with a small body paragraph floating in the right column) is **banned as default**. Sections should have ONE focused message. If you genuinely need both a headline and an explainer paragraph, stack them vertically (headline on top, body below, max-width 65ch). Reach for the split-header pattern only when there is a real compositional reason (e.g., the right column carries a visual or interactive element, not just filler text).
* **Bento Background Diversity (mandatory).** Bento and feature-gri d sections cannot be 6 white-on-white cards with text inside. At least 2-3 cells in any multi-cell grid need real visual variation: a real image, a brand-appropriate gradient (not AI-purple), a pattern, a tinted background. A cream-on-cream bento with only typography inside reads as boring AI default, even when the rest of the page is good.
* **Mobile collapse must be explicit per section.** For every multi-column layout, declare the "< 768px" fallback in the same component. No "it'll work, Tailwind handles it" assumptions.

### 4.9 Content Density

Landing pages live on the **first impression**, not the full read. Cut ruthlessly.

* **Default content shape per section:** short headline (≤ 8 words) + short sub-paragraph (≤ 25 words) + one visual asset OR one CTA. Anything more must be justified by the section's job.
* **No data-dump sections.** A 20-row publication table, a 30-row award list, a giant pricing matrix on a marketing page = wrong layout. Use:
  - Top 3-5 highlights + "View full list" link
  - Marquee / carousel for breadth
  - Different page entirely if the data is the product
* **Long lists need a different UI component, not a longer list.** Default "ul" with bullets / "divide-y" rows is the lazy choice. If you have > 5 items, reach for one of these instead:
  - 2-column split with grouped items
  - Card grid with image + label per item
  - Tabs / accordion if items are categorisable
  - Horizontal scroll-snap pills
  - Carousel for breadth-heavy lists (testimonials, logos, capabilities)
  - Marquee for "lots-of-things-that-don't-need-individual-attention"
  A spec sheet with 10 rows + a hairline under every row is the WORST default. Either group rows into 2-3 chunks with sparse dividers, or move to a card-per-spec layout.
* **Spec sheets specifically (the Marrow-cookware pattern).** A long product specification table with "border-b" on every row is the AI default for cookware / hardware / apparel / artisan-goods briefs. Banned. Concrete alternatives:
  - **2-col card grid:** each spec gets its own card with the spec name, the value (large display number), and a one-line "why it matters" body. Cards arranged 2-col on desktop, 1-col mobile.
  - **Scroll-snap horizontal pills:** each spec is a pill, user can flick through.
  - **Grouped chunks:** group 10 specs into 3 logical clusters (e.g. "Materials", "Cooking", "Warranty"), each cluster gets ONE soft divider and a cluster heading.
  - **Featured-vs-rest:** 3-4 hero specs visualised as large display tiles, the rest collapsed under a "View full specifications" disclosure.

### 4.10 Quotes & Testimonials

* **Max 3 lines** of quote body. Never 6. If the original quote is longer → cut it. A landing-page quote is a snippet, not the full review.
* For very small font sizes (e.g. footer-style testimonials), the line cap can stretch slightly. Spirit: "fits in a glance."
* **No em-dashes inside the quote text** as design flourish (long pauses, kinetic em-dashes, em-dash-bullets). See Section 9.G - em-dash is completely banned.
* Attribution: name + role + (optionally) company. Never name only ("- Sarah").
* Quote marks: use real typographic quotes ( " " ) or none at all. Not straight ASCII ( " ).

---

## 5. CONTEXT-AWARE PROACTIVITY

These are tools, not defaults. Use them when the design read calls for them. **None of these fire automatically.**

* **Liquid Glass / Glassmorphism:** Appropriate for premium consumer, Apple-adjacent, luxury brand, or media-overlay vibes. Inappropriate for dashboards, public-sector, or "boring B2B." When used, go beyond "backdrop-blur": add a 1px inner border ("border-white/10") and a subtle inner shadow ("shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]") for physical edge refraction. Provide a solid-fill fallback under "prefers-reduced-transparency".
* **Magnetic Micro-physics:** Use when "MOTION_INTENSITY > 5" AND the brief reads premium / playful / agency. Implement EXCLUSIVELY with Motion's "useMotionValue" / "useTransform" outside the React render cycle. Never useState. See Section 3.B.
* **Perpetual Micro-Interactions** (Pulse, Typewriter, Float, Shimmer, Carousel): Use when "MOTION_INTENSITY > 5" AND the section actively benefits from motion (status indicators, live feeds, AI-feel). **Not every card needs an infinite loop.** If a section is informational, leave it still. Apply Spring Physics (type: "spring", stiffness: 100, damping: 20) - no linear easing.
* **"Motion claimed, motion shown."** If "MOTION_INTENSITY > 4", the page must actually move: entry transitions on hero, scroll-reveal on key sections, hover physics on CTAs, at minimum. A static page that claims "MOTION_INTENSITY: 7" is broken. Conversely, if you cannot ship working motion in the available scope, drop the dial to 3 and ship a clean static page. Never half-build motion that breaks (cut-off ScrollTriggers, jumpy enters, missing cleanups).
* **MOTION MUST BE MOTIVATED (mandatory).** Before adding any animation, ask: "what does this animation communicate?" Valid answers: hierarchy (drawing attention to the right thing), storytelling (revealing content in sequence that matches a narrative), feedback (acknowledging a user action), state transition (showing something changed). Invalid answer: "it looked cool". GSAP everywhere because GSAP is available is amateur. Each ScrollTrigger, each marquee, each pinned section needs a reason. If you cannot articulate the reason in one sentence, drop the animation.
* **MARQUEE MAX-ONE-PER-PAGE (mandatory).** Horizontal scrolling text marquees ("logos endlessly scrolling", "manifesto scrolling sideways", "kinetic word strip") are appropriate at most ONCE per page. Two or more marquees on the same page reads as lazy filler. Pick the one section where the marquee actually serves the content; the others get a different layout.
* **GSAP Sticky-Stack Pattern (when scroll-stack is used).** A "card stack on scroll" must be a REAL sticky-stack, not a sequential reveal list. See Section 5.A below for the canonical code skeleton. Common failure: trigger fires halfway through scroll instead of pinning at viewport top. Fix: "start: "top top"" not "start: "top center"" or ""top 80%"".
* **GSAP Horizontal-Pan Pattern (when horizontal scroll-hijack is used).** See Section 5.B below for the canonical skeleton. Common failure: animation starts before the section is pinned, so the user sees half a slide. Same fix: "start: "top top"", pin the wrapper, scrub the inner track.

### 5.A Sticky-Stack - Canonical Skeleton

*(Note: The following is a canonical code skeleton provided for the AI to implement this pattern correctly. It represents production-ready architecture for scroll-stacking.)*

\`\`\`tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function StickyStack({ cards }: { cards: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !ref.current) return;
    const ctx = gsap.context(() => {
      const cardEls = gsap.utils.toArray<HTMLElement>(".stack-card");
      cardEls.forEach((card, i) => {
        if (i === cardEls.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: "top top",                              // pin at viewport top
          endTrigger: cardEls[cardEls.length - 1],
          end: "top top",
          pin: true,
          pinSpacing: false,
        });
        gsap.to(card, {
          scale: 0.92,
          opacity: 0.55,
          ease: "none",
          scrollTrigger: {
            trigger: cardEls[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div ref={ref} className="relative">
      {cards.map((card, i) => (
        <div
          key={i}
          className="stack-card sticky top-0 min-h-[100dvh] flex items-center justify-center"
        >
          {card}
        </div>
      ))}
    </div>
  );
}
\`\`\`

Critical points: \`start: "top top"\`, \`pin: true\`, every card except the last is pinned, the scale/opacity transform is driven by the NEXT card's scroll trigger (so previous card shrinks as next one arrives).

### 5.B Horizontal-Pan - Canonical Skeleton

\`\`\`tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function HorizontalPan({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !wrap.current || !track.current) return;
    const ctx = gsap.context(() => {
      const distance = track.current!.scrollWidth - window.innerWidth;
      gsap.to(track.current, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",                              // pin starts when section top hits viewport top
          end: () => \`+=\${distance}\`,                    // scroll distance = track width minus viewport
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={wrap} className="relative overflow-hidden">
      <div ref={track} className="flex h-[100dvh] items-center">
        {children}
      </div>
    </section>
  );
}
\`\`\`

Critical points: \`start: "top top"\`, \`pin: true\`, \`end: "+=\${distance}"\` (scroll length = horizontal travel needed), \`scrub: 1\`. The wrapper is pinned, the inner track slides horizontally as the user scrolls vertically.



## 9. AI TELLS (Forbidden Patterns)

Avoid these signatures

### 9.A Visual & CSS
* **NO neon / outer glows** by default. Use inner borders or subtle tinted shadows.
* **NO pure black. Off-black, zinc-950, or charcoal.
* **NO oversaturated accents.** Desaturate to blend with neutrals.
* **NO excessive gradient text** for large headers.
* **NO custom mouse cursors.** Outdated, accessibility-hostile, perf-hostile.

### 9.B Typography
* **AVOID Inter as default.** See Section 4.1. Override path exists.
* **NO oversized H1s** that just scream. Control hierarchy with weight + color, not raw scale.
* **Serif constraints:** Serif for editorial / luxury / publication. Not for dashboards.

### 9.C Layout & Spacing
* **Mathematically perfect** padding and margins. No floating elements with awkward gaps.
* **NO 3-column equal feature cards.** The generic "three identical cards horizontally" feature row is banned. Use 2-column zig-zag, asymmetric grid, scroll-pinned, or horizontal-scroll alternative.

### 9.D Content & Data ("Jane Doe" Effect)
* **NO generic names.** "John Doe", "Sarah Chan", "Jack Su" → use creative, realistic, locale-appropriate names.
* **NO generic avatars.** No SVG "egg" or Lucide user icons → use believable photo placeholders or specific styling.
* **NO startup-slop brand names.** "Acme", "Nexus", "SmartFlow", "Cloudly" → invent contextual, premium names that sound real.
* **NO filler verbs.** "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize" → concrete verbs only.

### 9.E External Resources & Components
* **NO hand-rolled SVG icons.** Use Phosphor / HugeIcons / Radix / Tabler. Lucide on explicit request only.
* **Hand-rolled decorative SVGs strongly discouraged** as default (see Section 4.8).
* **NO div-based fake screenshots.** Never build a fake product UI out of "div" rectangles to simulate a screenshot. Use real images, generated images, or skip the preview.
* **shadcn/ui customization:** Allowed, but NEVER in default state. Customize radii, colors, shadows, typography to the project aesthetic.
* **Production-Ready Cleanliness:** Code visually clean, memorable, meticulously refined.

### 9.F Production-Test Tells (banned outright)

These patterns came out of real LLM-generated landing-page tests. They are the signatures the model defaults to when it tries to "look designed." Treat them as hard bans unless the brief explicitly calls for one.

**Hero & top-of-page**
* **NO version labels in the hero.** "V0.6", "v2.0", "BETA", "INVITE-ONLY PREVIEW", "EARLY ACCESS", "ALPHA" - banned as default eyebrows. Only acceptable when the brief is explicitly about a product launch / preview status.
* **NO "Brand · No. 01"-style sub-eyebrows.** "Marrow · No. 01 · The 6-quart" type micro-meta lines. Skip them.

**Section numbering & micro-labels**
* **NO section-number eyebrows.** "00 / INDEX", "001 · Capabilities", "002 · Featured commission", "06 · how it works", "05 · The honest table" - banned. Eyebrows should name the topic in plain language, not enumerate.
* **NO "01 / 4"-style pagination on images or bento tiles.** If the user can count, they don't need the label.
* **NO "Scroll · 001 Capabilities"-style scroll cues.** A simple arrow or "Scroll" is enough; no section-number prefix.
* **NO "Index of Work, 2018 - 2026"-style range labels** as eyebrows. Just say what the section is.

**Separators & dots**
* **NO decorative colored status dots on every list/nav/badge.** A colored dot before "ONE Q4 SLOT OPEN" or before every nav link, or every task row - banned by default. Acceptable only when the dot conveys actual semantic state (a server status, an availability flag) and is used sparingly.
**Fake product previews**
* **NO div-based fake product UI in the hero** (fake task list, fake terminal, fake dashboard built from styled divs). It is the #1 LLM-design Tell. Use a real screenshot, a generated image, a real component preview, or none at all.
* **NO fake version footers** ("v0.6.2-rc.1", "last sync 4s ago · main") inside fake screenshots. Adds nothing, screams AI.

**Marketing-copy Tells**
* **NO "Quietly in use at" / "Quietly trusted by"** social-proof headers. Use natural language: "Trusted by", "Used at", "Customers include", or skip the heading entirely if the logos speak.
* **NO "From the field" / "Field notes" / "Currently on the bench" / "On our desks" / "Loose plates" style poetic labels** on quote, blog, or sidebar sections. Reads as performative-craftsman. Use plain functional labels ("Testimonials", "Latest writing", "Now working on") or skip the label.
* **NO "We respect the French ones"-style** mock-humble industry-references in body copy. Cute and AI-y.
* **NO weather / locale strips** ("LIS 14:23 · 18°C") in headers/footers unless the brief is explicitly about a place / time-zone-distributed studio.
* **NO micro-meta-sentences under eyebrows.** Sentences like *"Each of these is a feature we ship today, not a roadmap promise. The list will stay short on purpose."* sitting under a section heading are clutter. Eyebrow + Headline + Body is enough.
* **NO generic step labels.** "Stage 1 / Stage 2 / Stage 3", "Step 1 / Step 2 / Step 3", "Phase 01 / Phase 02 / Phase 03", "Pass One / Pass Two / Pass Three". Banned. The actual step content is the label. If you must show progression, use the verb-noun directly ("Install", "Configure", "Ship") not "Stage 1: Install".

## 10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know)

This is a vocabulary, not a library. The agent should KNOW these pattern names to communicate about them, design with them in mind, and reach for them when the design read calls for them. **Implementations and code sketches live in the Block Library (Section 12), which is populated iteratively.**

### Hero Paradigms
* **Asymmetric Split Hero** - Text on one side, asset on the other, generous white space.
* **Editorial Manifesto Hero** - Large type, no asset, almost-poster.
* **Video / Media Mask Hero** - Type cut out as mask over video background.
* **Kinetic-Type Hero** - Animated typography as the primary visual.
* **Curtain-Reveal Hero** - Hero parts on scroll like a curtain.
* **Scroll-Pinned Hero** - Hero stays pinned while content scrolls behind.

### Navigation & Menus
* **Mac OS Dock Magnification** - Edge nav, icons scale fluidly on hover.
* **Magnetic Button** - Pulls toward cursor.
* **Gooey Menu** - Sub-items detach like viscous liquid.
* **Dynamic Island** - Morphing pill for status / alerts.
* **Contextual Radial Menu** - Circular menu expanding at click point.
* **Floating Speed Dial** - FAB springing into curved secondary actions.
* **Mega Menu Reveal** - Full-screen dropdown, stagger-fade content.

### Layout & Grids
* **Bento Grid** - Asymmetric tile grouping (Apple Control Center).
* **Masonry Layout** - Staggered grid, no fixed row height.
* **Chroma Grid** - Borders / tiles with subtle animating gradients.
* **Split-Screen Scroll** - Two halves sliding in opposite directions.
* **Sticky-Stack Sections** - Sections that pin and stack on scroll.

### Cards & Containers
* **Parallax Tilt Card** - 3D tilt tracking mouse coordinates.
* **Spotlight Border Card** - Borders illuminate under cursor.
* **Glassmorphism Panel** - Frosted glass with inner refraction.
* **Holographic Foil Card** - Iridescent rainbow shift on hover.
* **Tinder Swipe Stack** - Physical card stack, swipe-away.
* **Morphing Modal** - Button expands into its own dialog.

### Scroll Animations
* **Sticky Scroll Stack** - Cards stick and physically stack.
* **Horizontal Scroll Hijack** - Vertical scroll → horizontal pan.
* **Locomotive / Sequence Scroll** - Video / 3D sequence tied to scrollbar.
* **Zoom Parallax** - Central background image zooming on scroll.
* **Scroll Progress Path** - SVG line drawing along scroll.
* **Liquid Swipe Transition** - Page transition like viscous liquid.

### Galleries & Media
* **Dome Gallery** - 3D panoramic gallery.
* **Coverflow Carousel** - 3D carousel with angled edges.
* **Drag-to-Pan Grid** - Boundless draggable canvas.
* **Accordion Image Slider** - Narrow strips expanding on hover.
* **Hover Image Trail** - Mouse leaves popping image trail.
* **Glitch Effect Image** - RGB-channel shift on hover.

### Typography & Text
* **Kinetic Marquee** - Endless text bands reversing on scroll.
* **Text Mask Reveal** - Massive type as transparent window to video.
* **Text Scramble Effect** - Matrix-style decoding on load / hover.
* **Circular Text Path** - Text curving along spinning circle.
* **Gradient Stroke Animation** - Outlined text with running gradient.
* **Kinetic Typography Grid** - Letters dodging the cursor.

### Micro-Interactions & Effects
* **Particle Explosion Button** - CTA shatters into particles on success.
* **Liquid Pull-to-Refresh** - Reload indicator like detaching droplets.
* **Skeleton Shimmer** - Shifting light reflection across placeholders.
* **Directional Hover-Aware Button** - Fill enters from cursor's exact side.
* **Ripple Click Effect** - Wave from click coordinates.
* **Animated SVG Line Drawing** - Vectors drawing themselves in real time.
* **Mesh Gradient Background** - Organic lava-lamp blobs.
* **Lens Blur Depth** - Background UI blurred to focus foreground action
    
    
    
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
    `- **On-Primary** (${ds.onPrimary}): Premium high contrast typography text on top of primary elements.`,
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
