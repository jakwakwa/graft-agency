import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { paddle } from "@/lib/paddle";

const bodySchema = z.object({
  priceId: z.string().min(1),
  action: z.enum(["add", "remove"]),
});

const ADDON_PRICE_IDS = [
  process.env.PADDLE_PRICE_VOICE_MONTHLY,
  process.env.PADDLE_PRICE_BOOKING_MONTHLY,
].filter(Boolean) as string[];

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { priceId, action } = parsed.data;

  if (!ADDON_PRICE_IDS.includes(priceId)) {
    return Response.json({ error: "Price ID is not an allowed add-on" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { clerkUserId: userId } });
  if (!client) return Response.json({ error: "Client not found" }, { status: 404 });
  if (!client.paddleSubscriptionId) {
    return Response.json({ error: "No active subscription" }, { status: 400 });
  }

  const subscription = await paddle.subscriptions.get(client.paddleSubscriptionId);

  const currentItems = (subscription.items ?? []).map((item) => ({
    priceId: item.price!.id,
    quantity: item.quantity,
  }));

  const updatedItems =
    action === "add"
      ? [...currentItems.filter((i) => i.priceId !== priceId), { priceId, quantity: 1 }]
      : currentItems.filter((i) => i.priceId !== priceId);

  await paddle.subscriptions.update(client.paddleSubscriptionId, {
    items: updatedItems,
    prorationBillingMode: "prorated_next_billing_period",
  });

  const activeAddons = updatedItems.map((i) => i.priceId).filter((id) => ADDON_PRICE_IDS.includes(id));

  await prisma.client.update({
    where: { id: client.id },
    data: { subscriptionAddons: activeAddons },
  });

  return Response.json({ ok: true, activeAddons });
}
