import { timingSafeEqual } from "node:crypto";
import { getPlatformClientId } from "@/lib/auth/resolve-client";
import { runProspectingScheduledJob } from "@/lib/services/prospecting-scheduler.service";

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

  const outcome = await runProspectingScheduledJob(platformClientId, new Date());

  if (outcome.status === "skipped") {
    return Response.json({ message: outcome.reason });
  }

  if (outcome.status === "error") {
    return Response.json({ error: outcome.message }, { status: 500 });
  }

  return Response.json(outcome.result);
}
