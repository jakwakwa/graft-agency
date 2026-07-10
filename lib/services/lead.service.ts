import prisma from "@/lib/db/prisma";
import { emailService } from "@/lib/services/email.service";

/**
 * Relays a chat-captured lead to the widget owner by email so they can follow
 * up — this is the bot's default fallback whenever booking isn't available.
 * Best-effort: a failed email must never fail the lead capture itself.
 */
async function notifyOwnerOfChatLead(input: {
  clientId: string;
  name: string;
  email?: string;
  phone?: string;
  need?: string;
}) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: input.clientId },
      select: { email: true, businessName: true },
    });
    if (!client?.email) return;

    const lines = [
      `Your GraftBot just captured a new lead from your website chat${client.businessName ? ` for ${client.businessName}` : ""}.`,
      "",
      `Name: ${input.name}`,
      input.email ? `Email: ${input.email}` : null,
      input.phone ? `Phone: ${input.phone}` : null,
      input.need ? `What they need: ${input.need}` : null,
      "",
      "They're expecting someone to get back to them — view the full conversation in your GRAFT portal.",
    ].filter((line): line is string => line !== null);

    await emailService.sendOutreach({
      to: client.email,
      subject: `New lead from your website chat: ${input.name}`,
      body: lines.join("\n"),
    });
  } catch (err) {
    console.error("[lead.service] Failed to email owner about chat lead:", err);
  }
}

export const leadService = {
  async createFromChat(input: { clientId?: string; name: string; email?: string; phone?: string; need?: string }) {
    const lead = await prisma.lead.create({
      data: {
        clientId: input.clientId,
        customerName: input.name,
        email: input.email,
        phone: input.phone,
        source: "INBOUND",
      },
    });

    if (input.clientId) {
      await notifyOwnerOfChatLead({ ...input, clientId: input.clientId });
    }

    return lead;
  },

  async flagForHandoff(input: { leadId?: string; reason: string; urgency: string }) {
    if (input.leadId) {
      await prisma.lead.update({
        where: { id: input.leadId },
        data: {
          status: "CONTACTED",
          chatTranscript: {
            handoffReason: input.reason,
            urgency: input.urgency,
          },
        },
      });
    }
    return { status: "flagged" };
  },

  async createFromOutbound(input: {
    clientId: string;
    customerName: string;
    websiteUrl?: string;
    auditData?: import("@/lib/scraper").ProspectAudit;
    draftSubject?: string;
    draftBody?: string;
  }) {
    return prisma.lead.create({
      data: {
        clientId: input.clientId,
        customerName: input.customerName,
        source: "OUTBOUND_PROSPECT",
        status: "DRAFT_PENDING",
        scrapedData: {
          websiteUrl: input.websiteUrl,
          draftSubject: input.draftSubject,
          draftBody: input.draftBody,
          ...(input.auditData ?? {}),
        },
      },
    });
  },
};
