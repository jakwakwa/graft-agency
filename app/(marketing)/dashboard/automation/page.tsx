import { auth } from "@clerk/nextjs/server";
import { Cpu, Layers } from "lucide-react";
import Link from "next/link";
import { AutomationWrapper } from "@/components/layout/automation-wrapper";
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { AutomationHubClient } from "./_components/automation-hub-client";

export default async function AutomationHubPage() {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();
  return (
    <DashboardWrapper>
      <AutomationWrapper>
        <MarketingShell>
          <div className="w-full max-w-6xl space-y-12 mx-auto p-8">
            {/* Progress Indicator (Stylistic Example) */}
            <div className="mb-12">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-primary font-bold shadow-neon-primary">
                    1
                  </div>
                  <span className="text-[10px] font-data uppercase tracking-widest text-primary">Agent Persona</span>
                </div>
                <div className="flex-1 h-[2px] bg-primary mx-4" />
                <div className="flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-primary font-bold shadow-neon-primary">
                    2
                  </div>
                  <span className="text-[10px] font-data uppercase tracking-widest text-primary">Knowledge Base</span>
                </div>
                <div className="flex-1 h-[2px] bg-outline-ghost mx-4" />
                <div className="flex flex-col items-center gap-2 group cursor-pointer opacity-50">
                  <div className="w-10 h-10 rounded-full border-2 border-outline-ghost flex items-center justify-center text-muted-foreground font-bold">
                    3
                  </div>
                  <span className="text-[10px] font-data uppercase tracking-widest text-muted-foreground">
                    Integration
                  </span>
                </div>
                <div className="flex-1 h-[2px] bg-outline-ghost mx-4" />
                <div className="flex flex-col items-center gap-2 group cursor-pointer opacity-50">
                  <div className="w-10 h-10 rounded-full border-2 border-outline-ghost flex items-center justify-center text-muted-foreground font-bold">
                    4
                  </div>
                  <span className="text-[10px] font-data uppercase tracking-widest text-muted-foreground">
                    Deployment
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-l-4 border-primary">
                <CardHeader className="p-0 pb-1">
                  <Typography.Small className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Leads Orchestrated
                  </Typography.Small>
                </CardHeader>
                <CardContent className="p-0 flex items-baseline gap-2">
                  <Typography.H2 className="text-4xl font-black neon-glow pb-0">2,842</Typography.H2>
                  <span className="text-xs text-primary font-bold font-data">+12%</span>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-secondary">
                <CardHeader className="p-0 pb-1">
                  <Typography.Small className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Active Conversations
                  </Typography.Small>
                </CardHeader>
                <CardContent className="p-0 flex items-baseline gap-2">
                  <Typography.H2 className="text-4xl font-black pb-0">148</Typography.H2>
                  <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse ml-2 shadow-neon" />
                </CardContent>
              </Card>
              <Card className="border-l-4 border-accent">
                <CardHeader className="p-0 pb-1">
                  <Typography.Small className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Conversion Velocity
                  </Typography.Small>
                </CardHeader>
                <CardContent className="p-0 flex items-baseline gap-2">
                  <Typography.H2 className="text-4xl font-black pb-0">98.4%</Typography.H2>
                  <span className="text-[10px] text-accent font-data uppercase tracking-tighter">Elite Level</span>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-12 gap-8 xl:items-stretch">
              <div className="col-span-12 min-w-0 space-y-8 xl:col-span-8">
                <AutomationHubClient />
              </div>

              <div className="col-span-12 flex min-h-0 flex-col gap-6 xl:col-span-4">
                <div className="grid gap-4">
                  <Link href="/dashboard/automation/queue">
                    <Card className="hover:bg-muted/30 transition-colors cursor-pointer group">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                          Prospect Queue
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Typography.P className="text-sm text-muted-foreground">
                          Add prospects via CSV or single row. Edit, delete, or process the queue manually.
                        </Typography.P>
                        <Button variant="outline" size="sm" className="mt-4 w-full">
                          Open Queue
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/dashboard/automation/leads">
                    <Card className="hover:bg-muted/30 transition-colors cursor-pointer group">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
                          Draft Leads
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Typography.P className="text-sm text-muted-foreground">
                          Review and approve draft outreach before dispatch.
                        </Typography.P>
                        <Button variant="outline" size="sm" className="mt-4 w-full">
                          View Leads
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b border-outline-ghost/10 py-4">
                    <Typography.H4 className="mb-0 text-xs text-primary">High-Speed Log</Typography.H4>
                    <span className="flex items-center gap-2 text-[10px] font-data font-bold text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Live Engine
                    </span>
                  </CardHeader>
                  <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6 font-data">
                    <div className="flex gap-3 text-[11px] border-l-2 border-primary/40 pl-3 py-1">
                      <span className="text-muted-foreground whitespace-nowrap">14:02:11</span>
                      <span className="text-primary font-bold">SYSTEM:</span>
                      <span className="text-foreground/80">
                        Agent scraping LinkedIn for high-intent 'FinTech' leads...
                      </span>
                    </div>
                    <div className="flex gap-3 text-[11px] border-l-2 border-secondary/40 pl-3 py-1">
                      <span className="text-muted-foreground whitespace-nowrap">14:03:45</span>
                      <span className="text-secondary font-bold">LEAD:</span>
                      <span className="text-foreground/80">Lead captured: John Doe (CTO, Velocity Systems)</span>
                    </div>
                    <div className="flex gap-3 text-[11px] border-l-2 border-primary/40 pl-3 py-1">
                      <span className="text-muted-foreground whitespace-nowrap">14:10:01</span>
                      <span className="text-green-400 font-bold">SUCCESS:</span>
                      <span className="text-foreground font-bold">Meeting booked for Friday (10:00 AM)</span>
                    </div>
                  </CardContent>
                  <div className="shrink-0 border-t border-outline-ghost/10 bg-muted/20 p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="w-[65%] h-full bg-primary shadow-neon" />
                      </div>
                      <span className="text-[10px] font-data font-bold text-muted-foreground">Memory Load: 65%</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </MarketingShell>
      </AutomationWrapper>
    </DashboardWrapper>
  );
}
