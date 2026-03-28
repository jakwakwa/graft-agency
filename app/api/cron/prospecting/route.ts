import { timingSafeEqual } from "node:crypto";
import { getPlatformClientId } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";
import { geminiProspectingService } from "@/lib/services/gemini-prospecting.service";

function validateCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length === 0) return false;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  if (token.length !== secret.length) return false;

  try {
    const buf1 = Buffer.from(token, "utf8");
    const buf2 = Buffer.from(secret, "utf8");
    return timingSafeEqual(buf1, buf2);
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length === 0) {
    return Response.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (!validateCronSecret(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platformClientId = await getPlatformClientId();
  if (!platformClientId) {
    return Response.json({ error: "Platform client not found" }, { status: 500 });
  }

  const config = await prisma.prospectingConfig.findUnique({
    where: { clientId: platformClientId },
  });

  if (!config || config.cronEnabled === false) {
    return Response.json({ message: "Cron disabled" });
  }

  if (config.cronStartDate && config.cronStartDate > new Date()) {
    return Response.json({ message: "Cron: start date not yet reached" });
  }

  if (
    config.cronFrequency === "weekly" &&
    config.cronDay !== null &&
    config.cronDay !== undefined
  ) {
    if (new Date().getUTCDay() !== config.cronDay) {
      return Response.json({ message: "Cron: not scheduled for today" });
    }
  }

  if (!config.searchCriteria) {
    return Response.json({ message: "No search criteria configured" });
  }

  try {
    const criteria = config.searchCriteria as {
      industries?: string[];
      locations?: string[];
      keywords?: string[];
    };
    const result = await geminiProspectingService.findAndAuditProspects({
      clientId: platformClientId,
      searchCriteria: criteria,
      valueProposition: config.valueProposition,
    });
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prospecting failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
