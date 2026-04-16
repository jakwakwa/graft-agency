import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";

interface DashboardWrapperProps {
  children: ReactNode;
}

export async function DashboardWrapper({ children }: DashboardWrapperProps) {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();

  return (
    <section className="flex min-h-[calc(100dvh-4rem)] w-full flex-col items-center bg-background px-4 py-8 md:px-8 md:py-10">
      {children}
    </section>
  );
}
