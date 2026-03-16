import { timingSafeEqual } from "node:crypto";
import { processQueue } from "@/lib/services/outbound.service";

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

  const result = await processQueue();
  return Response.json(result);
}
