import { ArrowRight, Calendar, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { LANDING_ROUTES, landingContainerClassName } from "./constants";
import { HeroDashboardPreview } from "./hero-dashboard-preview";
import { LandingSectionLink } from "./landing-section-link";

export function LandingHeroSection() {
  return (
    <section
      id="lead-capture"
      className="relative pt-8 isolate scroll-mt-28 overflow-hidden pb-24 lg:scroll-mt-32 lg:pb-32"
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute top-[10%] left-1/2 h-[min(70vh,560px)] w-[min(92vw,780px)] -translate-x-1/2 rounded-full bg-ethereal-gradient opacity-15 blur-[80px] mix-blend-screen" />
      </div>

      <div
        className={`${landingContainerClassName} grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16 lg:gap-x-20`}
      >
        <div className="flex flex-col items-start gap-8">
          <Badge variant="default" pulseColor="#71a9f1">
            24/7 AI Receptionist Active
          </Badge>

          <Typography.H1>
            The Receptionist
            <br />
            <Typography.H1 className="font-['Ovo',serif]">That </Typography.H1>
            <Typography.H1>Never</Typography.H1>
            <br />
            <Typography.H1>Sleeps</Typography.H1>
            <span className="text-[#d0dada]">.</span>
          </Typography.H1>

          <Typography.Large>
            Elite AI agents engineered for the South African business rhythm. Captures leads, books consultations, and
            syncs with your calendar while the city sleeps—or when the grid goes down.
          </Typography.Large>

          <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
            <Button variant="default" className="w-full sm:w-auto" asChild>
              <Link href={LANDING_ROUTES.dashboard}>
                Hire Your AI Receptionist
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <LandingSectionLink sectionId="midnight-prospector">
                <ShieldCheck className="h-4 w-4 text-[#7bf7c8]" />
                <span className="text-left text-xs tracking-wider uppercase">
                  Security Standard
                  <br />
                  <span className="font-bold text-white">SHA-256 Encrypted</span>
                </span>
              </LandingSectionLink>
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-6 text-xs font-semibold tracking-wider text-[#8b8eab]">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-[#71a9f1]" /> ZERO LATENCY
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-[#fface8]" /> CALENDLY INTEGRATED
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-[#7bf7c8]" /> MILITARY GRADE
            </div>
          </div>
        </div>

        <HeroDashboardPreview />
      </div>
    </section>
  );
}
