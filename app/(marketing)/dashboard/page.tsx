import { redirect } from "next/navigation";
import { getPlatformClientId, isPlatformAdmin, resolveClientIdFromAuth } from "@/lib/auth/resolve-client";

export default async function DashboardPage() {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirect("/sign-in");

  const isAdmin = await isPlatformAdmin();
  if (isAdmin) redirect("/dashboard/automation");

  const platformId = await getPlatformClientId();
  if (platformId && clientId === platformId) redirect("/dashboard/automation");

  redirect("/portal");
}
