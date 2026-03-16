import Papa from "papaparse";
import { z } from "zod";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 10_000;

const csvRowSchema = z.object({
  businessName: z.string().min(1).max(500),
  websiteUrl: z.string().url().max(2048),
  address: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const result = await requirePlatformAccess();
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  const { clientId } = result;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 });
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return Response.json({ error: "Invalid CSV", details: parsed.errors }, { status: 400 });
  }

  const rows = parsed.data;
  if (rows.length > MAX_ROWS) {
    return Response.json({ error: `Too many rows. Max ${MAX_ROWS}` }, { status: 400 });
  }

  const normalized = rows.map((row) => {
    const businessName = row.businessName ?? row.business_name ?? "";
    const websiteUrl = row.websiteUrl ?? row.website_url ?? "";
    const address = row.address ?? "";
    return { businessName: businessName.trim(), websiteUrl: websiteUrl.trim(), address: address.trim() || undefined };
  });

  const validRows: Array<{ businessName: string; websiteUrl: string }> = [];
  const errors: Array<{ row: number; error: string }> = [];

  for (let i = 0; i < normalized.length; i++) {
    const result = csvRowSchema.safeParse(normalized[i]);
    if (result.success) {
      validRows.push({ businessName: result.data.businessName, websiteUrl: result.data.websiteUrl });
    } else {
      errors.push({ row: i + 1, error: result.error.message });
    }
  }

  if (validRows.length === 0) {
    return Response.json({ error: "No valid rows", details: errors }, { status: 400 });
  }

  const created = await prisma.prospectQueue.createMany({
    data: validRows.map((r) => ({
      clientId,
      businessName: r.businessName,
      websiteUrl: r.websiteUrl,
    })),
  });

  return Response.json({
    created: created.count,
    totalRows: rows.length,
    validRows: validRows.length,
    invalidRows: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
