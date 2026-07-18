import { getPlatformClientId } from "@/lib/auth/platform-client";
import prisma from "@/lib/db/prisma";
import { isEngagementDryRun } from "@/lib/engagement/dry-run";
import { inngest } from "@/lib/inngest/client";
import {
  createWebsiteBuildTransaction,
  sendCampaignDraftToOwner,
  type WebsiteBuildType,
} from "@/lib/services/offer.service";
import type { CampaignSop } from "@/lib/types/engagement";
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

    if (!lead.email) throw new Error(`Lead ${leadId} has no email — cannot draft outreach to the prospect`);

    const spec = lead.productSpec;
    if (!spec) throw new Error(`No ProductSpec found for lead ${leadId}`);

    const profiledNeeds = spec.profiledNeeds as Record<string, unknown>;
    const companyName = String(profiledNeeds.companyName ?? lead.customerName ?? "");
    const buildType = detectBuildType(String(profiledNeeds.productType ?? ""));

    // The draft goes to the platform owner for review, not the prospect.
    const ownerEmail = await step.run("resolve-owner-email", async () => {
      const platformClientId = await getPlatformClientId();
      if (platformClientId) {
        const client = await prisma.client.findUnique({
          where: { id: platformClientId },
          select: { email: true },
        });
        if (client?.email) return client.email;
      }
      return process.env.OFFER_FROM_EMAIL ?? null;
    });
    if (!ownerEmail) {
      throw new Error("No platform owner email resolved (set Client.email or OFFER_FROM_EMAIL) — cannot send draft");
    }

    const { transactionId, checkoutUrl } = await step.run("create-paddle-transaction", () =>
      createWebsiteBuildTransaction({
        leadId,
        productSpecId: spec.id,
        clientId: lead.clientId ?? "",
        buildType,
      }),
    );

    // Refined outreach copy comes from the Strategy Engine's Campaign SOP; fall
    // back to the original prospecting draft if the SOP is somehow absent.
    const sop = spec.campaignSop as CampaignSop | null;
    const scraped = (lead.scrapedData ?? {}) as Record<string, unknown>;
    const refinedSubject =
      sop?.refinedEmail?.subject ??
      (typeof scraped.draftSubject === "string" ? scraped.draftSubject : `A quick idea for ${companyName}`);
    const refinedBody = sop?.refinedEmail?.body ?? (typeof scraped.draftBody === "string" ? scraped.draftBody : "");

    await step.run("send-campaign-draft", () =>
      sendCampaignDraftToOwner({
        ownerEmail,
        prospectEmail: lead.email!,
        prospectName: lead.customerName ?? "there",
        companyName,
        refinedSubject,
        refinedBody,
        deploymentUrl,
        checkoutUrl,
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
