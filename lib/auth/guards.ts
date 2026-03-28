import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

/** In-app destination when the user is signed in but has no provisioned organisation / Client row. */
export const ACCESS_REQUIRED_PATH = "/dashboard/access-required" as const;

/** Use when middleware has already authenticated the user but `resolveClientIdFromAuth()` is null. */
export function redirectToAccessRequired(): never {
  redirect(ACCESS_REQUIRED_PATH);
}

/**
 * Ensures the user is signed in. Non-public routes are also protected by Clerk middleware;
 * this makes the expectation explicit in layouts and pages.
 */
export async function requireAuthOrSignIn(): Promise<void> {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) {
    redirectToSignIn();
  }
}
