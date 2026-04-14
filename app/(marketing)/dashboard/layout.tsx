import { auth } from "@clerk/nextjs/server";
import type { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();
  return (
    <section className="flex min-h-[calc(100dvh-4rem)] w-full flex-col items-center bg-background px-4 py-8 md:px-8 md:py-10">
      {children}
    </section>
  );
}
