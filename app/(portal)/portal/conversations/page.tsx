import { ArrowRight, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui-v2/button";
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import { getClientEntitlements } from "@/lib/billing/entitlements";
import { conversationService } from "@/lib/services/conversation.service";

export default async function ConversationsPage() {
  await requireAuthOrSignIn();

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirectToAccessRequired();

  const entitlements = await getClientEntitlements(clientId);
  const gated = !entitlements?.hasChatbotAccess;

  const conversations = gated ? [] : await conversationService.listForClient(clientId);

  return (
    <div className="w-full max-w-6xl space-y-8 mx-auto p-8 z-0">
      <div className="flex flex-col gap-2">
        <Typography.H1>Conversations</Typography.H1>
        <Typography.Lead>View all chat transcripts from your embedded bots.</Typography.Lead>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            All Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <Typography.P className="text-muted-foreground">
                {gated
                  ? "Conversations live here — but your workspace isn't subscribed yet. Subscribe to the AI Chatbot to put your bot to work and start capturing transcripts."
                  : "No conversations yet. Once your bot is live on your site, transcripts will appear here."}
              </Typography.P>
              <Button asChild variant={gated ? "default" : "outline"}>
                <Link href={gated ? "/portal/billing" : "/portal/embed"} className="flex items-center gap-2">
                  {gated ? "Subscribe" : "Get embed code"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-outline-ghost/10">
              {conversations.map((convo) => (
                <Link
                  key={convo.id}
                  href={`/portal/conversations/${convo.id}`}
                  className="py-4 flex items-center justify-between hover:bg-muted/30 px-4 -mx-4 transition-colors rounded-lg group"
                >
                  <div className="flex flex-col">
                    <span className="font-bold group-hover:text-primary transition-colors">
                      {convo.lead?.customerName || "Anonymous Visitor"}
                    </span>
                    <span className="text-sm text-muted-foreground">{convo.lead?.email || "No email captured"}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(convo.updatedAt).toLocaleDateString()}
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                        Session: {convo.sessionId.slice(0, 8)}...
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
