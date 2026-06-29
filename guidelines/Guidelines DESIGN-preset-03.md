---
name: Obsidian Precision
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#ffffff'
  on-tertiary: '#003824'
  tertiary-container: '#6ffbbe'
  on-tertiary-container: '#00734e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.75'
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  label-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  gutter: 32px
  margin: 64px
  section-gap: 128px
  max-width: 1200px
---

# DESIGN.md (Preset 03)

## Brand & Style

This design system is built on a foundation of Minimalism blended with Corporate Modern sensibilities. It targets high-end enterprise users who value clarity, speed, and discretion. The aesthetic is "dark-first," utilizing deep charcoals rather than pure blacks to maintain soft transitions and a premium feel.

The UI should evoke a sense of calm authority and technical mastery. High-quality whitespace is used aggressively to separate concerns, ensuring that the user never feels overwhelmed. Every interaction should feel intentional and friction-less, moving away from decorative "fluff" toward functional elegance.

Colors

The palette is strictly controlled to maintain a high-end SaaS feel. The primary "color" is actually a lack of color—high-contrast white text against a deep slate background. 

Primary Background: A deep, desaturated navy-charcoal (#0F172A) serves as the canvas.
Accents: A sophisticated Indigo (#6366F1) is used sparingly for primary actions to provide a "digital-first" energy. 
Success/Utility: A crisp Emerald (#10B981) denotes positive trends or system status.
Surface Tints: Lighter shades of the neutral background (approx. 5-8% lighter) are used to define containers without breaking the dark-mode immersion.

Typography

This design system prioritizes legibility and hierarchy through a dual-font approach. Manrope is used for headlines to provide a refined, modern, and slightly geometric character that feels high-end. Inter is utilized for body and UI elements due to its exceptional clarity and systematic nature.

A generous line height (1.6 to 1.75) is applied to body text to ensure a "breezy" reading experience, preventing the dark background from feeling heavy. Headline tracking is slightly tightened to create a "locked-in" professional look for hero sections.

Layout & Spacing

This design system employs a Fixed Grid model for desktop to ensure a controlled, editorial-style presentation. The central content container is capped at 1200px.

Vertical Rhythm: Sections are separated by massive gaps (128px) to emphasize the premium nature of the brand.
Internal Spacing: A 4px base unit (0.25rem) governs all component padding. 
Grid: A 12-column grid is used for landing page features, typically following a 6-6 split for hero sections and 4-4-4 for feature cards.
Gutters: Wide 32px gutters prevent visual crowding between text blocks.

Elevation & Depth

To maintain a sleek, minimal aesthetic, this design system avoids heavy drop shadows. Instead, it uses Tonal Layers and Low-Contrast Outlines.

Surfaces: Elevated components (like cards) are distinguished by a slightly lighter background hex and a 1px border with 10% white opacity.
Backdrop Blurs: When modals or dropdowns appear, a subtle 12px blur (glassmorphism) is applied to the layer below to maintain context while focusing the user.
Interactive Depth: Hover states are signaled by a subtle increase in border-opacity or a shift in the background-tint, rather than an "upward" shadow movement.

Shapes

The shape language is "Soft" (0.25rem - 0.75rem). This choice balances the professional rigidity of a SaaS tool with a touch of modern friendliness. 

Small elements (buttons, inputs): Use the base 0.25rem (4px) radius.
Medium elements (cards, containers): Use the 0.5rem (8px) radius.
Large elements (modals, hero images): Use the 0.75rem (12px) radius.
Strictness: Avoid pill shapes or circles unless they are for avatars or notification badges.

Components

Buttons: Primary buttons use a solid white background with black text (Manrope SemiBold). Secondary buttons are "ghost" style with a 1px white border (20% opacity) and white text.
Inputs: Darker than the background (#0B1120) with a subtle 1px border. Focus state is a 1px Indigo border with no outer glow.
Cards: No background shadow. Use a 1px stroke (#FFFFFF, 10% opacity) and a slightly lighter fill than the page background to define the area.
Chips: Small, uppercase labels with a subtle background tint (e.g., Indigo at 15% opacity) to categorize features without visual noise.
Lists: Icon-led lists should use high-quality, thin-stroke (1.5px) SVG icons in the primary or secondary color.
Scrollbars: Custom-styled to be thin, dark, and rounded to disappear into the UI.
