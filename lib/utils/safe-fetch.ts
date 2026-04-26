import * as dns from "dns";
import * as net from "net";

export class SsrfRejectedError extends Error {
  constructor(reason: string) {
    super(`SSRF check rejected request: ${reason}`);
    this.name = "SsrfRejectedError";
  }
}

const ALLOWED_PROTOCOLS = new Set(["https:", "http:"]);
const MAX_REDIRECTS = 5;

/** IPv4 CIDR ranges that must never be fetched. */
const BLOCKED_IPV4_CIDRS: { base: number; mask: number }[] = [
  { base: ip4ToInt("127.0.0.0"), mask: 0xff000000 }, // Loopback
  { base: ip4ToInt("10.0.0.0"), mask: 0xff000000 }, // RFC1918
  { base: ip4ToInt("172.16.0.0"), mask: 0xfff00000 }, // RFC1918
  { base: ip4ToInt("192.168.0.0"), mask: 0xffff0000 }, // RFC1918
  { base: ip4ToInt("169.254.0.0"), mask: 0xffff0000 }, // Link-local / APIPA
  { base: ip4ToInt("0.0.0.0"), mask: 0xff000000 }, // This-network
  { base: ip4ToInt("100.64.0.0"), mask: 0xffc00000 }, // Shared - RFC6598
  { base: ip4ToInt("224.0.0.0"), mask: 0xf0000000 }, // Multicast
  { base: ip4ToInt("240.0.0.0"), mask: 0xf0000000 }, // Reserved
];

function ip4ToInt(ip: string): number {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return ip.split(".").map(Number).reduce((acc, octet) => (acc << 8) | octet, 0) >>> 0;
}

function isBlockedIpv4(addr: string): boolean {
  let ip = addr;
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped?.[1]) ip = mapped[1];
  if (!net.isIPv4(ip)) return false;
  const n = ip4ToInt(ip);
  return BLOCKED_IPV4_CIDRS.some((cidr) => (n & cidr.mask) >>> 0 === cidr.base);
}

function isBlockedIpv6(addr: string): boolean {
  if (!net.isIPv6(addr)) return false;
  const lower = addr.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (/^f[cd]/i.test(lower)) return true; // Unique-local fc00::/7
  if (/^fe[89ab]/i.test(lower)) return true; // Link-local fe80::/10
  if (/^ff/i.test(lower)) return true; // Multicast
  return false;
}

async function resolveAndCheck(hostname: string): Promise<void> {
  let addrs: string[];
  try {
    const results = await dns.promises.lookup(hostname, { all: true, family: 0 });
    addrs = results.map((r) => r.address);
  } catch {
    throw new SsrfRejectedError(`DNS resolution failed for "${hostname}"`);
  }

  for (const addr of addrs) {
    if (isBlockedIpv4(addr) || isBlockedIpv6(addr)) {
      throw new SsrfRejectedError(`"${hostname}" resolves to blocked address ${addr}`);
    }
  }
}

function parseAndValidate(rawUrl: string): URL {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    throw new SsrfRejectedError(`Invalid URL: "${rawUrl}"`);
  }

  if (!ALLOWED_PROTOCOLS.has(u.protocol)) {
    throw new SsrfRejectedError(`Protocol "${u.protocol}" not allowed`);
  }

  if (u.username || u.password) {
    throw new SsrfRejectedError("URLs with embedded credentials are not allowed");
  }

  // Reject raw IP literals before DNS lookup
  if (net.isIP(u.hostname)) {
    if (isBlockedIpv4(u.hostname) || isBlockedIpv6(u.hostname)) {
      throw new SsrfRejectedError(`IP address "${u.hostname}" is in a blocked range`);
    }
  }

  return u;
}

/**
 * Build an absolute URL from AI/user-supplied input.
 * If no scheme present, prepends https://. Returns null if unparseable.
 */
export function toAbsoluteUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const withProto = t.includes("://") ? t : `https://${t}`;
    new URL(withProto);
    return withProto;
  } catch {
    return null;
  }
}

/**
 * SSRF-safe fetch.
 * - Enforces http/https protocol only.
 * - Rejects embedded credentials.
 * - Rejects IP literals and hostnames resolving to private/loopback/link-local ranges.
 * - Follows redirects manually, re-validating each hop (max 5).
 */
export async function safeFetch(
  rawUrl: string,
  init?: Omit<RequestInit, "redirect">,
  _hops = 0
): Promise<Response> {
  if (_hops > MAX_REDIRECTS) {
    throw new SsrfRejectedError("Too many redirects");
  }

  const u = parseAndValidate(rawUrl);
  await resolveAndCheck(u.hostname);

  const res = await fetch(u.toString(), { ...init, redirect: "manual" });

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (!location) throw new SsrfRejectedError("Redirect with no Location header");
    const next = new URL(location, u).toString();
    return safeFetch(next, init, _hops + 1);
  }

  return res;
}
