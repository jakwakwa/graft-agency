import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
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

  return (
    <div className="container max-w-4xl py-8">
      <Typography.H1>{client?.businessName ?? "Your"} Dashboard</Typography.H1>
      <Typography.Lead className="mt-2">
        View your inbound leads from your white-labelled Graft Bot and conversion metrics.
      </Typography.Lead>

      <div className="mt-8 flex flex-col gap-4 sm:grid-cols-2">
        <Card>
          <Typography.P>Bookings</Typography.P>
          <Typography.Large className="mt-2">{bookedCount ?? 0}</Typography.Large>
        </Card>
        <Card>
          <Typography.P>Recent Leads</Typography.P>
          <Typography.Large className="mt-2">{leads?.length ?? 0}</Typography.Large>
        </Card>
      </div>
    </div>
  );
}
