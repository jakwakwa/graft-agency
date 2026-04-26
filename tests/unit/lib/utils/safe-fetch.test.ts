import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SsrfRejectedError, safeFetch, toAbsoluteUrl } from "@/lib/utils/safe-fetch";

vi.mock("dns", () => ({
  promises: {
    lookup: vi.fn(),
  },
}));

import * as dns from "dns";

const mockLookup = vi.mocked(dns.promises.lookup);

function mockDnsResolve(addresses: string[]) {
  mockLookup.mockResolvedValue(addresses.map((address) => ({ address, family: address.includes(":") ? 6 : 4 })) as never);
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  vi.clearAllMocks();
  globalThis.fetch = originalFetch;
});

describe("toAbsoluteUrl", () => {
  it("returns https:// URL when no scheme present", () => {
    expect(toAbsoluteUrl("example.com")).toBe("https://example.com");
  });

  it("preserves existing scheme", () => {
    expect(toAbsoluteUrl("http://example.com/path")).toBe("http://example.com/path");
  });

  it("returns null for empty string", () => {
    expect(toAbsoluteUrl("")).toBeNull();
  });

  it("returns null for unparseable input", () => {
    expect(toAbsoluteUrl("not a url !!##")).toBeNull();
  });

  it("handles bare host with path", () => {
    expect(toAbsoluteUrl("example.com/about")).toBe("https://example.com/about");
  });
});

describe("safeFetch — protocol enforcement", () => {
  it("rejects file:// protocol", async () => {
    await expect(safeFetch("file:///etc/passwd")).rejects.toThrow(SsrfRejectedError);
  });

  it("rejects ftp:// protocol", async () => {
    await expect(safeFetch("ftp://example.com")).rejects.toThrow(SsrfRejectedError);
  });

  it("rejects invalid URL", async () => {
    await expect(safeFetch("not-a-url")).rejects.toThrow(SsrfRejectedError);
  });

  it("rejects URLs with embedded credentials", async () => {
    await expect(safeFetch("https://user:pass@example.com")).rejects.toThrow(SsrfRejectedError);
  });
});

describe("safeFetch — IP literal rejection (before DNS)", () => {
  it("rejects 127.0.0.1 loopback", async () => {
    await expect(safeFetch("http://127.0.0.1/")).rejects.toThrow(SsrfRejectedError);
  });

  it("rejects cloud metadata endpoint 169.254.169.254", async () => {
    await expect(safeFetch("http://169.254.169.254/latest/meta-data/")).rejects.toThrow(SsrfRejectedError);
  });

  it("rejects RFC1918 10.x address", async () => {
    await expect(safeFetch("http://10.0.0.1/")).rejects.toThrow(SsrfRejectedError);
  });

  it("rejects RFC1918 172.16.x address", async () => {
    await expect(safeFetch("http://172.16.0.1/")).rejects.toThrow(SsrfRejectedError);
  });

  it("rejects RFC1918 192.168.x address", async () => {
    await expect(safeFetch("http://192.168.1.1/")).rejects.toThrow(SsrfRejectedError);
  });

  it("rejects IPv6 loopback ::1", async () => {
    await expect(safeFetch("http://[::1]/")).rejects.toThrow(SsrfRejectedError);
  });

  it("rejects IPv4-mapped IPv6 ::ffff:169.254.169.254", async () => {
    await expect(safeFetch("http://[::ffff:169.254.169.254]/")).rejects.toThrow(SsrfRejectedError);
  });
});

describe("safeFetch — DNS resolution blocking", () => {
  it("rejects hostname resolving to loopback", async () => {
    mockDnsResolve(["127.0.0.1"]);
    await expect(safeFetch("https://internal.corp/")).rejects.toThrow(SsrfRejectedError);
  });

  it("rejects hostname resolving to link-local", async () => {
    mockDnsResolve(["169.254.169.254"]);
    await expect(safeFetch("https://metadata.internal/")).rejects.toThrow(SsrfRejectedError);
  });

  it("rejects hostname resolving to RFC1918", async () => {
    mockDnsResolve(["10.0.0.1"]);
    await expect(safeFetch("https://intranet.example.com/")).rejects.toThrow(SsrfRejectedError);
  });

  it("rejects when any resolved address is private (mixed results)", async () => {
    mockDnsResolve(["93.184.216.34", "10.0.0.1"]);
    await expect(safeFetch("https://example.com/")).rejects.toThrow(SsrfRejectedError);
  });

  it("rejects when DNS fails", async () => {
    mockLookup.mockRejectedValue(new Error("ENOTFOUND"));
    await expect(safeFetch("https://does-not-exist.example/")).rejects.toThrow(SsrfRejectedError);
  });
});

describe("safeFetch — happy path", () => {
  beforeEach(() => {
    mockDnsResolve(["93.184.216.34"]); // example.org public IP
  });

  it("returns response for a safe public URL", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("ok", { status: 200 })) as any;
    const res = await safeFetch("https://example.org/");
    expect(res.status).toBe(200);
  });

  it("uses redirect:manual internally", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    globalThis.fetch = mockFetch as any;
    await safeFetch("https://example.org/");
    expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ redirect: "manual" }));
  });
});

describe("safeFetch — redirect handling", () => {
  it("re-validates redirect Location and rejects if it points to private IP", async () => {
    mockLookup
      .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }] as never) // first hop — safe
      .mockResolvedValueOnce([{ address: "169.254.169.254", family: 4 }] as never); // redirect target — blocked

    // biome-ignore lint/suspicious/noExplicitAny: test mock
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(null, { status: 302, headers: { location: "http://169.254.169.254/creds" } })
    ) as any;

    await expect(safeFetch("https://example.com/redirect")).rejects.toThrow(SsrfRejectedError);
  });

  it("rejects after too many redirects", async () => {
    mockDnsResolve(["93.184.216.34"]);
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(null, { status: 302, headers: { location: "https://example.com/loop" } })
    ) as any;

    await expect(safeFetch("https://example.com/loop")).rejects.toThrow(SsrfRejectedError);
  });
});
