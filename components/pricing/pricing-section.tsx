import { buildPricingCatalog, type PricingCatalog, type PricingMode } from "@/lib/billing/pricing-catalog";
import { type PaddleConfig, type PricingCustomer, PricingSectionClient } from "./pricing-section-client";

interface PricingSectionProps {
  catalogue?: PricingCatalog;
  mode: PricingMode;
  paddleConfig: PaddleConfig;
  customer?: PricingCustomer;
  kindFilter?: "bot" | "website" | "all";
  id?: string;
}

export function PricingSection({
  catalogue = buildPricingCatalog(),
  mode,
  paddleConfig,
  customer,
  kindFilter = "all",
  id = "pricing",
}: PricingSectionProps) {
  return (
    <PricingSectionClient
      catalogue={catalogue}
      mode={mode}
      paddleConfig={paddleConfig}
      customer={customer}
      kindFilter={kindFilter}
      id={id}
    />
  );
}
