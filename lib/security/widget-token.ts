import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = 1;
const DEFAULT_TTL_MS = 15 * 60 * 1000;

export interface WidgetTokenPayload {
  clientId: string;
  expiresAt: number;
  issuedAt: number;
  origin: string;
  version: typeof TOKEN_VERSION;
}

export type WidgetTokenVerification =
  | { ok: true; payload: WidgetTokenPayload }
  | { ok: false; reason: "MISSING_SECRET" | "MALFORMED_TOKEN" | "INVALID_SIGNATURE" | "EXPIRED_TOKEN" };

function getSecret(): string | null {
  const secret = process.env.WIDGET_TOKEN_SECRET?.trim();
  return secret && secret.length > 0 ? secret : null;
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function isWidgetTokenPayload(value: unknown): value is WidgetTokenPayload {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === TOKEN_VERSION &&
    typeof record.clientId === "string" &&
    record.clientId.length > 0 &&
    typeof record.origin === "string" &&
    record.origin.length > 0 &&
    typeof record.issuedAt === "number" &&
    typeof record.expiresAt === "number"
  );
}

export async function createWidgetToken(input: { clientId: string; origin: string; ttlMs?: number }): Promise<string> {
  const secret = getSecret();
  if (!secret) {
    throw new Error("WIDGET_TOKEN_SECRET is required to create widget tokens");
  }

  const issuedAt = Date.now();
  const payload: WidgetTokenPayload = {
    clientId: input.clientId,
    expiresAt: issuedAt + (input.ttlMs ?? DEFAULT_TTL_MS),
    issuedAt,
    origin: input.origin,
    version: TOKEN_VERSION,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${signPayload(encodedPayload, secret)}`;
}

export async function verifyWidgetToken(token: string): Promise<WidgetTokenVerification> {
  const secret = getSecret();
  if (!secret) return { ok: false, reason: "MISSING_SECRET" };

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return { ok: false, reason: "MALFORMED_TOKEN" };

  const expected = signPayload(encodedPayload, secret);
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return { ok: false, reason: "INVALID_SIGNATURE" };
    }
  } catch {
    return { ok: false, reason: "INVALID_SIGNATURE" };
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!isWidgetTokenPayload(parsed)) return { ok: false, reason: "MALFORMED_TOKEN" };
    if (parsed.expiresAt <= Date.now()) return { ok: false, reason: "EXPIRED_TOKEN" };
    return { ok: true, payload: parsed };
  } catch {
    return { ok: false, reason: "MALFORMED_TOKEN" };
  }
}
