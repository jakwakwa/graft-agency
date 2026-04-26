import type { LeadStatus, LeadSource, Prisma } from "@/generated/prisma/client";
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

  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const sortParam = searchParams.get("sort");
  const orderParam = searchParams.get("order")?.toLowerCase() === "asc" ? "asc" : "desc";
  const isPaginated = pageParam !== null || limitParam !== null;

  const parsedPage = pageParam ? parseInt(pageParam, 10) : NaN;
  const parsedLimit = limitParam ? parseInt(limitParam, 10) : NaN;
  const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 25;

  const where: Prisma.LeadWhereInput = {
    clientId,
    source: "OUTBOUND_PROSPECT" as LeadSource,
    ...(status ? { status } : {}),
  };

  const orderBy: Prisma.LeadOrderByWithRelationInput =
    sortParam === "engagementStage"
      ? { productSpec: { stage: orderParam } }
      : { createdAt: orderParam };

  if (!isPaginated) {
    const leads = await prisma.lead.findMany({
      where,
      orderBy,
      include: {
        productSpec: {
          select: { stage: true },
        },
      },
    });

    return Response.json(
      leads.map(({ productSpec, ...lead }) => ({
        ...lead,
        engagementStage: productSpec?.stage ?? "NOT_STARTED",
      })),
    );
  }

  const [total, leads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        productSpec: {
          select: { stage: true },
        },
      },
    }),
  ]);

  return Response.json({
    data: leads.map(({ productSpec, ...lead }) => ({
      ...lead,
      engagementStage: productSpec?.stage ?? "NOT_STARTED",
    })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}
