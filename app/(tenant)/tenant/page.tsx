import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Typography } from "@/components/ui/typography";
import { getPlatformClientId, resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";

export default async function TenantDashboardPage() {
  const { redirectToSignIn } = await auth();
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) return redirectToSignIn();

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
      <Typography.Lead className="mt-2">View your inbound leads and conversion metrics.</Typography.Lead>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <Typography.H4>Bookings</Typography.H4>
          <Typography.Large className="mt-2">{bookedCount}</Typography.Large>
          <Typography.Muted className="mt-1">Total appointments booked</Typography.Muted>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <Typography.H4>Recent Leads</Typography.H4>
          <Typography.Large className="mt-2">{leads.length}</Typography.Large>
          <Typography.Muted className="mt-1">Latest inbound leads</Typography.Muted>
        </div>
      </div>

      <div className="mt-8">
        <Typography.H3>Recent Leads</Typography.H3>
        {leads.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border p-8 text-center">
            <Typography.P className="text-muted-foreground">
              No leads yet. Embed the widget on your website to start capturing leads.
            </Typography.P>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Email</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border last:border-0">
                    <td className="p-3">{lead.customerName ?? "—"}</td>
                    <td className="p-3">{lead.email ?? "—"}</td>
                    <td className="p-3">{lead.status}</td>
                    <td className="p-3 text-muted-foreground">{lead.createdAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
