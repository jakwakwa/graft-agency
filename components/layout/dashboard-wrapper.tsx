import { auth } from "@clerk/nextjs/server";
import type { ReactNode } from "react";

interface DashboardWrapperProps {
  children: ReactNode;
}

export async function DashboardWrapper({ children }: DashboardWrapperProps) {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();

  return <section className="">{children}</section>;
}
