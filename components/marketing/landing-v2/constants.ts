/** In-app destinations for marketing navigation. */
export const LANDING_ROUTES = {
  home: "/",
  whiteLabel: "/portal/embed",
  dashboard: "/dashboard/automation",
  portal: "/portal",
  portalBilling: "/portal/billing",
  portalSettings: "/portal/settings",
  privacy: "/privacy",
  terms: "/terms",
  security: "/security",
  refunds: "/refunds",
} as const;

/**
 * Marketing header + on-page footer rows: must match `id` on sections (`landing-hero-section`, `landing-features-section`, `landing-cta-section`).
 */
export const LANDING_HEADER_SECTIONS = [
  { id: "smart-triage", label: "Smart Triage" },
  { id: "bot-pricing", label: "Pricing" },
  { id: "website-pricing", label:"Pre-configured Builds" },
] as const;

export const landingShellClassName =
  "min-h-screen bg-[#070708] text-[#e5e0ed] h-full font-['Inter',sans-serif] overflow-x-hidden selection:bg-[#9888ff]/30 selection:text-white relative";

export const landingContainerClassName = "mx-auto max-w-7xl px-6";
