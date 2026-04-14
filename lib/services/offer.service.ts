import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { Resend } from "resend";

interface ProductOfferResult {
  productId: string;
  priceId: string;
  checkoutUrl: string;
}

export async function createProductOffer(params: {
  productName: string;
  description: string;
  priceGBP: number;
}): Promise<ProductOfferResult> {
  const paddle = new Paddle(process.env.PADDLE_API_KEY ?? "test-key", {
    environment: process.env.NODE_ENV === "production" ? Environment.production : Environment.sandbox,
  });

  const product = await paddle.products.create({
    name: params.productName,
    description: params.description,
    taxCategory: "standard",
  });

  const price = await paddle.prices.create({
    productId: product.id,
    description: `${params.productName} — one-time purchase`,
    unitPrice: { amount: String(params.priceGBP * 100), currencyCode: "GBP" },
    billingCycle: null,
  });

  const sellerId = process.env.PADDLE_SELLER_ID ?? "test-seller";
  const checkoutUrl = `https://checkout.paddle.com/checkout/${price.id}?seller=${sellerId}`;

  return { productId: product.id, priceId: price.id, checkoutUrl };
}

export async function sendOfferEmail(params: {
  toEmail: string;
  toName: string;
  companyName: string;
  productName: string;
  deploymentUrl: string;
  checkoutUrl: string;
  priceGBP: number;
  painPoints: string[];
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "test-key");
  const fromEmail = process.env.OFFER_FROM_EMAIL ?? "hello@graft.today";

  const painPointsHtml = params.painPoints
    .map((p) => `<li style="margin-bottom:8px">✅ ${p}</li>`)
    .join("\n");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your ${params.productName} is ready</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #111827;">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Your prototype is live 🚀</h1>
  <p style="color: #6b7280; margin-bottom: 32px;">Hi ${params.toName}, we built something specifically for ${params.companyName}.</p>
  
  <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">${params.productName}</h2>
  
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
  
  <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Own it outright for £${params.priceGBP}</h3>
  <p style="color: #6b7280; margin-bottom: 24px;">One payment. Full source code. No recurring fees. Deploy it, modify it, make it yours.</p>
  
  <div style="text-align: center; margin: 24px 0;">
    <a href="${params.checkoutUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Buy Now — £${params.priceGBP}
    </a>
  </div>
  
  <p style="color: #9ca3af; font-size: 14px; margin-top: 40px;">Built by GRAFT.TODAY — Autonomous AI Product Studio</p>
</body>
</html>`;

  await resend.emails.send({
    from: fromEmail,
    to: params.toEmail,
    subject: `Your ${params.productName} prototype is live — view it now`,
    html,
  });
}
