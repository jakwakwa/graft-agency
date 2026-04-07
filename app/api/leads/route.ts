import type { LeadStatus } from "@/generated/prisma/client";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";

const VALID_LEAD_STATUSES: LeadStatus[] = ["SCRAPED", "DRAFT_PENDING", "CONTACTED", "REPLIED", "BOOKED", "CLOSED"];

export async function GET(req: Request) {
  const result = await requirePlatformAccess();
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  const { clientId } = result;

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const status =
    statusParam && VALID_LEAD_STATUSES.includes(statusParam as LeadStatus) ? (statusParam as LeadStatus) : null;

  const leads = await prisma.lead.findMany({
    where: {
      clientId,
      source: "OUTBOUND_PROSPECT",
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(leads);
}
