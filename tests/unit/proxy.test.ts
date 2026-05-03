import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const clerkMocks = vi.hoisted(() => ({
  protect: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware:
    (handler: (authContext: { protect: typeof clerkMocks.protect }, request: Request) => Promise<void>) =>
    (request: Request) =>
      handler({ protect: clerkMocks.protect }, request),
  createRouteMatcher: (patterns: string[]) => (request: Request) => {
    const pathname = new URL(request.url).pathname;

    return patterns.some((pattern) => {
      if (pattern.endsWith("(.*)")) {
        return pathname.startsWith(pattern.slice(0, -4));
      }

      return pathname === pattern;
    });
  },
}));

function matchesProxyMatcher(pathname: string) {
  const matcher = proxyConfig.matcher[0];
  return new RegExp(matcher).test(pathname);
}

describe("Clerk proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not protect the robot concierge MP4 asset", async () => {
    const { default: proxy } = await import("@/proxy");
    const event = { waitUntil: vi.fn() } as unknown as Parameters<typeof proxy>[1];

    await proxy(new NextRequest("https://graft.today/Robot_concierge.mp4"), event);

    expect(clerkMocks.protect).not.toHaveBeenCalled();
  });

  it("keeps public video asset extensions out of the proxy matcher", async () => {
    const { config } = await import("@/proxy");
    proxyConfig = config;

    expect(["/Robot_concierge.mp4", "/hero.webm", "/clip.ogg", "/preview.mov"].filter(matchesProxyMatcher)).toEqual([]);
  });

  it("protects private app routes", async () => {
    const { default: proxy } = await import("@/proxy");
    const event = { waitUntil: vi.fn() } as unknown as Parameters<typeof proxy>[1];

    await proxy(new NextRequest("https://graft.today/portal"), event);

    expect(clerkMocks.protect).toHaveBeenCalledTimes(1);
  });
});

let proxyConfig: { matcher: string[] };
