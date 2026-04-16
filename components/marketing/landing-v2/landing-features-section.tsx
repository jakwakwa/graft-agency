import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui-v2/badge";
import { landingContainerClassName } from "./constants";
import { LandingBentoGrid } from "./landing-bento-grid";

export function LandingFeaturesSection() {
  return (
    <section
      id="midnight-prospector"
      className={`landing-scroll-reveal ${landingContainerClassName} relative scroll-mt-28 py-24 lg:scroll-mt-32 lg:max-w-7xl`}
    >
      <div className="mb-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="lg:max-w-8xl  flex flex-col min-w-full">
          <Badge variant="outline" className="mb-6">
            Current Status: Stage 0 (AI Resilience Active)
          </Badge>
          <Typography.H2 className="mb-6">High-Performance Lead Orchestration</Typography.H2>
          <Typography.Large>
            Unlike basic chatbots, Graft AI understands intent, manages complex calendars, and operates with a local
            heartbeat.
          </Typography.Large>
        </div>
        <div className="relative flex min-h-[280px] w-full items-center justify-center lg:min-h-[320px]" aria-hidden>
          <div
            className="absolute inset-0 rounded-3xl opacity-90"
            style={{
              background:
                "radial-gradient(ellipse 85% 70% at 50% 38%, rgba(97, 47, 245, 0.22), rgba(19, 18, 27, 0.92) 52%, transparent 72%)",
            }}
          />
          <div className="relative h-px w-3/4 max-w-md bg-linear-to-r from-transparent via-[#fface8]/40 to-transparent" />
        </div>
      </div>

      <LandingBentoGrid />
    </section>
  );
}
