---
name: Coach Vici
colors:
  surface: '#0e112a'
  surface-dim: '#0e112a'
  surface-bright: '#343752'
  surface-container-lowest: '#090c25'
  surface-container-low: '#161933'
  surface-container: '#1b1e37'
  surface-container-high: '#252842'
  surface-container-highest: '#30334d'
  on-surface: '#dfe0ff'
  on-surface-variant: '#c5c5d4'
  inverse-surface: '#dfe0ff'
  inverse-on-surface: '#2c2e49'
  outline: '#8f909d'
  outline-variant: '#444652'
  surface-tint: '#b7c4ff'
  primary: '#b7c4ff'
  on-primary: '#032780'
  primary-container: '#8ba2ff'
  on-primary-container: '#18348c'
  inverse-primary: '#4058b0'
  secondary: '#c2c1ff'
  on-secondary: '#1800a7'
  secondary-container: '#3630bf'
  on-secondary-container: '#b1b1ff'
  tertiary: '#7cdb89'
  on-tertiary: '#003913'
  tertiary-container: '#5cba6c'
  on-tertiary-container: '#004719'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001552'
  on-primary-fixed-variant: '#263f96'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c2c1ff'
  on-secondary-fixed: '#0c006b'
  on-secondary-fixed-variant: '#332dbc'
  tertiary-fixed: '#97f8a3'
  tertiary-fixed-dim: '#7cdb89'
  on-tertiary-fixed: '#002108'
  on-tertiary-fixed-variant: '#00531f'
  background: '#0e112a'
  on-background: '#dfe0ff'
  surface-variant: '#30334d'
typography:
  display-xl:
    fontFamily: Public Sans
    fontSize: 72px
    fontWeight: '500'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Public Sans
    fontSize: 36px
    fontWeight: '500'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  label-mono:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.2em
  nav-link:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  container-max: 80rem
  section-padding: 6rem
  gutter: 1.5rem
  card-padding: 2rem
  unit: 4px
---

## Brand & Style

Coach Vici embodies a "Futuristic Academic" aesthetic, blending the rigor of institutional research with the sleekness of advanced AI technology. The brand personality is authoritative yet supportive, characterized by a sophisticated dark-mode environment that favors deep blues over pure blacks to maintain a premium, expansive feel.

The design style is a refined **Glassmorphism**, utilizing translucent layers, backdrop blurs, and subtle radial gradients to create a sense of depth and luminosity. This is balanced with **Minimalist** information density and high-quality typography to ensure the complex data remains accessible and professional. The overall emotional response should be one of "Structured Innovation"—the feeling that one is stepping into a high-tech laboratory designed for personal optimization.

## Colors

The color palette is built on a "Deep Space" foundation using `vici-dark` (#0a0d26). Primary accents use `vici-light-blue` (#8ba2ff) for technical highlights and `vici-purple` (#5e5ce6) for brand-specific UI elements and AI interactions. `vici-green` (#9effa9) serves as a high-contrast semantic color for success, completion, and growth metrics.

Gradients are essential to the visual language:
- **Hero Background:** A radial gradient from `vici-purple` at 15% opacity to the base dark background.
- **Text Gradients:** Important headers use a linear gradient from white to `vici-light-blue`.
- **Glass Effects:** Surfaces use white at 5% opacity with high blur values to create a "frosted" digital surface.

## Typography

The system relies on **Public Sans** for its institutional clarity and neutral balance, making it perfect for an academic-led AI platform. For technical labels and "system" status indicators, use **Space Grotesk** (or a similar geometric mono) to inject a futuristic, data-heavy feel.

Hierarchy is established through extreme scale: very large, tight-leaded display text for impact, and tiny, tracked-out monospaced labels for metadata. Use the white-to-blue gradient on primary headlines to soften the impact of large typography on the dark background.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy centered in a 1280px (80rem) container. Vertical rhythm is governed by a 4px baseline unit, with generous section padding (96px/6rem) to create the "airy" feel necessary for high-end digital experiences.

Components like the Lead Form Bar utilize a "Composite Bar" layout, where multiple inputs are grouped into a single visual container, separated only by thin, low-opacity borders. This minimizes visual noise and emphasizes the workflow.

## Elevation & Depth

Elevation is achieved through **Backdrop Blurs** rather than traditional shadows. Surfaces are defined by:
1.  **Base Layer:** The solid `#0a0d26` background.
2.  **Surface Layer:** `rgba(255, 255, 255, 0.05)` with a 12px blur.
3.  **Active/Raised Layer:** A slightly higher opacity (8-10%) or the addition of a 1px white border at 10% opacity.

The only significant shadow used is a `shadow-2xl` on floating action buttons (FABs) to pop them out of the blurred glass hierarchy. Interaction depth is created using scale transforms (e.g., `scale-105`) rather than moving elements closer on the Z-axis.

## Shapes

The shape language is "Squircle-adjacent," utilizing generous corner radii to humanize the technical aesthetic. 
- **Cards:** Use `rounded-2xl` (1.5rem) or even `3rem` for large feature containers to emphasize the "capsule" feel.
- **Interactive Elements:** Buttons and tags use `rounded-full` (9999px) for a soft, pill-shaped profile that contrasts with the structured grid.
- **Inputs:** Use `rounded-xl` (0.75rem) to differentiate them from buttons while maintaining the soft-corner theme.

## Components

### Buttons
- **Primary:** Pill-shaped, white background with dark text. Transitions to `vici-green` on hover.
- **Secondary/Demo:** Large, `rounded-xl`, dark background with a 1px border. Uses heavy tracking and tiny uppercase text for a "System Initialize" feel.
- **Action Icons:** 12px rounded squares (not circles) with centered icons, typically using `vici-green` or `vici-purple`.

### Input Fields
- Transparent backgrounds with `backdrop-filter: blur(12px)`.
- Bottom-only or subtle 1px borders.
- Focused state: Border transitions to `vici-green` with a soft glow (box-shadow).

### Cards
- **Glass Card:** The standard container. 1px white border at 5-10% opacity, `backdrop-blur-md`, and a subtle inner glow.
- **Chat Bubble (AI):** Simple glass card style with a `vici-purple` icon identifier.
- **Chat Bubble (User):** `vici-purple` at 20% opacity with a `vici-purple` border; no background blur to distinguish it from the "system."

### Progress & Metrics
- Linear progress bars should be thin (4px) with a `vici-green` fill and a low-opacity white track.
- Use `10px` monospaced labels above metrics for a "dashboard" effect.