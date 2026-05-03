import { buildPricingCatalog, type PricingCatalog, type PricingMode } from "@/lib/billing/pricing-catalog";
import { PricingSectionClient } from "./pricing-section-client";

interface PaddleConfig {
  clientToken: string;
  environment: "sandbox" | "production";
}

interface PricingCustomer {
  clientId: string;
  email: string;
  subscriptionActive: boolean;
}

interface PricingSectionProps {
  catalogue?: PricingCatalog;
  mode: PricingMode;
  paddleConfig: PaddleConfig;
  customer?: PricingCustomer;
}

export function PricingSection({
  catalogue = buildPricingCatalog(),
  mode,
  paddleConfig,
  customer,
}: PricingSectionProps) {
  return <PricingSectionClient catalogue={catalogue} mode={mode} paddleConfig={paddleConfig} customer={customer} />;
}
