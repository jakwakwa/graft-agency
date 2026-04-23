import prisma from "@/lib/db/prisma";
import { isEngagementDryRun } from "@/lib/engagement/dry-run";
import { inngest } from "@/lib/inngest/client";
import { createProductOffer, sendOfferEmail } from "@/lib/services/offer.service";
import { makeOnFailure } from "./_shared/on-failure";

const BASE_PRICE_GBP = 497;

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
    const productName = `${String(profiledNeeds.companyName ?? "Product")} ${String(profiledNeeds.productType ?? "Portal")}`;

    const offer = await step.run("create-paddle-product", () =>
      createProductOffer({
        productName,
        description: String(profiledNeeds.primaryNeed ?? ""),
        priceGBP: BASE_PRICE_GBP,
      }),
    );

    await step.run("send-offer-email", () =>
      sendOfferEmail({
        toEmail: "jakwakwa@gmail.com",
        toName: lead.customerName ?? "there",
        companyName: String(profiledNeeds.companyName ?? ""),
        productName,
        deploymentUrl,
        checkoutUrl: offer.checkoutUrl,
        priceGBP: BASE_PRICE_GBP,
        painPoints: (Array.isArray(profiledNeeds.painPoints) ? profiledNeeds.painPoints : []).map(String),
      }),
    );

    await step.run("update-spec-and-lead", async () => {
      await prisma.productSpec.update({
        where: { id: spec.id },
        data: {
          stage: "OFFER_SENT",
          paddleProductId: offer.productId,
          paddlePriceId: offer.priceId,
          deploymentUrl,
          offerSentAt: new Date(),
        },
      });
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: "CONTACTED" },
      });
    });

    return { leadId, stage: "OFFER_SENT", deploymentUrl, checkoutUrl: offer.checkoutUrl };
  },
);
