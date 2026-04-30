import { clerkClient } from "@clerk/nextjs/server";
import { UserMinus, UserX } from "lucide-react";
import { AutomationWrapper } from "@/components/layout/automation-wrapper";
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui-v2/button";
import { resolvePlatformOrganizationForClient } from "@/lib/auth/platform-organization";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import { InviteForm } from "./_components/invite-form";
import { removeMemberAction, revokeInvitationAction } from "./actions";

export default async function MembersAdminPage() {
  const access = await requirePlatformAccess();
  if ("error" in access) {
    return (
      <div className="p-8">
        <Typography.H2>Access Denied</Typography.H2>
        <Typography.P>{access.error}</Typography.P>
      </div>
    );
  }

  const platformOrganization = await resolvePlatformOrganizationForClient(access.clientId);
  if ("error" in platformOrganization) {
    return (
      <div className="p-8">
        <Typography.H2>Configuration Required</Typography.H2>
        <Typography.P>{platformOrganization.error}</Typography.P>
      </div>
    );
  }

  const memberAdminOrganizationId = platformOrganization.organizationId;
  const clerk = await clerkClient();

  // 1. Fetch memberships
  const memberships = await clerk.organizations.getOrganizationMembershipList({
    organizationId: memberAdminOrganizationId,
  });

  // 2. Fetch pending invitations
  const invitations = await clerk.organizations.getOrganizationInvitationList({
    organizationId: memberAdminOrganizationId,
    status: ["pending"],
  });

  // 3. Join memberships with Client table for businessName
  const userIds = memberships.data.map((m) => m.publicUserData?.userId).filter(Boolean) as string[];
  const clients = await prisma.client.findMany({
    where: { clerkUserId: { in: userIds }, deletedAt: null },
    select: { clerkUserId: true, businessName: true, isPlatformOwner: true },
  });

  const clientMap = new Map(clients.map((c) => [c.clerkUserId, c]));

  return (
    <DashboardWrapper>
      <AutomationWrapper>
        <MarketingShell>
          <div className="w-full max-w-6xl space-y-12 mx-auto p-8">
            <div className="flex flex-col gap-2">
              <Typography.H1>Members</Typography.H1>
              <Typography.Lead>Manage agency members and client access.</Typography.Lead>
            </div>

            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 xl:col-span-8 space-y-8">
                {/* Members List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Active Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y divide-outline-ghost/10">
                      {memberships.data.map((membership) => {
                        const userId = membership.publicUserData?.userId;
                        const client = userId ? clientMap.get(userId) : null;
                        const isOwner = client?.isPlatformOwner || membership.role === "org:admin";

                        return (
                          <div key={membership.id} className="py-4 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-bold">
                                {membership.publicUserData?.firstName} {membership.publicUserData?.lastName}
                                {isOwner && (
                                  <span className="ml-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                                    Owner
                                  </span>
                                )}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {membership.publicUserData?.identifier}
                                {client && ` • ${client.businessName}`}
                              </span>
                            </div>
                            {!isOwner && userId && (
                              <form
                                action={async () => {
                                  "use server";
                                  await removeMemberAction(userId);
                                }}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Remove
                                </Button>
                              </form>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Invitations */}
                {invitations.data.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Invitations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y divide-outline-ghost/10">
                        {invitations.data.map((invitation) => (
                          <div key={invitation.id} className="py-4 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-bold">{invitation.emailAddress}</span>
                              <span className="text-xs text-muted-foreground uppercase tracking-widest font-data">
                                Sent {new Date(invitation.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <form
                              action={async () => {
                                "use server";
                                await revokeInvitationAction(invitation.id);
                              }}
                            >
                              <Button variant="ghost" size="sm" className="text-muted-foreground">
                                <UserX className="h-4 w-4 mr-2" />
                                Revoke
                              </Button>
                            </form>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="col-span-12 xl:col-span-4">
                <InviteForm />
              </div>
            </div>
          </div>
        </MarketingShell>
      </AutomationWrapper>
    </DashboardWrapper>
  );
}
