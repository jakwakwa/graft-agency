import { z } from "zod";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";

/** Matches `ProspectingConfig` Prisma defaults when no row exists (serialised for the client). */
const DEFAULT_PROSPECTING_CONFIG_JSON = {
  cronEnabled: false,
  cronFrequency: "daily",
  cronDay: null,
  cronStartDate: null,
  searchCriteria: null,
  valueProposition: null,
  outreachFromEmail: null,
} as const;

const configSchema = z.object({
  cronEnabled: z.boolean().optional(),
  cronFrequency: z.enum(["daily", "weekly"]).optional(),
  cronDay: z.number().int().min(0).max(6).nullable().optional(),
  cronStartDate: z.string().datetime().nullable().optional(),
  searchCriteria: z
    .object({
      industries: z.array(z.string()).default([]),
      locations: z.array(z.string()).default([]),
      keywords: z.array(z.string()).default([]),
      headcountMin: z.number().int().min(1).optional().nullable(),
      headcountMax: z.number().int().min(1).optional().nullable(),
      prospectCap: z.number().int().min(1).max(200).optional().nullable(),
      personaId: z.string().optional().nullable(),
    })
    .optional(),
  outreachFromEmail: z.string().email().optional().nullable(),
  valueProposition: z.string().optional().nullable(),
});

export async function GET() {
  const result = await requirePlatformAccess();
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });

  const config = await prisma.prospectingConfig.findUnique({
    where: { clientId: result.clientId },
  });

  return Response.json(config ?? DEFAULT_PROSPECTING_CONFIG_JSON);
}

export async function POST(req: Request) {
  const result = await requirePlatformAccess();
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });

  const body = configSchema.safeParse(await req.json());
  if (!body.success) {
    return Response.json({ error: "Invalid request body", details: body.error.flatten() }, { status: 400 });
  }

  const data = {
    ...(body.data.cronEnabled !== undefined && { cronEnabled: body.data.cronEnabled }),
    ...(body.data.cronFrequency !== undefined && { cronFrequency: body.data.cronFrequency }),
    ...(body.data.cronDay !== undefined && { cronDay: body.data.cronDay }),
    ...(body.data.cronStartDate !== undefined && {
      cronStartDate: body.data.cronStartDate ? new Date(body.data.cronStartDate) : null,
    }),
    ...(body.data.searchCriteria !== undefined && { searchCriteria: body.data.searchCriteria }),
    ...(body.data.outreachFromEmail !== undefined && { outreachFromEmail: "jakwakwa@gmail.com" }),
    ...(body.data.valueProposition !== undefined && { valueProposition: body.data.valueProposition }),
  };

  const config = await prisma.prospectingConfig.upsert({
    where: { clientId: result.clientId },
    create: { clientId: result.clientId, ...data },
    update: data,
  });

  return Response.json(config);
}
