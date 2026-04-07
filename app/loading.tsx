import { Typography } from "@/components/ui/typography";

export default function Loading() {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
      <div className="h-1 w-64 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-full origin-left animate-progress bg-primary shadow-neon" />
      </div>
      <Typography.Small className="font-data uppercase tracking-widest text-muted-foreground animate-pulse">
        Synchronizing Agent Data...
      </Typography.Small>
    </div>
  );
}
