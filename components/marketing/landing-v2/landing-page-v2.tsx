import { landingShellClassName } from "./constants";
import { LandingBackground } from "./landing-background";
import { LandingCtaSection } from "./landing-cta-section";
import { LandingFeaturesSection } from "./landing-features-section";
import { LandingHeroSection } from "./landing-hero-section";
import { LandingSiteFooter } from "./landing-site-footer";
import { LandingSiteHeader } from "./landing-site-header";


export default function LandingPageV2() {
  return (
    <div className={landingShellClassName}>
      <LandingBackground />
      <LandingSiteHeader />
      <main className="relative z-10 pt-0 lg:mt-4 lg:pt-0">
        <LandingHeroSection />
        <LandingFeaturesSection />
        <LandingCtaSection />
      </main>
      <LandingSiteFooter />
    </div>
  );
}
