import { auth } from "@clerk/nextjs/server";
import type { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();
  return <section className="min-h-screen flex flex-col items-center justify-center p-18">{children}</section>;
}
