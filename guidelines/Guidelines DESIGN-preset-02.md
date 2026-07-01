---
***name: Obsidian Scholar
colors:
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c7c6c6'
  on-secondary: '#2f3131'
  secondary-container: '#484949'
  on-secondary-container: '#b8b8b8'
  tertiary: '#ffffff'
  on-tertiary: '#2f3131'
  tertiary-container: '#e2e2e2'
  on-tertiary-container: '#636565'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e3e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#141313'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
typography:
  display-xl:
    fontFamily: Noto Serif
    fontSize: 4.5rem
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 2.5rem
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Noto Serif
    fontSize: 2rem
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Manrope
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-md:
    fontFamily: Manrope
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Manrope
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 32px
  margin-mobile: 20px
  section-gap: 120px
---
# DESIGN.md (Preset02)

## Brand & Style

This design system is built for a high-end, academic, and professional learning environment. The brand personality is scholarly, focused, and prestigious, catering to learners who value deep work and distraction-free environments. 

The style utilizes Minimalism with an emphasis on Tonal Layering. By removing loud accents and focusing on a monochrome palette, the design system centers the user's attention on the educational content. The emotional response is one of calm authority and intellectual rigor. Visual interest is generated through masterful typography and the rhythmic use of negative space rather than decorative elements.

Colors

The palette is strictly monochromatic to maintain a premium feel. The background is a true black (#0A0A0A) to ensure deep contrast and energy efficiency on OLED displays. 

Surfaces are defined by "Deep Charcoal" tones that subtly lift from the base. Soft white typography (using 90% opacity for primary text) prevents eye strain common with pure white-on-black setups. Secondary text uses a medium gray to establish clear hierarchy without color interference. Borders are kept extremely low-contrast, acting as subtle guides rather than hard dividers.

Typography

This design system pairs the timeless, editorial feel of Noto Serif for headings with the geometric precision of Manrope for functional text. 

Headings should use wide margins and avoid tight tracking. For body text, line height is intentionally generous (1.6x) to improve readability during long-form reading sessions. Labels utilize a slight tracking increase and uppercase styling to provide a clear "meta" distinction from the primary narrative text.

Layout & Spacing

The layout philosophy follows a Fixed Grid model for desktop to ensure optimal line lengths for reading. A 12-column grid is used with wide 32px gutters to give elements breathing room.

Whitespace is treated as a first-class citizen. Section vertical spacing is intentionally large (120px+) to separate different learning modules or chapters, creating a "breathable" pace as the user scrolls. Content containers should rarely exceed 720px in width to maintain a premium, editorial feel and ensure the Serif typography remains legible.

Elevation & Depth

This design system avoids traditional heavy shadows in favor of Tonal Layers and Low-Contrast Outlines.

Depth is communicated through three primary surface levels:
Level 0 (Base): Pure black (#0A0A0A) for the main background.
Level 1 (Card/Section): Deep Charcoal (#121212) with a 1px border of #262626.
Level 2 (Popovers/Modals): Lighter Charcoal (#1C1C1C) with a very soft, 20% opacity black shadow (40px blur) to provide a soft lift.

Interactive states use subtle border color changes (from #262626 to #404040) rather than dramatic shifts in brightness.

Shapes

The shape language is "Soft" (0.25rem - 0.75rem). While the brand is serious, sharp corners are avoided to keep the UI approachable. 

Small components like checkboxes and small buttons use the base rounded (4px). Larger containers like course cards or video players use rounded-lg (8px). This creates a subtle architectural feel that feels structured but not aggressive.

Components

Buttons
Primary buttons are solid soft-white with black text, creating the strongest point of contrast on the page. Secondary buttons use a transparent background with a 1px charcoal border. All buttons use a transitions of 200ms for hover states.

Input Fields
Inputs are minimal, featuring only a bottom border in the resting state, transitioning to a full 1px box outline on focus. Labels sit small and uppercase above the field.

Course Cards
Cards are defined by their surface-elevated color. They should not have shadows. Instead, use a subtle increase in border brightness on hover. Content within cards should have 32px of internal padding.

Progress Indicators
Thin, 2px horizontal lines are used for progress. Completed segments are soft-white, while incomplete segments are deep charcoal (#262626).

Learning-Specific Components
Lesson Drawer: A slide-out panel for the syllabus using a 10% transparent background blur.
Focus Mode Toggle: A floating action button that strips all UI except the core text/video content.
Quote Blocks: Large-scale Noto Serif text with a thin vertical rule on the left to highlight key insights.
