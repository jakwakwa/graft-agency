import { redirect } from "next/navigation";
import { getPlatformClientId, isPlatformAdmin, resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import type { ReactNode } from "react";

interface AutomationLayoutProps {
  children: ReactNode;
}

export default async function AutomationLayout({ children }: AutomationLayoutProps) {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirect("/sign-in");

  const isAdmin = await isPlatformAdmin();
  if (isAdmin) return <>{children}</>;

  const platformId = await getPlatformClientId();
  if (!platformId || clientId !== platformId) redirect("/portal");

  return <>{children}</>;
}
