import { Brain, Brain01Icon } from "@hugeicons/core-free-icons";
import { BrainCircuit, IdCard, Radar } from "lucide-react";
import Image from "next/image";

export function LandingFeaturesSection() {
  return (
    <section className="py-24 px-10 max-w-7xl mx-auto relative">
      <div className="mb-16 text-center space-y-2">
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-on-surface uppercase">
          The Graft <span className="text-primary">Ecosystem</span>
        </h2>
        <p className="text-on-surface-variant text-sm tracking-[0.2em] uppercase font-semibold">
          Autonomous operations for the elite.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
        <div className="md:col-span-8 glass-panel rounded-xl p-8 relative overflow-hidden group hover:border-primary/40 transition-colors">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 group-hover:opacity-20 transition-opacity">
            <div className="relative h-full w-full">
              <Image
                alt="Data Visualization"
                className="object-cover"
                data-alt="Complex 3D digital data streams and glowing nodes connecting in a neural network style visualization with vibrant pink and purple lights"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGFeBR6O32-W6JmXcylNnsdgWsXeQPsjuB7htCkUrNf3lFdaeEq24qdp858Yc1ctuRjv9o-gYK5Aqq5yySKi85l2UH5oTr8OM0MuTyaH_3q-c2Fsve3oPmNTa9uhdGkq_mfvFPY15WlUQIWHact_UqIpGBN8e7M82v-FZdjeFnsP3nuM_BSO6OQJEk7LRN4YoSDoLCu1XPuDWG4YPY03NAsz6wMWDslAcuY2nEuoKl1n3Xocog7zhAhZL83BXsoHHTXxy7Hrs3eUL0"
              />
            </div>
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <BrainCircuit />
              <h3 className="text-2xl font-bold text-on-surface mb-2">Lead Capture Genius</h3>
              <p className="text-on-surface-variant max-w-md">
                Our neural engine qualifies every visitor using semantic analysis. We don't just capture emails; we
                capture intent and readiness.
              </p>
            </div>
            <div className="mt-8">
              <div className="flex gap-4 items-center">
                <div className="h-[1px] flex-grow bg-outline-variant"></div>
                <span className="text-[10px] tracking-widest uppercase font-bold text-primary">
                  Live Qualifiers: 1,248
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="md:col-span-4 glass-panel rounded-xl p-8 border-l-4 border-secondary flex flex-col justify-between group">
          <div>
            <Radar />
            <h3 className="text-xl font-bold text-on-surface mb-2">Midnight Prospector</h3>
            <p className="text-on-surface-variant text-sm">
              While you sleep, Graft hunts. Automated outreach that sounds human because it's trained on your unique
              brand voice.
            </p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-lg mt-4 border border-outline-variant/20">
            <div className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-2">Active Hunt Log</div>
            <div className="space-y-1 opacity-60">
              <div className="text-[9px] font-mono">Found prospect @TechCorp</div>
              <div className="text-[9px] font-mono">Sent tailored brief...</div>
            </div>
          </div>
        </div>
        <div className="md:col-span-4 glass-panel rounded-xl p-8 border-r-4 border-primary flex flex-col justify-between">
          <div>
            <IdCard />
            <h3 className="text-xl font-bold text-on-surface mb-2">White-Label Wonder</h3>
            <p className="text-on-surface-variant text-sm">
              Resell our infrastructure under your own banner. Full CSS control and API-first architecture.
            </p>
          </div>
          <div className="mt-6 flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-[10px] font-bold">
              A
            </div>
            <div className="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/50 flex items-center justify-center text-[10px] font-bold">
              B
            </div>
            <div className="w-8 h-8 rounded-full bg-tertiary/20 border border-tertiary/50 flex items-center justify-center text-[10px] font-bold">
              C
            </div>
          </div>
        </div>
        <div className="md:col-span-8 glass-panel rounded-xl p-8 relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-on-surface mb-6 uppercase tracking-widest">Built for Resilience</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <div className="text-4xl font-black text-on-surface">100%</div>
                <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">
                  Stateless Arch
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-black text-on-surface">99.99</div>
                <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Uptime %</div>
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-black text-on-surface">Global</div>
                <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Node Mesh</div>
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-black text-on-surface">Encrypted</div>
                <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">End-to-End</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
