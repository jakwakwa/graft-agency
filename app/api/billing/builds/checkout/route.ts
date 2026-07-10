import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  BUILD_ALREADY_PURCHASED_CODE,
  getBuildPriceIds,
  startOfCurrentMonthUtc,
} from "@/lib/billing/build-purchases";
import prisma from "@/lib/db/prisma";
import { paddle } from "@/lib/paddle";

const bodySchema = z.object({
  priceId: z.string().min(1),
});

/**
 * Creates a server-side Paddle transaction for a one-time website build.
 * The overlay checkout is then opened against the returned transaction ID, so
 * the max-one-per-workspace-per-month rule is enforced here — it cannot be
 * bypassed by invoking Paddle checkout URLs from the browser console.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { priceId } = parsed.data;
  if (!getBuildPriceIds().includes(priceId)) {
    return Response.json({ error: "Price ID is not a purchasable build" }, { status: 400 });
  }

  const client = await prisma.client.findFirst({
    where: { clerkUserId: userId, deletedAt: null },
    select: { id: true, paddleCustomerId: true },
  });
  if (!client) return Response.json({ error: "Client not found" }, { status: 404 });

  // Quantity rule: max one of each build per workspace per calendar month.
  const purchasesThisMonth = await prisma.buildPurchase.count({
    where: {
      clientId: client.id,
      priceId,
      createdAt: { gte: startOfCurrentMonthUtc() },
    },
  });
  if (purchasesThisMonth > 0) {
    return Response.json(
      {
        error: "This build has already been purchased for this workspace this month",
        code: BUILD_ALREADY_PURCHASED_CODE,
      },
      { status: 409 },
    );
  }

  const transaction = await paddle.transactions.create({
    items: [{ priceId, quantity: 1 }],
    ...(client.paddleCustomerId ? { customerId: client.paddleCustomerId } : {}),
    customData: { clientId: client.id },
  });

  return Response.json({ transactionId: transaction.id });
}
