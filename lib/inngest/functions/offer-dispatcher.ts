import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";
import { createProductOffer, sendOfferEmail } from "@/lib/services/offer.service";

const BASE_PRICE_GBP = 497;

export const offerDispatcherFunction = inngest.createFunction(
  {
    id: "offer-dispatcher",
    name: "Offer Dispatcher",
    triggers: [{ event: "engagement/deployment.ready" }],
  },
  async ({ event, step }) => {
    const { leadId, clientId, deploymentUrl } = event.data as {
      leadId: string;
      clientId: string;
      deploymentUrl: string;
    };

    const lead = await step.run("load-lead", () =>
      prisma.lead.findUniqueOrThrow({
        where: { id: leadId },
        include: { productSpec: true },
      }),
    );

    if (!lead.email) throw new Error(`Lead ${leadId} has no email — cannot dispatch offer`);

    const spec = lead.productSpec;
    if (!spec) throw new Error(`No ProductSpec found for lead ${leadId}`);

    const profiledNeeds = spec.profiledNeeds as Record<string, any>;
    const productName = `${profiledNeeds.companyName} ${profiledNeeds.productType ?? "Portal"}`;

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
        painPoints: (profiledNeeds.painPoints as string[]) ?? [],
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
