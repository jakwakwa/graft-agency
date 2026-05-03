import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/privacy",
  "/terms",
  "/api/billing/portal",
  "/api/chat",
  "/api/embed/(.*)",
  "/api/webhooks/(.*)",
  "/api/cron/(.*)",
  "/api/inngest",
  "/widget/(.*)",
  "/Robot_concierge.mp4",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|mp4|webm|ogg|mov|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
