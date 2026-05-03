import { PricingSection } from "@/components/pricing/pricing-section";
import { landingShellClassName } from "./constants";
import { LandingBackground } from "./landing-background";
import { LandingCtaSection } from "./landing-cta-section";
import { LandingFeaturesSection } from "./landing-features-section";
import { LandingHardenedGrid } from "./landing-hardened-grid";
import { LandingHeroSection } from "./landing-hero-section";
import { LandingSiteFooter } from "./landing-site-footer";
import { LandingSiteHeader } from "./landing-site-header";

export default function LandingPageV2() {
  const environment = process.env.PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox";

  return (
    <div className={landingShellClassName}>
      <LandingBackground />
      <LandingSiteHeader />
      <main className="relative z-10 pt-0 lg:mt-4 lg:pt-0">
        <LandingHeroSection />
        <LandingFeaturesSection />
        <LandingHardenedGrid />
        <LandingCtaSection />
        <PricingSection
          mode="landing"
          paddleConfig={{
            clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "",
            environment,
          }}
        />
      </main>
      <LandingSiteFooter />
    </div>
  );
}
