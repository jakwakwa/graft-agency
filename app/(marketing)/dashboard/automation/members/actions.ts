"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { resolvePlatformOrganizationForClient } from "@/lib/auth/platform-organization";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";

/**
 * Invites a new member to the agency organization. Gated on platform access.
 */
export async function inviteMemberAction(formData: FormData) {
  const { userId } = await auth();
  const access = await requirePlatformAccess();

  if ("error" in access) {
    throw new Error(access.error);
  }

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const platformOrganization = await resolvePlatformOrganizationForClient(access.clientId);
  if ("error" in platformOrganization) {
    throw new Error(platformOrganization.error);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }

  const email = formData.get("email") as string;
  if (!email) throw new Error("Email is required");

  const clerk = await clerkClient();

  await clerk.organizations.createOrganizationInvitation({
    organizationId: platformOrganization.organizationId,
    inviterUserId: userId,
    emailAddress: email,
    role: "org:member",
    redirectUrl: `${appUrl}/dashboard`,
  });

  revalidatePath("/dashboard/automation/members");
  return { success: true };
}

/**
 * Revokes a pending invitation.
 */
export async function revokeInvitationAction(invitationId: string) {
  const access = await requirePlatformAccess();
  if ("error" in access) throw new Error(access.error);

  const platformOrganization = await resolvePlatformOrganizationForClient(access.clientId);
  if ("error" in platformOrganization) throw new Error(platformOrganization.error);

  const clerk = await clerkClient();
  await clerk.organizations.revokeOrganizationInvitation({
    organizationId: platformOrganization.organizationId,
    invitationId,
  });

  revalidatePath("/dashboard/automation/members");
  return { success: true };
}

/**
 * Removes a member from the organization.
 * Note: The Clerk webhook will handle the soft-delete of the Client row.
 */
export async function removeMemberAction(userId: string) {
  const access = await requirePlatformAccess();
  if ("error" in access) throw new Error(access.error);

  const platformOrganization = await resolvePlatformOrganizationForClient(access.clientId);
  if ("error" in platformOrganization) throw new Error(platformOrganization.error);

  const clerk = await clerkClient();
  await clerk.organizations.deleteOrganizationMembership({
    organizationId: platformOrganization.organizationId,
    userId,
  });

  revalidatePath("/dashboard/automation/members");
  return { success: true };
}
