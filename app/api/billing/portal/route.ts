import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
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

  redirect(session.urls.general.overview);
}
