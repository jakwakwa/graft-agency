import { Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

export function EmptyQueue() {
  return (
    <div className="w-full max-w-6xl mx-auto p-8 flex flex-col items-center justify-center min-h-[60dvh] text-center space-y-6">
      <div className="p-1.5 rounded-[2.5rem]  bg-slate-400 sm:bg-transparent ring-1 ring-white/10 dark:ring-white/10 shadow-neon">
        <div className="w-16 h-16 rounded-[calc(2.5rem-0.375rem)] bg-card/50 flex items-center justify-center border border-white/5">
          <HugeiconsIcon icon={Tick01Icon} className="h-8 w-8 text-primary animate-pulse" />
        </div>
      </div>
      <div className="space-y-2 max-w-md">
        <Typography.H3 className="text-xl font-bold text-foreground mt-0">Queue Fully Audited</Typography.H3>
        <Typography.P className="text-xs text-muted-foreground leading-relaxed">
          Excellent! There are no pending outreach drafts left to review. You are completely caught up.
        </Typography.P>
      </div>
      <Link href="/dashboard/automation/queue">
        <Button variant="outline" size="lg" className="rounded-full font-bold px-6 py-2.5">
          Manage Prospect Queue
        </Button>
      </Link>
    </div>
  );
}
