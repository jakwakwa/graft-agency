/** In-app destinations for marketing navigation (aligned with `components/marketing/landing-footer.tsx`). */
export const LANDING_ROUTES = {
  home: "/",
  leadCapture: "/dashboard/automation/leads",
  midnightProspector: "/dashboard/automation/queue",
  whiteLabel: "/portal/embed",
  dashboard: "/dashboard/automation",
  /** Tenant-scoped dashboard (client workspace). */
  tenantDashboard: "/tenant",
  portal: "/portal",
  portalBilling: "/portal/billing",
  portalSettings: "/portal/settings",
  privacy: "/privacy",
  terms: "/terms",
} as const;

/**
 * Marketing header + on-page footer rows: must match `id` on sections (`landing-hero-section`, `landing-features-section`, `landing-cta-section`).
 */
export const LANDING_HEADER_SECTIONS = [
  { id: "lead-capture", label: "Lead Capture" },
  { id: "midnight-prospector", label: "Midnight Prospector" },
  { id: "white-label", label: "White-Label" },
] as const;

export const landingShellClassName =
  "min-h-screen bg-[#070708] text-[#e5e0ed] h-full font-['Inter',sans-serif] overflow-x-hidden selection:bg-[#9888ff]/30 selection:text-white relative";

export const landingContainerClassName = "mx-auto max-w-7xl px-6";
