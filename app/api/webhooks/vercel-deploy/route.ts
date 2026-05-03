import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { webhookReceiptService } from "@/lib/services/webhook-receipt.service";
import type { Prisma } from "../../../../generated/prisma/client";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.VERCEL_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "VERCEL_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  const signature = req.headers.get("x-vercel-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const body = await req.text();
  if (!verifyVercelSignature(body, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: VercelDeploymentWebhookPayload;
  try {
    payload = parseVercelDeploymentWebhookPayload(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.type !== "deployment.ready") {
    return NextResponse.json({ skipped: true });
  }

  try {
    const receipt = await webhookReceiptService.recordVerifiedReceipt({
      eventId: resolveVercelEventId(payload, body),
      eventType: payload.type,
      payload: JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue,
      provider: "VERCEL",
    });

    if (!receipt.duplicate) {
      await inngest.send({
        name: "webhook/receipt.created",
        data: { receiptId: receipt.receiptId },
      });
    }

    return NextResponse.json({ duplicate: receipt.duplicate, received: true }, { status: 202 });
  } catch (error) {
    console.error("Vercel webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

interface VercelDeploymentWebhookPayload {
  deployment?: {
    id?: string;
    name?: string;
    url?: string;
  };
  id?: string;
  type?: string;
}

function parseVercelDeploymentWebhookPayload(body: string): VercelDeploymentWebhookPayload {
  const parsed: unknown = JSON.parse(body);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid Vercel webhook payload");
  }
  const record = parsed as Record<string, unknown>;
  const deployment =
    typeof record.deployment === "object" && record.deployment !== null && !Array.isArray(record.deployment)
      ? (record.deployment as Record<string, unknown>)
      : undefined;
  return {
    deployment: deployment
      ? {
          id: typeof deployment.id === "string" ? deployment.id : undefined,
          name: typeof deployment.name === "string" ? deployment.name : undefined,
          url: typeof deployment.url === "string" ? deployment.url : undefined,
        }
      : undefined,
    id: typeof record.id === "string" ? record.id : undefined,
    type: typeof record.type === "string" ? record.type : undefined,
  };
}

function resolveVercelEventId(payload: VercelDeploymentWebhookPayload, rawBody: string): string {
  return payload.id ?? payload.deployment?.id ?? createHash("sha256").update(rawBody).digest("hex");
}

function verifyVercelSignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}
