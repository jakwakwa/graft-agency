import { Bot, Inbox, LineChart, Sparkles } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

const features = [
  {
    icon: Inbox,
    title: "Prospect queue",
    description: "Review and prioritise inbound interest in one place—clear status, less spreadsheet chaos.",
  },
  {
    icon: Sparkles,
    title: "Draft leads",
    description: "Turn conversations into structured lead records your team can trust and act on quickly.",
  },
  {
    icon: Bot,
    title: "AI assistant",
    description: "A configurable agent that answers questions, captures details, and hands off smoothly.",
  },
  {
    icon: LineChart,
    title: "Automation visibility",
    description: "See what runs, what’s queued, and where human review is needed—without digging through logs.",
  },
] as const;

export function LandingFeatures() {
  return (
    <section className="border-b border-border bg-muted/30 px-6 py-20 md:py-24" aria-labelledby="features-heading">
      <div className="mx-auto max-w-5xl">
        <Typography.H2 id="features-heading" className="border-0 pb-0 text-center font-serif">
          What you can do with GRAFT
        </Typography.H2>
        <Typography.P className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Everything ties together: your site, your queue, and your AI assistant—so you ship faster with fewer
          hand-offs.
        </Typography.P>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }) => (
            <li key={title}>
              <Card className="h-full transition-colors hover:bg-card/80">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
