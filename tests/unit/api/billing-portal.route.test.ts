import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const protect = vi.fn();
const auth = vi.fn();
const createPortalSession = vi.fn();
const findUniqueClient = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth,
  clerkMiddleware:
    (handler: (authContext: { protect: typeof protect }, request: Request) => Promise<void>) => (request: Request) =>
      handler({ protect }, request),
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

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    client: {
      findUnique: findUniqueClient,
    },
  },
}));

vi.mock("@/lib/paddle", () => ({
  paddle: {
    customerPortalSessions: {
      create: createPortalSession,
    },
  },
}));

describe("billing portal access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ userId: "user_123" });
    findUniqueClient.mockResolvedValue({
      paddleCustomerId: "ctm_123",
      paddleSubscriptionId: "sub_123",
    });
    createPortalSession.mockResolvedValue({
      urls: {
        general: {
          overview: "https://customer-portal.paddle.com/session_123",
        },
      },
    });
  });

  it("does not protect the portal redirect at middleware level", async () => {
    const { default: proxy } = await import("@/proxy");
    const event = { waitUntil: vi.fn() } as unknown as Parameters<typeof proxy>[1];

    await proxy(new NextRequest("https://graft.today/api/billing/portal"), event);

    expect(protect).not.toHaveBeenCalled();
  });

  it("returns an HTTP redirect to the Paddle customer portal", async () => {
    const { GET } = await import("@/app/api/billing/portal/route");

    const response = await GET();

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("https://customer-portal.paddle.com/session_123");
    expect(createPortalSession).toHaveBeenCalledWith("ctm_123", ["sub_123"]);
  });
});
