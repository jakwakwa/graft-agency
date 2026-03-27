import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getPlatformClientId, isPlatformAdmin, resolveClientIdFromAuth } from "@/lib/auth/resolve-client";

export default async function DashboardPage() {
  const { redirectToSignIn } = await auth();
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) return redirectToSignIn();

  const isAdmin = await isPlatformAdmin();
  if (isAdmin) redirect("/dashboard/automation");

  const platformId = await getPlatformClientId();
  if (platformId && clientId === platformId) redirect("/dashboard/automation");

  redirect("/portal");
}
