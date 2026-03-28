import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { getPlatformClientId, isPlatformAdmin, resolveClientIdFromAuth } from "@/lib/auth/resolve-client";

interface AutomationLayoutProps {
  children: ReactNode;
}

export default async function AutomationLayout({ children }: AutomationLayoutProps) {
  await requireAuthOrSignIn();

  if (await isPlatformAdmin()) {
    return <>{children}</>;
  }

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) {
    redirectToAccessRequired();
  }

  const platformId = await getPlatformClientId();
  if (!platformId || clientId !== platformId) redirect("/portal");

  return <>{children}</>;
}
