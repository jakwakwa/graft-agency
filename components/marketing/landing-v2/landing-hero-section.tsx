import { Zap } from "lucide-react";
import Image from "next/image";

export function LandingHeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-10 overflow-hidden">
      <div className="absolute inset-0 mesh-bg-hero pointer-events-none"></div>
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-highest border border-outline-variant/30 text-[10px] tracking-[0.2em] uppercase font-bold text-primary">
            <Zap />
            Hyper-Performance AI Engine
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tighter leading-[0.9] text-on-surface">
            THE RECEPTIONIST <br /> THAT{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">
              NEVER SLEEPS.
            </span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-lg leading-relaxed">
            While your competitors close for the night, GRAFT continues to capture leads, qualify prospects, and scale
            your brand with zero-latency precision.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              className="px-8 py-4 bg-primary text-on-primary-container font-bold rounded-lg text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-primary/20"
            >
              Initialize Graft
            </button>
            <button
              type="button"
              className="px-8 py-4 bg-surface-container-highest text-on-surface font-bold rounded-lg text-sm uppercase tracking-widest border border-outline-variant hover:bg-surface-variant transition-colors"
            >
              View Schematics
            </button>
          </div>
          <div className="flex gap-8 pt-6">
            <div>
              <div className="text-3xl font-black text-on-surface">0ms</div>
              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Latency</div>
            </div>
            <div>
              <div className="text-3xl font-black text-on-surface">99.9%</div>
              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Reliance</div>
            </div>
            <div>
              <div className="text-3xl font-black text-on-surface">24/7</div>
              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Up-Time</div>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-10 bg-primary/10 blur-[100px] rounded-full"></div>
          <div className="relative glass-panel rounded-full p-4 overflow-hidden border-2 border-primary/20">
            <Image
              alt="3D Cybernetic Sentinel"
              className="w-full aspect-square object-cover rounded-full mix-blend-lighten grayscale-20 hover:grayscale-0 transition-all duration-700"
              data-alt="Close-up of a high-fidelity metallic 3D robot head with intricate wiring, glowing pink internal lights, and polished chrome surface against deep black background"
              height={900}
              sizes="(max-width: 1024px) 100vw, 50vw"
              src={`/friendly-agent.jpeg`}
              width={900}
            />
          </div>
          <div className="absolute -top-10 -right-10 glass-panel p-4 rounded-xl text-[10px] font-mono text-chart-4/80 border-l-2 border-secondary space-y-1">
            <div>[SYSTEM]: INITIALIZING...</div>
            <div>[LINK]: SECURE_AES256</div>
            <div>[STATUS]: ACTIVE_SENTRY</div>
          </div>
        </div>
      </div>
    </section>
  );
}
