import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { paddle } from "@/lib/paddle";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const client = await prisma.client.findUnique({ where: { clerkUserId: userId } });
  if (!client?.paddleCustomerId) {
    return Response.json({ error: "No Paddle customer found" }, { status: 404 });
  }

  const subscriptionIds = client.paddleSubscriptionId ? [client.paddleSubscriptionId] : [];
  const session = await paddle.customerPortalSessions.create(client.paddleCustomerId, subscriptionIds);
  const portalUrl = session.urls?.general?.overview;

  if (!portalUrl) {
    console.error("[Billing portal] Paddle returned no customer portal URL", {
      clientId: client.id,
      paddleCustomerId: client.paddleCustomerId,
    });
    return Response.json({ error: "Billing portal unavailable" }, { status: 502 });
  }

  return NextResponse.redirect(portalUrl, 303);
}
