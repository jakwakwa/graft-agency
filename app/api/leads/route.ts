import type { LeadStatus } from "@/generated/prisma/client";
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";

const VALID_LEAD_STATUSES: LeadStatus[] = ["SCRAPED", "DRAFT_PENDING", "CONTACTED", "REPLIED", "BOOKED", "CLOSED"];

export async function GET(req: Request) {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status") ?? "DRAFT_PENDING";
  const status = VALID_LEAD_STATUSES.includes(statusParam as LeadStatus)
    ? (statusParam as LeadStatus)
    : "DRAFT_PENDING";

  const leads = await prisma.lead.findMany({
    where: {
      clientId,
      source: "OUTBOUND_PROSPECT",
      status,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(leads);
}
