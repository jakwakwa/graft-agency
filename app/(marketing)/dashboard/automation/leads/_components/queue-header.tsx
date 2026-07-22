interface QueueHeaderProps {
  draftCount: number;
}

export function QueueHeader({ draftCount }: QueueHeaderProps) {
  return (
    <section className="grid grid-cols-12 gap-6">
      <div className="relative col-span-12 flex min-h-[320px] flex-col justify-between overflow-hidden rounded-xl border-l-2 border-chart-3 bg-card p-8 shadow-ambient lg:col-span-8">
        <div className="relative z-10">
          <span className="font-data text-xs font-bold uppercase tracking-[0.2em] text-secondary-foreground">
            Audit Pipeline
          </span>
          <h1 className="mt-2 max-w-2xl font-headline text-5xl font-extrabold leading-none tracking-tighter text-foreground">
            Outreach <span className="text-chart-3">Approval Queue</span>
          </h1>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Review, edit, and approve auto-generated outbound email drafts before dispatching. A human-in-the-loop audit
            maintains lead comfort and conversion authenticity.
          </p>
        </div>
        <div className="z-10 mt-8">
          <div className="mb-2 flex items-end justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Approval Action Progress</span>
            <span className="text-lg font-bold text-secondary-foreground">
              {draftCount > 0 ? "Pending Decision" : "Queue Fully Audited"}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-chart-3" style={{ width: draftCount > 0 ? "50%" : "100%" }} />
          </div>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-20">
          <div className="absolute inset-0 bg-linear-to-l from-chart-3/20 to-transparent" />
        </div>
      </div>

      <div className="col-span-12 grid gap-6 lg:col-span-4">
        <div className="flex flex-col justify-center rounded-lg border-l-2 border-secondary/40 bg-muted/60 p-6">
          <span className="font-data text-[10px] uppercase tracking-widest text-muted-foreground">Pending Drafts</span>
          <span className="mt-1 font-headline text-4xl font-bold text-foreground gap-2 flex items-center">
            {draftCount}
            <span className="text-xs text-secondary-foreground/70">Drafts</span>
          </span>
        </div>
        <div className="flex flex-col justify-center rounded-lg border-l-2 border-secondary/40 bg-muted/60 p-6">
          <span className="font-data text-[10px] uppercase tracking-widest text-muted-foreground">
            Approval Protocol
          </span>
          <span className="mt-1 font-headline text-xl font-bold text-foreground">Human-In-The-Loop</span>
          <div className="mt-4 font-data text-[10px] text-chart-1">100% SECURE AUTONOMY</div>
        </div>
      </div>
    </section>
  );
}
