import { redirect } from "next/navigation";
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { hasPlatformAccess, resolveClientIdFromAuth } from "@/lib/auth/resolve-client";

export default async function DashboardPage() {
  await requireAuthOrSignIn();

  if (await hasPlatformAccess()) redirect("/dashboard/automation");

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirectToAccessRequired();

  redirect("/portal");
}
