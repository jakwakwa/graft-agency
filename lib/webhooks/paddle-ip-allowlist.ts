/**
 * Source-IP allowlisting for Paddle webhook deliveries.
 *
 * Paddle publishes the IPs it sends webhooks from at https://api.paddle.com/ips
 * (returned as /32 CIDRs in `data.ipv4_cidrs`). That endpoint is the source of
 * truth and can change, so the list is fetched at runtime and cached rather
 * than hard-coded. Signature verification remains the primary defence — this
 * is defence-in-depth, enforced only in production.
 */

const PADDLE_IPS_URL = "https://api.paddle.com/ips";
const CACHE_TTL_MS = 15 * 60 * 1000;

let cachedCidrs: string[] | null = null;
let fetchedAt = 0;
let inflight: Promise<string[]> | null = null;

async function fetchAllowedCidrs(): Promise<string[]> {
  const res = await fetch(PADDLE_IPS_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Paddle IPs endpoint responded ${res.status}`);
  }
  const body = (await res.json()) as { data?: { ipv4_cidrs?: string[] } };
  const cidrs = body.data?.ipv4_cidrs;
  if (!Array.isArray(cidrs) || cidrs.length === 0) {
    throw new Error("Paddle IPs endpoint returned no ipv4_cidrs");
  }
  return cidrs;
}

/** Returns the current allowlist, or null if it has never been fetched successfully. */
async function getAllowedCidrs(): Promise<string[] | null> {
  if (cachedCidrs && Date.now() - fetchedAt < CACHE_TTL_MS) {
    return cachedCidrs;
  }
  inflight ??= fetchAllowedCidrs().finally(() => {
    inflight = null;
  });
  try {
    cachedCidrs = await inflight;
    fetchedAt = Date.now();
  } catch (err) {
    // Keep serving the stale list on refresh failure; null only on cold start.
    console.error("[Paddle webhook] Failed to refresh IP allowlist:", err);
  }
  return cachedCidrs;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value;
}

function ipMatchesCidr(ipValue: number, cidr: string): boolean {
  const [base = "", prefixRaw] = cidr.split("/");
  const baseValue = ipv4ToInt(base);
  if (baseValue === null) return false;
  const prefix = prefixRaw === undefined ? 32 : Number(prefixRaw);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  if (prefix === 0) return true;
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return (ipValue & mask) >>> 0 === (baseValue & mask) >>> 0;
}

export type PaddleIpVerdict = "allowed" | "denied" | "unavailable";

export async function verifyPaddleSourceIp(ip: string | null): Promise<PaddleIpVerdict> {
  const cidrs = await getAllowedCidrs();
  if (!cidrs) return "unavailable";
  if (!ip) return "denied";
  const ipValue = ipv4ToInt(ip);
  // Paddle publishes IPv4 addresses only — anything unparseable is denied.
  if (ipValue === null) return "denied";
  return cidrs.some((cidr) => ipMatchesCidr(ipValue, cidr)) ? "allowed" : "denied";
}
