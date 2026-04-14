import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { hasPlatformAccess, resolveClientIdFromAuth } from "@/lib/auth/resolve-client";

interface AutomationLayoutProps {
  children: ReactNode;
}

export default async function AutomationLayout({ children }: AutomationLayoutProps) {
  await requireAuthOrSignIn();

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirectToAccessRequired();

  if (!(await hasPlatformAccess())) redirect("/portal");

  return <>{children}</>;
}
