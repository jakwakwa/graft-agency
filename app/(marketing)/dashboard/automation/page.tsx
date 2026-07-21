import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, CpuIcon, Layers01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { AutomationWrapper } from "@/components/layout/automation-wrapper";
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import { AutomationHubClient } from "./_components/automation-hub-client";

export default async function AutomationHubPage() {
  const access = await requirePlatformAccess();
  if ("error" in access) {
    return (
      <DashboardWrapper>
        <AutomationWrapper>
          <MarketingShell>
            <div className="w-full max-w-6xl p-8 mx-auto flex flex-col items-center justify-center min-h-[50dvh]">
              <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 max-w-md text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto">
                  <HugeiconsIcon icon={Alert01Icon} className="h-6 w-6 text-destructive" />
                </div>
                <Typography.H3 className="mt-0 text-foreground">Access Denied</Typography.H3>
                <Typography.P className="text-sm text-muted-foreground leading-relaxed">{access.error}</Typography.P>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full mt-2">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </MarketingShell>
        </AutomationWrapper>
      </DashboardWrapper>
    );
  }

  const clientId = access.clientId;

  // 1. Fetch dynamic metrics
  const leadsCount = await prisma.lead.count({ where: { clientId } });

  const activeConversationsCount = await prisma.conversation.count({
    where: { clientId },
  });

  const conversionCount = await prisma.lead.count({
    where: { clientId, status: { in: ["BOOKED", "CLOSED"] } },
  });

  const conversionVelocity = leadsCount > 0 ? ((conversionCount / leadsCount) * 100).toFixed(1) : "0.0";

  // 2. Fetch Agent & Prospecting configuration to compute real setup steps
  const agentConfig = await prisma.agentConfig.findUnique({
    where: { clientId },
  });

  const prospectingConfig = await prisma.prospectingConfig.findUnique({
    where: { clientId },
  });

  const isPersonaConfigured = !!agentConfig?.systemPrompt;
  const isKnowledgeBaseConfigured = !!agentConfig?.knowledgeBase;
  const isIntegrationConfigured = !!(agentConfig?.calComUsername || agentConfig?.defaultEventSlug);
  const isDeployed = !!prospectingConfig?.cronEnabled;

  // 3. Fetch real operational event logs
  const logs = await prisma.operationalEvent.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  // Calculate dynamic stepper state classes
  const getStepStatus = (stepIndex: number) => {
    switch (stepIndex) {
      case 1:
        return isPersonaConfigured ? "completed" : "active";
      case 2:
        if (isKnowledgeBaseConfigured) return "completed";
        return isPersonaConfigured ? "active" : "pending";
      case 3:
        if (isIntegrationConfigured) return "completed";
        return isKnowledgeBaseConfigured ? "active" : "pending";
      case 4:
        if (isDeployed) return "completed";
        return isIntegrationConfigured ? "active" : "pending";
      default:
        return "pending";
    }
  };

  const renderStepIcon = (stepIndex: number, label: string) => {
    const status = getStepStatus(stepIndex);
    if (status === "completed") {
      return (
        <div className="flex flex-col items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-primary font-bold shadow-neon-primary transition-all duration-300">
            ✓
          </div>
          <span className="text-[10px] font-data capitalize tracking-widest text-primary font-bold">{label}</span>
        </div>
      );
    }
    if (status === "active") {
      return (
        <div className="flex flex-col items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 rounded-full border-2 border-primary bg-background flex items-center justify-center text-primary font-bold animate-pulse shadow-neon transition-all duration-300">
            {stepIndex}
          </div>
          <span className="text-[10px] font-data capitalize tracking-widest text-primary font-medium">{label}</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-2 group cursor-not-allowed opacity-40">
        <div className="w-10 h-10 rounded-full border-2 border-outline-ghost flex items-center justify-center text-muted-foreground font-medium">
          {stepIndex}
        </div>
        <span className="text-[10px] font-data capitalize tracking-widest text-muted-foreground">{label}</span>
      </div>
    );
  };

  return (
    <DashboardWrapper>
      <AutomationWrapper>
        <MarketingShell>
          <div className="w-full max-w-6xl space-y-12 mx-auto p-8">
            {/* Dynamic Progress Indicator */}
            <div className="mb-12">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                {renderStepIcon(1, "Agent Persona")}
                <div
                  className={`flex-1 h-[2px] mx-4 transition-colors duration-500 ${isPersonaConfigured ? "bg-primary" : "bg-outline-ghost"}`}
                />
                {renderStepIcon(2, "Knowledge Base")}
                <div
                  className={`flex-1 h-[2px] mx-4 transition-colors duration-500 ${isKnowledgeBaseConfigured ? "bg-primary" : "bg-outline-ghost"}`}
                />
                {renderStepIcon(3, "Integration")}
                <div
                  className={`flex-1 h-[2px] mx-4 transition-colors duration-500 ${isIntegrationConfigured ? "bg-primary" : "bg-outline-ghost"}`}
                />
                {renderStepIcon(4, "Deployment")}
              </div>
            </div>

            {/* Dynamic Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-l-4 border-primary bg-card/40 backdrop-blur-md">
                <CardHeader className="p-4 pb-1">
                  <Typography.Small className="text-[10px] capitalize tracking-widest text-muted-foreground">
                    Leads Orchestrated
                  </Typography.Small>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex items-baseline gap-2">
                  <Typography.H2 className="text-4xl font-bold pb-0">{leadsCount.toLocaleString()}</Typography.H2>
                  <span className="text-xs text-primary font-bold font-data">Total</span>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-secondary bg-card/40 backdrop-blur-md">
                <CardHeader className="p-4 pb-1">
                  <Typography.Small className="text-[10px] capitalize tracking-widest text-muted-foreground">
                    Active Conversations
                  </Typography.Small>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex items-baseline gap-2">
                  <Typography.H2 className="text-4xl font-bold pb-0">
                    {activeConversationsCount.toLocaleString()}
                  </Typography.H2>
                  {activeConversationsCount > 0 && (
                    <span className="inline-block w-2 h-2 bg-secondary rounded-full animate-pulse ml-2 shadow-neon-secondary" />
                  )}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-accent bg-card/40 backdrop-blur-md">
                <CardHeader className="p-4 pb-1">
                  <Typography.Small className="text-[10px] capitalize tracking-widest text-muted-foreground">
                    Conversion Rate
                  </Typography.Small>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex items-baseline gap-2">
                  <Typography.H2 className="text-4xl font-bold pb-0">{conversionVelocity}%</Typography.H2>
                  <span className="text-[10px] text-accent font-data capitalize tracking-tighter">
                    {Number(conversionVelocity) > 80 ? "Elite Level" : "Standard"}
                  </span>
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
                    <Card className="hover:bg-muted/30 transition-all duration-300 cursor-pointer group hover:border-primary/40">
                      <CardHeader className="p-6">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <HugeiconsIcon icon={Layers01Icon} className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-300" />
                          Prospect Queue
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 pt-0">
                        <Typography.P className="text-xs text-muted-foreground leading-relaxed">
                          Add prospects via CSV or single row. Edit, delete, or process the queue manually.
                        </Typography.P>
                        <Button variant="outline" size="sm" className="mt-4 w-full text-xs">
                          Open Queue
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/dashboard/automation/leads">
                    <Card className="hover:bg-muted/30 transition-all duration-300 cursor-pointer group hover:border-secondary/40">
                      <CardHeader className="p-6">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <HugeiconsIcon icon={CpuIcon} className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform duration-300" />
                          Draft Leads
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 pt-0">
                        <Typography.P className="text-xs text-muted-foreground leading-relaxed">
                          Review and approve draft outreach before dispatch.
                        </Typography.P>
                        <Button variant="outline" size="sm" className="mt-4 w-full text-xs">
                          View Leads
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b border-outline-ghost/10 py-4 px-6">
                    <Typography.H4 className="mb-0 text-xs text-primary font-bold">Real-time Engine Logs</Typography.H4>
                    <span className="flex items-center gap-1.5 text-[10px] font-data font-bold text-muted-foreground">
                      <span
                        className={`h-2 w-2 rounded-full ${isDeployed ? "bg-green-500 animate-pulse shadow-neon" : "bg-amber-500"}`}
                      />
                      {isDeployed ? "Live Engine" : "Engine Idle"}
                    </span>
                  </CardHeader>
                  <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto p-6 font-data">
                    {logs.length > 0 ? (
                      logs.map((log) => {
                        const timeStr = new Date(log.createdAt).toLocaleTimeString("en-US", {
                          hour12: false,
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        });

                        // Map log status to beautiful classes
                        let statusColorClass = "text-primary border-primary/20";
                        if (log.status === "ERROR" || log.status === "DENIED") {
                          statusColorClass = "text-destructive border-destructive/20";
                        } else if (log.status === "WARNING") {
                          statusColorClass = "text-amber-500 border-amber-500/20";
                        } else if (log.status === "SUCCESS" || log.status === "ALLOWED") {
                          statusColorClass = "text-emerald-500 border-emerald-500/20";
                        }

                        return (
                          <div
                            key={log.id}
                            className={`flex gap-3 text-[11px] border-l-2 pl-3 py-1 transition-all duration-300 ${statusColorClass}`}
                          >
                            <span className="text-muted-foreground whitespace-nowrap">{timeStr}</span>
                            <span className="font-bold capitalize tracking-wider">{log.category}:</span>
                            <span className="text-foreground/80 leading-relaxed break-words">
                              {log.message || log.eventType}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground h-full">
                        <div className="w-10 h-10 rounded-full border border-outline-ghost/10 flex items-center justify-center mb-3 bg-muted/20">
                          <HugeiconsIcon icon={Layers01Icon} className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                        <p className="text-xs font-semibold text-foreground/80">No operational events yet</p>
                        <p className="text-[10px] text-muted-foreground/60 max-w-[200px] mt-1 leading-relaxed">
                          Configure your agent and trigger prospecting to see real-time engine activity.
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <div className="shrink-0 border-t border-outline-ghost/10 bg-muted/20 p-6">
                    <div className="flex items-center justify-between text-[10px] font-data font-bold text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${isDeployed ? "bg-green-500 animate-pulse" : "bg-amber-500"}`}
                        />
                        Automation: {isDeployed ? "Active" : "Paused"}
                      </span>
                      {prospectingConfig?.lastCronRunAt ? (
                        <span>Last run: {new Date(prospectingConfig.lastCronRunAt).toLocaleDateString()}</span>
                      ) : (
                        <span>Last run: Never</span>
                      )}
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
