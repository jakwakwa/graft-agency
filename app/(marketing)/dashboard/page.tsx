import { redirect } from "next/navigation";
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { getPlatformClientId, isPlatformAdmin, resolveClientIdFromAuth } from "@/lib/auth/resolve-client";

export default async function DashboardPage() {
  await requireAuthOrSignIn();

  if (await isPlatformAdmin()) redirect("/dashboard/automation");

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirectToAccessRequired();

  const platformId = await getPlatformClientId();
  if (platformId && clientId === platformId) redirect("/dashboard/automation");

  redirect("/portal");
}
