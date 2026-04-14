import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui-v2/button";
import { BodyText, H2, TextGradient } from "@/components/ui-v2/Typography";
import { LANDING_ROUTES, landingContainerClassName } from "./constants";

export function LandingCtaSection() {
  return (
    <section
      id="white-label"
      className="landing-scroll-reveal relative scroll-mt-28 overflow-hidden py-32 text-center lg:scroll-mt-32"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-[#2f2b5a]/10 to-[#13121b]"
        aria-hidden
      />
      <div className={`${landingContainerClassName} relative z-10 max-w-4xl`}>
        <H2 className="mb-4 text-5xl leading-tight sm:text-6xl">
          Ready to Scale Your
          <br />
          <TextGradient gradient="accent">Unfair Advantage?</TextGradient>
        </H2>
        <BodyText className="mx-auto mb-10 max-w-2xl text-lg">
          Stop letting revenue slip through the cracks after 5 PM. Deploy your elite AI receptionist in less than 30
          minutes.
        </BodyText>
        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
          <Button
            variant="link"
            className="flex items-center gap-2 font-medium text-white transition-colors hover:text-[#fface8]"
            asChild
          >
            <Link href={LANDING_ROUTES.portalBilling}>
              View pricing plans <ArrowRight className="h-4 w-4 -rotate-45" />
            </Link>
          </Button>
          <Button variant="default" className="w-full sm:w-auto" asChild>
            <Link href={LANDING_ROUTES.dashboard}>
              Hire Your AI Receptionist
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
