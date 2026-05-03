import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";

interface VercelDeploymentWebhookPayload {
  deployment?: {
    name?: string;
    url?: string;
  };
  type?: string;
}

export async function applyVercelDeployWebhook(payload: VercelDeploymentWebhookPayload): Promise<unknown> {
  if (payload.type !== "deployment.ready") {
    return { skipped: true };
  }

  const deployment = payload.deployment;
  if (!deployment?.name || !deployment.url) {
    return { skipped: true, reason: "Missing deployment metadata" };
  }

  try {
    const deploymentUrl = `https://${deployment.url}`;
    const spec = await prisma.productSpec.findFirst({
      where: { githubRepo: { contains: deployment.name } },
    });

    if (!spec) {
      return { reason: "No matching spec", skipped: true };
    }

    await prisma.productSpec.update({
      where: { id: spec.id },
      data: { deploymentUrl, stage: "DEPLOYED" },
    });

    await inngest.send({
      name: "engagement/deployment.ready",
      data: { clientId: spec.clientId, deploymentUrl, leadId: spec.leadId },
    });

    return { ok: true, productSpecId: spec.id };
  } catch (err) {
    console.error("[Vercel webhook] Failed to process deployment:", err);
    throw err;
  }
}
