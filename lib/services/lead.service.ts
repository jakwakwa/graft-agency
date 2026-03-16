import prisma from "@/lib/db/prisma";

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
};
