export function LandingCtaSection() {
  return (
    <section className="py-32 px-10 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
        <h2 className="text-5xl md:text-6xl font-headline font-black tracking-tighter text-on-surface leading-none">
          STOP MISSING <span className="text-primary italic">OPPORTUNITIES.</span>
        </h2>
        <p className="text-on-surface-variant text-xl max-w-2xl mx-auto">
          Join the 500+ elite agencies leveraging GRAFT to maintain a 24/7 technical presence.
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-6">
          <input
            className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface px-6 py-4 rounded-lg w-full md:w-80 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none tracking-widest text-xs font-bold transition-all"
            placeholder="ENTER YOUR DOMAIN"
            type="email"
          />
          <button
            type="button"
            className="w-full md:w-auto px-10 py-4 bg-primary text-on-primary-container font-black rounded-lg uppercase tracking-[0.2em] hover:scale-105 transition-transform shadow-2xl shadow-primary/40"
          >
            Initialize Deployment
          </button>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold opacity-60">
          No credit card required. 14-day free trial.
        </div>
      </div>
    </section>
  );
}
