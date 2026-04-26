import { ArrowRight, Bot, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui-v2/button";
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { getPlatformClientId, resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";

function getConversationSummary(messages: unknown): string {
  if (!Array.isArray(messages)) return "No messages";

  const textMessages = messages
    .map((m) => {
      const message = m as { parts?: { type: string; text: string }[] };
      if (!message.parts || !Array.isArray(message.parts)) return "";
      return message.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join(" ")
        .trim();
    })
    .filter((text: string) => text.length > 0);

  // Use the last assistant message and last user message for summary if available
  const lastMessages = textMessages.slice(-2);
  if (lastMessages.length === 0) return "No conversation content";

  return lastMessages.join(" → ");
}

export default async function PortalDashboardPage() {
  await requireAuthOrSignIn();

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirectToAccessRequired();

  const platformId = await getPlatformClientId();
  if (platformId && clientId === platformId) {
    redirect("/dashboard/automation");
  }

  const [client, leads, bookedCount, conversationCount, recentConversations, agentConfig] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      select: { businessName: true },
    }),
    prisma.lead.findMany({
      where: { clientId, source: "INBOUND" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        customerName: true,
        email: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.lead.count({
      where: { clientId, status: "BOOKED" },
    }),
    prisma.conversation.count({
      where: { clientId },
    }),
    prisma.conversation.findMany({
      where: { clientId },
      orderBy: { updatedAt: "desc" },
      take: 3,
      include: {
        lead: {
          select: {
            customerName: true,
            email: true,
          },
        },
      },
    }),
    prisma.agentConfig.findUnique({
      where: { clientId },
      select: { agentName: true },
    }),
  ]);

  const botName = agentConfig?.agentName || "GraftBot";

  const businessName = client?.businessName || "Your";

  return (
    <div className="w-full max-w-6xl space-y-8 mx-auto p-8">
      <div className="flex flex-col gap-2">
        <Typography.H1>{businessName === "" ? businessName : "Your White label"} workspace</Typography.H1>
        <Typography.Lead>A snapshot of your bot's recent conversations and bookings.</Typography.Lead>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-primary">
          <CardHeader className="pb-2">
            <Typography.Small className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Bookings
            </Typography.Small>
          </CardHeader>
          <CardContent>
            <Typography.H2 className="text-4xl font-black">{bookedCount ?? 0}</Typography.H2>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-secondary">
          <CardHeader className="pb-2">
            <Typography.Small className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Conversations
            </Typography.Small>
          </CardHeader>
          <CardContent>
            <Typography.H2 className="text-4xl font-black">{conversationCount ?? 0}</Typography.H2>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-accent">
          <CardHeader className="pb-2">
            <Typography.Small className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Total Leads
            </Typography.Small>
          </CardHeader>
          <CardContent>
            <Typography.H2 className="text-4xl font-black">{leads?.length ?? 0}</Typography.H2>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardHeader className="pb-2">
            <Typography.Small className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Active Status
            </Typography.Small>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500 shadow-neon animate-pulse" />
            <span className="font-bold">Live</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/portal/conversations" className="flex items-center gap-1">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <Typography.P className="text-muted-foreground">
                No conversations yet. Once your bot is live on your site, transcripts will appear here.
              </Typography.P>
              <Button asChild variant="outline">
                <Link href="/portal/embed" className="flex items-center gap-2">
                  Get embed code
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-outline-ghost/10">
              {recentConversations.map((convo) => (
                <Link
                  key={convo.id}
                  href={`/portal/conversations/${convo.id}`}
                  className="py-4 flex flex-col gap-2 hover:bg-muted/30 px-4 -mx-4 transition-colors rounded-lg group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold group-hover:text-primary transition-colors text-sm text-primary-kinetic">
                        {convo.lead?.customerName || "Anonymous Visitor"}
                      </span>
                      <Badge variant="default" className="gap-1.5">
                        <Bot className="h-3 w-3" />
                        {botName}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(convo.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed">
                    "{getConversationSummary(convo.messages)}"
                  </p>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground font-data uppercase tracking-widest">
                      {convo.lead?.email || "No email captured"}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                      View Transcript <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
