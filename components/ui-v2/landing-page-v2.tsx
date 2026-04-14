import { landingShellClassName } from "@/components/ui-v2/landing/constants";
import { LandingBackground } from "@/components/ui-v2/landing/landing-background";
import { LandingCtaSection } from "@/components/ui-v2/landing/landing-cta-section";
import { LandingFeaturesSection } from "@/components/ui-v2/landing/landing-features-section";
import { LandingHeroSection } from "@/components/ui-v2/landing/landing-hero-section";
import { LandingSiteFooter } from "@/components/ui-v2/landing/landing-site-footer";
import { LandingSiteHeader } from "@/components/ui-v2/landing/landing-site-header";

export default function LandingPageV2() {
  return (
    <div className={landingShellClassName}>
      <LandingBackground />
      <LandingSiteHeader />
      <main className="relative z-10 pt-32 lg:pt-40">
        <LandingHeroSection />
        <LandingFeaturesSection />
        <LandingCtaSection />
      </main>
      <LandingSiteFooter />
    </div>
  );
}
