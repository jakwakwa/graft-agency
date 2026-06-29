import { paddle } from "@/lib/paddle";
import { Resend } from "resend";

export type WebsiteBuildType = "landing" | "smb";

const PRICE_IDS: Record<WebsiteBuildType, string> = {
  landing: process.env.PADDLE_PRICE_LANDING!,
  smb: process.env.PADDLE_PRICE_SMB!,
};

const PRICE_DISPLAY: Record<WebsiteBuildType, { gbp: number; label: string }> = {
  landing: { gbp: 497, label: "Landing Page" },
  smb: { gbp: 997, label: "Small Business Website" },
};

export async function createWebsiteBuildTransaction(params: {
  leadId: string;
  productSpecId: string;
  clientId: string;
  buildType: WebsiteBuildType;
}): Promise<{ transactionId: string; checkoutUrl: string }> {
  const priceId = PRICE_IDS[params.buildType];
  if (!priceId) throw new Error(`No price ID configured for build type: ${params.buildType}`);

  const transaction = await paddle.transactions.create({
    items: [{ priceId, quantity: 1 }],
    customData: {
      leadId: params.leadId,
      productSpecId: params.productSpecId,
      clientId: params.clientId,
    },
  });

  const checkoutUrl = transaction.checkout?.url;
  if (!checkoutUrl) throw new Error("Paddle transaction missing checkout URL");

  return { transactionId: transaction.id, checkoutUrl };
}

export async function sendOfferEmail(params: {
  toEmail: string;
  toName: string;
  companyName: string;
  buildType: WebsiteBuildType;
  deploymentUrl: string;
  checkoutUrl: string;
  painPoints: string[];
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "test-key");
  const fromEmail = process.env.OFFER_FROM_EMAIL ?? "hello@graft.today";
  const { gbp, label } = PRICE_DISPLAY[params.buildType];

  const painPointsHtml = params.painPoints.map((p) => `<li style="margin-bottom:8px">✅ ${p}</li>`).join("\n");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your ${label} prototype is ready</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #111827;">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Your prototype is live 🚀</h1>
  <p style="color: #6b7280; margin-bottom: 32px;">Hi ${params.toName}, we built something specifically for ${params.companyName}.</p>

  <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">${label} for ${params.companyName}</h2>

  <p>We noticed ${params.companyName} is dealing with:</p>
  <ul style="padding-left: 20px; margin-bottom: 24px;">
    ${painPointsHtml}
  </ul>

  <p>So we built a working prototype that solves exactly this. You can see it live right now:</p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${params.deploymentUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin-bottom: 16px;">
      View Your Prototype →
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

  <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Own it outright — from £${gbp}</h3>
  <p style="color: #6b7280; margin-bottom: 24px;">One payment. Full source code. No recurring fees. Deploy it, modify it, make it yours. Paddle handles your local currency and tax automatically at checkout.</p>

  <div style="text-align: center; margin: 24px 0;">
    <a href="${params.checkoutUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Get Your ${label} →
    </a>
  </div>

  <p style="color: #9ca3af; font-size: 14px; margin-top: 40px;">Built by GRAFT.TODAY — Autonomous AI Product Studio</p>
</body>
</html>`;

  await resend.emails.send({
    from: fromEmail,
    to: params.toEmail,
    subject: `Your ${label} prototype is live — view it now`,
    html,
  });
}

/**
 * Sends the campaign as a REVIEW DRAFT to the platform owner (not the prospect).
 * The owner reviews the refined copy and forwards it to the prospect manually.
 * The prospect's address, the live demo CTA, and the checkout link are all
 * included so the owner has everything needed to send.
 */
export async function sendCampaignDraftToOwner(params: {
  ownerEmail: string;
  prospectEmail: string;
  prospectName: string;
  companyName: string;
  refinedSubject: string;
  refinedBody: string;
  deploymentUrl: string;
  checkoutUrl: string;
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "test-key");
  const fromEmail = process.env.OFFER_FROM_EMAIL ?? "hello@graft.today";

  const bodyHtml = params.refinedBody.replace(/\n/g, "<br>");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Campaign draft ready — ${params.companyName}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; padding: 40px 20px; color: #111827;">
  <p style="text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; font-weight: 700; color: #2563eb; margin-bottom: 4px;">Draft for your review</p>
  <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Campaign ready for ${params.companyName}</h1>
  <p style="color: #6b7280; margin-bottom: 24px;">Review the draft below, then forward it to the prospect when you're happy with it.</p>

  <table style="width:100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
    <tr><td style="padding:6px 0; color:#6b7280;">Send to prospect</td><td style="padding:6px 0; font-weight:600;">${params.prospectName} &lt;${params.prospectEmail}&gt;</td></tr>
    <tr><td style="padding:6px 0; color:#6b7280;">Suggested subject</td><td style="padding:6px 0; font-weight:600;">${params.refinedSubject}</td></tr>
  </table>

  <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:20px; margin-bottom:24px;">
    <p style="font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:12px;">Draft email body</p>
    <div style="font-size:15px; line-height:1.6;">${bodyHtml}</div>
  </div>

  <div style="text-align:center; margin:28px 0;">
    <a href="${params.deploymentUrl}" style="display:inline-block; background:#111827; color:#ffffff; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:600; font-size:16px;">
      View the live demo →
    </a>
  </div>

  <p style="font-size:14px; color:#6b7280;">Demo link (paste into the email): <a href="${params.deploymentUrl}">${params.deploymentUrl}</a></p>
  <p style="font-size:14px; color:#6b7280;">Checkout link (when they're ready to buy): <a href="${params.checkoutUrl}">${params.checkoutUrl}</a></p>

  <p style="color: #9ca3af; font-size: 13px; margin-top: 40px;">GRAFT.TODAY — Autonomous AI Product Studio</p>
</body>
</html>`;

  await resend.emails.send({
    from: fromEmail,
    to: params.ownerEmail,
    subject: `Draft ready — ${params.companyName}: review & forward`,
    html,
  });
}
