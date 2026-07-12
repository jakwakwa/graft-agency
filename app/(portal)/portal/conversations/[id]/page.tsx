import type { UIMessage } from "ai";
import { ArrowLeft, Calendar, Hash, Mail, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui-v2/button";
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import { conversationService } from "@/lib/services/conversation.service";
import { ConversationViewer } from "../_components/conversation-viewer";

interface ConversationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationDetailPage({ params }: ConversationDetailPageProps) {
  await requireAuthOrSignIn();

  const { id } = await params;
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirectToAccessRequired();

  const conversation = await conversationService.getById(id, clientId);

  if (!conversation) {
    notFound();
  }

  const messages = conversation.messages as unknown as UIMessage[];

  return (
    <div className="w-full max-w-6xl space-y-8 mx-auto p-8 z-0">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/portal/conversations" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col gap-2">
            <Typography.H1>Transcript</Typography.H1>
            <Typography.Lead>
              Conversation with {conversation.lead?.customerName || "Anonymous Visitor"}
            </Typography.Lead>
          </div>

          <Card className="min-h-[600px] flex flex-col">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                Session: {conversation.sessionId}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
              <ConversationViewer messages={messages} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</span>
                  <span className="font-medium">{conversation.lead?.customerName || "Anonymous"}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</span>
                  <span className="font-medium">{conversation.lead?.email || "Not provided"}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Started</span>
                  <span className="font-medium">{new Date(conversation.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {conversation.leadId && (
                <div className="pt-4 mt-4 border-t">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/portal/leads/${conversation.leadId}`}>View Full Lead Profile</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Messages:</span>
                <span className="font-medium">{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Update:</span>
                <span className="font-medium">{new Date(conversation.updatedAt).toLocaleTimeString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
