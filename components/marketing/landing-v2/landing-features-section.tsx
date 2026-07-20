import { BotIcon, CalendarClock, IdCard } from "lucide-react";
import Image from "next/image";
import { Shimmer } from "@/components/ai-elements/shimmer";

export function LandingFeaturesSection() {
  return (
    <section className="py-10 px-4 sm:py-16 sm:px-6 md:py-24 md:px-10 max-w-7xl mx-auto relative">
      <div className="mb-8 md:mb-16 text-center space-y-2">
        <h2 className="text-5xl font-display md:text-5xl font-bold tracking-tight text-on-surface uppercase">
          The Graft <span className="text-chart-3">Service Ecosystem</span>
        </h2>
        <p className="text-on-surface-variant text-sm tracking-normal sm:tracking-[0.2em] uppercase font-semibold">
          Visitor-initiated enquiries, consent-based capture, booking on request.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
        <div
          id="lead-capture"
          className="glass-card  md:col-span-8 glass-panel rounded-xl p-4 sm:p-6 md:p-8 relative overflow-hidden transition-colors"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 group-hover:opacity-20 transition-opacity">
            <div className="relative h-full w-full">
              <Image
                alt="Data Visualization"
                className="object-cover animate-pulse opacity-80"
                data-alt="Complex 3D digital data streams and glowing nodes connecting in a neural network style visualization with vibrant pink and purple lights"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGFeBR6O32-W6JmXcylNnsdgWsXeQPsjuB7htCkUrNf3lFdaeEq24qdp858Yc1ctuRjv9o-gYK5Aqq5yySKi85l2UH5oTr8OM0MuTyaH_3q-c2Fsve3oPmNTa9uhdGkq_mfvFPY15WlUQIWHact_UqIpGBN8e7M82v-FZdjeFnsP3nuM_BSO6OQJEk7LRN4YoSDoLCu1XPuDWG4YPY03NAsz6wMWDslAcuY2nEuoKl1n3Xocog7zhAhZL83BXsoHHTXxy7Hrs3eUL0"
              />
            </div>
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="mb-3 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/5">
                <BotIcon className="h-8 w-8 text-chart-1 " />
              </div>
              <h3 className="text-xl font-display md:text-2xl font-bold text-on-surface mb-2">
                Consent-Based Lead Capture
              </h3>
              <p className="text-on-surface-variant text-lg font-light max-w-md">
                Visitors start the conversation. GraftBot answers their questions and only collects contact details when
                they choose to share them — no mass outreach, no harvested lists.
              </p>
            </div>
          </div>
        </div>
        <div
          id="smart-triage"
          className="md:col-span-4 glass-panel rounded-xl p-4 sm:p-6 md:p-8 border-l-4 border-secondary flex flex-col justify-between group"
        >
          <div>
            <div className="mb-3 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/15">
              <CalendarClock className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-2xl font-display font-normal text-on-surface mb-2">Enquiry Triage &amp; Booking</h3>
            <p className="text-on-surface-variant text-sm">
              When a visitor asks, GraftBot can answer in your brand voice, offer a booking if they request one, and
              hand off complex questions to your team.
            </p>
          </div>
          <div className="glass-card p-4 rounded-lg mt-4 border border-outline-variant/20">
            <div className="text-[10px] uppercase tracking-widest font-bold mb-2">Triage Agent Log</div>
            <div className="space-y-1 opacity-60">
              <Shimmer className="text-[11px] font-mono">Visitor asking about pricing... </Shimmer>
              <div>
                {" "}
                <div className="text-[10px] text-emerald-300 animate-pulse font-mono">
                  Qualified. Demo booked for Tue 09:00.
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          id="white-label"
          className="md:col-span-4 glass-panel rounded-xl p-4 sm:p-6 md:p-8 border-r-4 border-primary flex flex-col justify-between"
        >
          <div>
            <div className="mb-3 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/5">
              <IdCard className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-display font-normal text-on-surface mb-2">White-Label Wonder</h3>
            <p className="text-on-surface-variant text-sm">
              Resell our infrastructure under your own banner. Full CSS control and API-first architecture.
            </p>
          </div>
          <div className="mt-6">
            <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold font-display mb-2">
              Any brand identity
            </div>
            <div className="flex gap-2">
              <div className="w-5 h-5 rounded-full bg-[#ff3c6e] ring-1 ring-white/10" />
              <div className="w-5 h-5 rounded-full bg-[#38bdf8] ring-1 ring-white/10" />
              <div className="w-5 h-5 rounded-full bg-[#a78bfa] ring-1 ring-white/10" />
            </div>
          </div>
        </div>
        <div className="md:col-span-8 glass-panel rounded-xl p-4 sm:p-6 md:p-8 relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 opacity-7">
            <div className="w-full h-full bg-[radial-gradient(#ffffff90_1px,#00000020_1px)] bg-size-[10px_10px]"></div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-display font-normal text-on-surface mb-6 uppercase  tracking-[4px] opacity-80 ">
              How Conversations Work
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
              <div className="space-y-1">
                <div className="text-lg md:text-xl font-mono text-on-surface">Ask</div>
                <span className="text-[9px] uppercase  tracking-[4px] opacity-40   font-bold">Visitor Starts</span>
              </div>
              <div className="space-y-1">
                <div className="text-lg md:text-xl font-mono text-on-surface">Share</div>
                <span className="text-[9px] uppercase  tracking-[4px] opacity-40   font-bold">Opt-In Lead</span>
              </div>
              <div className="space-y-1">
                <div className="text-lg md:text-xl font-mono text-on-surface">Book</div>
                <span className="text-[9px] uppercase tracking-[4px] opacity-40 font-bold">On Request</span>
              </div>
              <div className="space-y-1">
                <div className="text-lg md:text-xl font-mono text-on-surface">Hand Off</div>
                <span className="text-[9px] uppercase  tracking-[4px] opacity-40   font-bold">To Your Team</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
