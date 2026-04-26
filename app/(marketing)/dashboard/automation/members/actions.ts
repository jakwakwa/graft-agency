"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";

const AGENCY_CLERK_ORG_ID = process.env.AGENCY_CLERK_ORG_ID || process.env.PLATFORM_CLERK_ORG_ID;

/**
 * Invites a new member to the agency organization. Gated on platform access.
 */
export async function inviteMemberAction(formData: FormData) {
  const { userId } = await auth();
  const access = await requirePlatformAccess();

  if ("error" in access) {
    throw new Error(access.error);
  }

  if (!AGENCY_CLERK_ORG_ID) {
    throw new Error("AGENCY_CLERK_ORG_ID is not configured");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }

  const email = formData.get("email") as string;
  if (!email) throw new Error("Email is required");

  const clerk = await clerkClient();

  await clerk.organizations.createOrganizationInvitation({
    organizationId: AGENCY_CLERK_ORG_ID,
    inviterUserId: userId!,
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

  if (!AGENCY_CLERK_ORG_ID) throw new Error("AGENCY_CLERK_ORG_ID is not configured");

  const clerk = await clerkClient();
  await clerk.organizations.revokeOrganizationInvitation({
    organizationId: AGENCY_CLERK_ORG_ID,
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

  if (!AGENCY_CLERK_ORG_ID) throw new Error("AGENCY_CLERK_ORG_ID is not configured");

  const clerk = await clerkClient();
  await clerk.organizations.deleteOrganizationMembership({
    organizationId: AGENCY_CLERK_ORG_ID,
    userId,
  });

  revalidatePath("/dashboard/automation/members");
  return { success: true };
}
