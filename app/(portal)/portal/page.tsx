import { ArrowRight, MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui-v2/button";
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { getPlatformClientId, resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";

export default async function PortalDashboardPage() {
  await requireAuthOrSignIn();

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirectToAccessRequired();

  const platformId = await getPlatformClientId();
  if (platformId && clientId === platformId) {
    redirect("/dashboard/automation");
  }

  const [client, leads, bookedCount] = await Promise.all([
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
  ]);

  const businessName = client?.businessName || "Your";

  return (
    <div className="w-full max-w-6xl space-y-8 mx-auto p-8">
      <div className="flex flex-col gap-2">
        <Typography.H1>{businessName}'s workspace</Typography.H1>
        <Typography.Lead>A snapshot of your bot's recent conversations and bookings.</Typography.Lead>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              Total Leads
            </Typography.Small>
          </CardHeader>
          <CardContent>
            <Typography.H2 className="text-4xl font-black">{leads?.length ?? 0}</Typography.H2>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-accent">
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <Typography.P className="text-muted-foreground">
                No conversations yet. Once your bot is live on your site, leads will land here.
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
              {leads.map((lead) => (
                <div key={lead.id} className="py-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold">{lead.customerName || "Anonymous Visitor"}</span>
                    <span className="text-sm text-muted-foreground">{lead.email || "No email captured"}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-data uppercase bg-muted px-2 py-1 rounded">{lead.status}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
