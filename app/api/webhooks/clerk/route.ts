import { headers } from "next/headers";
import { Webhook } from "svix";
import { applyClerkOrganizationWebhook } from "@/lib/webhooks/clerk-organizations";

/**
 * Clerk → Graft sync for members and agency.
 * Configure in Clerk Dashboard → Webhooks → endpoint URL `/api/webhooks/clerk`
 * and subscribe to:
 * - organization.created (bootstrap)
 * - organizationMembership.created (provision client)
 * - organizationMembership.deleted (soft-delete client)
 */
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return Response.json({ error: "CLERK_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  const h = await headers();
  const svixId = h.get("svix-id");
  const svixTimestamp = h.get("svix-timestamp");
  const svixSignature = h.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const body = await req.text();
  let evt: { type: string; data: unknown };
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: unknown };
  } catch {
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    const result = await applyClerkOrganizationWebhook(evt.type, evt.data);
    return Response.json({ ok: true, ...result }, { status: 200 });
  } catch (err) {
    console.error("[Clerk webhook]", err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
