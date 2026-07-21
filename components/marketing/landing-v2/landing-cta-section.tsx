import { LandingSectionLink } from "./landing-section-link";

export function LandingCtaSection() {
  return (
    <section className="py-8 px-4 sm:py-16 sm:px-6 md:py-32 md:px-10 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] md:w-[800px] md:h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-10 relative z-10">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold tracking-tighter text-on-surface leading-none">
          ANSWER EVERY <span className="text-primary italic">ENQUIRY.</span>
        </h2>
        <p className="text-on-surface-variant text-base sm:text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
          Give website visitors an assistant they can open when they want help — answer questions, triaging  with
          consent, book appointments on request, and hand off to a human when needed.
        </p>
        <div className="flex justify-center items-center">
          <LandingSectionLink
            sectionId="bot-pricing"
            className="inline-flex px-5 py-3 text-sm md:px-10 md:py-4 md:text-base bg-chart-3 text-white font-bold rounded-xl uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-blue-400 hover:scale-105 transition-all shadow-2xl shadow-chart-3/30 cursor-pointer"
          >
            Explore Plans
          </LandingSectionLink>
        </div>
      </div>
    </section>
  );
}
