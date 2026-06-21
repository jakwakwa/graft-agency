import { LandingSectionLink } from "./landing-section-link";

export function LandingCtaSection() {
  return (
    <section className="py-14 px-4 sm:py-20 sm:px-6 md:py-32 md:px-10 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] md:w-[800px] md:h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-10 relative z-10">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-headline font-black tracking-tighter text-on-surface leading-none">
          STOP MISSING <span className="text-primary italic">OPPORTUNITIES.</span>
        </h2>
        <p className="text-on-surface-variant text-xl max-w-2xl mx-auto leading-relaxed">
          Transition from static lead forms to real-time semantic qualifying. Turn traffic into structured appointments
          with zero manual effort.
        </p>
        <div className="flex justify-center items-center">
          <LandingSectionLink
            sectionId="bot-pricing"
            className="inline-flex px-7 py-4 md:px-10 bg-[#9888ff] text-white font-bold rounded-xl uppercase tracking-[0.2em] hover:scale-105 transition-transform shadow-2xl shadow-[#9888ff]/30 cursor-pointer"
          >
            Explore Plans
          </LandingSectionLink>
        </div>
      </div>
    </section>
  );
}
