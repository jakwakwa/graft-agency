---
name: Graft-Kit Clarity
colors:
  surface: '#fdf8f8'
  surface-dim: '#ddd9d8'
  surface-bright: '#fdf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3f2'
  surface-container: '#f1edec'
  surface-container-high: '#ebe7e6'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#444748'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#5e5f5c'
  on-secondary: '#ffffff'
  secondary-container: '#e0e0dc'
  on-secondary-container: '#626360'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#3e0400'
  on-tertiary-container: '#f24223'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#e3e2df'
  secondary-fixed-dim: '#c7c7c3'
  on-secondary-fixed: '#1b1c1a'
  on-secondary-fixed-variant: '#464744'
  tertiary-fixed: '#ffdad3'
  tertiary-fixed-dim: '#ffb4a5'
  on-tertiary-fixed: '#3e0400'
  on-tertiary-fixed-variant: '#8e1300'
  background: '#fdf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
  page-bg: '#FAF9F5'
  panel-bg: '#F0EFEB'
  soft-card: '#E9E8E4'
  white-card: '#FFFDF8'
  muted-text: '#8C8880'
  line-border: '#D9D7D0'
  accent-gradient-start: '#FF416C'
  accent-gradient-end: '#FF4B2B'
typography:
  display-xl:
    fontFamily: Helvetica
    fontSize: 120px
    fontWeight: '700'
    lineHeight: '0.9'
    letterSpacing: -0.05em
  display-lg:
    fontFamily: Helvetica
    fontSize: 82px
    fontWeight: '700'
    lineHeight: '1.05'
    letterSpacing: -0.04em
  h1:
    fontFamily: Helvetica
    fontSize: 49px
    fontWeight: '300'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  h2:
    fontFamily: Helvetica
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h3:
    fontFamily: Helvetica
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Helvetica
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Helvetica
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-caps:
    fontFamily: Helvetica
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
  display-lg-mobile:
    fontFamily: Helvetica
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  xs: 8px
  sm: 16px
  gutter: 24px
  md: 32px
  margin: 40px
  lg: 64px
  xl: 128px
  section: 160px
---

## Brand & Style

GRAFT TODAY unifies the "Prospective Engagement Intelligence" of an organization through a sophisticated blend of **Corporate Modernism** and **Glassmorphism**. The brand personality is authoritative yet ethereal, positioned as an "Operating System" for high-end creative work. 

The aesthetic is characterized by massive, tight-tracked display typography, ultra-wide layouts, and "floating" UI elements that utilize high-saturation backdrop blurs and translucent borders. The emotional response is one of absolute clarity, focus, and premium technical capability. Key visual motifs include circular geometric symbols and layered "glass" cards that appear to drift over a warm, tactile neutral background.

## Colors

The palette is built on a "Warm Minimalist" foundation. The primary background (`#FAF9F5`) is an off-white bone tone that feels more organic and premium than pure white. 

**Core Palette:**
- **Primary Ink:** A deep, near-black (`#1B1B1B`) used for all major headings and high-contrast UI elements.
- **Vibrant Accents:** A high-energy "Solar Red" gradient is used sparingly for status indicators, AI-driven features (GRAFT TODAY Studio), and active UI states.
- **Neutral Layers:** Varying levels of desaturated warm greys create hierarchy within containers without introducing new hues.
- **Glass Effects:** Pure white with 10%–40% opacity is used for backdrop-blur surfaces to maintain legibility over complex backgrounds.

## Typography

The typography system relies on a strictly Swiss-style Neo-Grotesque (Helvetica/Arial) to maintain a neutral, systematic "OS" feel. 

Hierarchy is established through extreme scale. The **Display XL** role is used for central thematic anchors, featuring "tighter than normal" leading that forces words to stack like blocks. **H1** headers move into a "Light" weight to provide a sophisticated, editorial contrast to the heavy display faces. 

For functional UI (labels, buttons, metadata), use the **Label Caps** style with generous letter spacing (10%) to ensure legibility at small sizes. All body text should maintain a comfortable 1.6x line height to balance the density of the headers.

## Layout & Spacing

The layout uses a **Contextual Fluid Grid** that anchors to a maximum content width of 1728px. 

- **Outer Margins:** 40px on desktop, scaling down to 24px on mobile.
- **Section Rhythm:** Vertical separation between major content blocks is aggressive (160px), creating a sense of "premium space."
- **Internal Spacing:** Components follow a 4px base unit. Cards use 32px (md) internal padding to maintain the "airy" brand feel.
- **Floating Collage Model:** For hero areas or "intelligence" visualizations, elements are placed using percentage-based absolute positioning rather than strict grid columns, allowing for overlapping "depth" layers.

## Elevation & Depth

Depth is not communicated through traditional shadows, but through **material properties and blurs**:

1.  **Level 0 (Base):** The Warm Neutral background (`#FAF9F5`).
2.  **Level 1 (Submerged):** Inset panels using `#F0EFEB` with no shadows, used for large feature backgrounds.
3.  **Level 2 (Surface):** White cards with subtle 1px borders (`#D9D7D0/20`) and "Soft" shadows (Large blur radius, very low 5-8% opacity).
4.  **Level 3 (Glass/Floating):** Semi-transparent white (`rgba(255,255,255,0.3)`) with a `40px` backdrop-blur. These must have a high-contrast 1px border (`white/50`) to define their edges against the background.
5.  **Level 4 (Interactive):** Elements like the Top Nav use `black/80` with heavy blur and a `white/10` border to "cut through" the background content.

## Shapes

The shape language is defined by **Extreme Rounding**. 

- **Primary Containers:** Large section cards and feature images use a `40px` (4xl) radius.
- **UI Cards:** Standard interface components use a `32px` (3xl) radius.
- **Interactive Elements:** Buttons, navigation bars, and badges are always **Fully Rounded (Pill-shaped)**.
- **Icons:** Use "Material Symbols Outlined" with a thin stroke weight (200-300) to match the refinement of the typography.

## Components

**Buttons:**
- **Primary:** Pill-shaped, Solid Black (`#1B1B1B`), White text. High-contrast, no shadow.
- **Secondary:** Pill-shaped, Transparent with a 1px border of `text/30`. On hover, fills with solid primary color.
- **Special (AI):** Uses the `FF416C` to `FF4B2B` gradient with a pulse animation for high-intent actions.

**Cards:**
- **Feature Cards:** Large `40px` radius, subtle inner border, and deep 60px blur shadows.
- **Glass Overlays:** Small `24px` radius, `backdrop-filter: blur(20px)`, and high-contrast white top-border.

**Navigation:**
- **Floating AppBar:** Centered, max-width 700px, pill-shaped. Dark background (`black/90`) with `backdrop-filter: blur(12px)`. Links use `label-caps` typography.

**Inputs & Tags:**
- **Tags:** Fully rounded, background matches `panel-bg`, `label-caps` text.
- **Status Indicators:** 8px circles with high-glow (box-shadow) in vibrant green or red.
