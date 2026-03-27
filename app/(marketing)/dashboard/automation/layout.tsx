import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import type { ReactNode } from "react";
import { getPlatformClientId, isPlatformAdmin, resolveClientIdFromAuth } from "@/lib/auth/resolve-client";

interface AutomationLayoutProps {
  children: ReactNode;
}

export default async function AutomationLayout({ children }: AutomationLayoutProps) {
  const { redirectToSignIn } = await auth();
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) return redirectToSignIn();

  const isAdmin = await isPlatformAdmin();
  if (isAdmin) return <>{children}</>;

  const platformId = await getPlatformClientId();
  if (!platformId || clientId !== platformId) redirect("/portal");

  return <>{children}</>;
}
