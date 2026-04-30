import prisma from "@/lib/db/prisma";
import { isEngagementDryRun } from "@/lib/engagement/dry-run";
import { inngest } from "@/lib/inngest/client";
import { createWebsiteBuildTransaction, sendOfferEmail, type WebsiteBuildType } from "@/lib/services/offer.service";
import { makeOnFailure } from "./_shared/on-failure";

function detectBuildType(productType: string): WebsiteBuildType {
  return productType.toLowerCase().includes("landing") ? "landing" : "smb";
}

export const offerDispatcherFunction = inngest.createFunction(
  {
    id: "offer-dispatcher",
    name: "Offer Dispatcher",
    retries: 2,
    idempotency: "event.data.leadId",
    onFailure: makeOnFailure("offer-dispatcher", "OFFER_SENT"),
    triggers: [{ event: "engagement/deployment.ready" }],
  },
  async ({ event, step }) => {
    const { leadId, deploymentUrl } = event.data as {
      leadId: string;
      clientId: string;
      deploymentUrl: string;
    };

    if (isEngagementDryRun()) {
      return { leadId, stage: "SKIPPED_DRY_RUN", reason: "ENGAGEMENT_DRY_RUN" as const, deploymentUrl };
    }

    const lead = await step.run("load-lead", () =>
      prisma.lead.findUniqueOrThrow({
        where: { id: leadId },
        include: { productSpec: true },
      }),
    );

    if (!lead.email) throw new Error(`Lead ${leadId} has no email — cannot dispatch offer`);

    const spec = lead.productSpec;
    if (!spec) throw new Error(`No ProductSpec found for lead ${leadId}`);

    const profiledNeeds = spec.profiledNeeds as Record<string, unknown>;
    const buildType = detectBuildType(String(profiledNeeds.productType ?? ""));

    const { transactionId, checkoutUrl } = await step.run("create-paddle-transaction", () =>
      createWebsiteBuildTransaction({
        leadId,
        productSpecId: spec.id,
        clientId: lead.clientId ?? "",
        buildType,
      }),
    );

    await step.run("send-offer-email", () =>
      sendOfferEmail({
        toEmail: lead.email!,
        toName: lead.customerName ?? "there",
        companyName: String(profiledNeeds.companyName ?? ""),
        buildType,
        deploymentUrl,
        checkoutUrl,
        painPoints: (Array.isArray(profiledNeeds.painPoints) ? profiledNeeds.painPoints : []).map(String),
      }),
    );

    await step.run("update-spec-and-lead", async () => {
      await prisma.productSpec.update({
        where: { id: spec.id },
        data: {
          stage: "OFFER_SENT",
          paddleTransactionId: transactionId,
          deploymentUrl,
          offerSentAt: new Date(),
        },
      });
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: "CONTACTED" },
      });
    });

    return { leadId, stage: "OFFER_SENT", deploymentUrl, checkoutUrl };
  },
);
