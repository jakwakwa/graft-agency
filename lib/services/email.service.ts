import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  return new Resend(apiKey);
}

export const emailService = {
  async sendOutreach({
    to,
    subject,
    body,
    fromEmail,
  }: {
    to: string;
    subject: string;
    body: string;
    fromEmail?: string;
  }) {
    const from = fromEmail ?? process.env.OUTREACH_FROM_EMAIL;
    if (!from) {
      throw new Error("No outreach from email configured. Set OUTREACH_FROM_EMAIL or configure in ProspectingConfig.");
    }

    const resend = getResendClient();
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html: body.replace(/\n/g, "<br>"),
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    return { id: result.data?.id };
  },
};
