import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveBotSettingsAction } from "@/app/(portal)/portal/settings/actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/resolve-client", () => ({
  resolveClientIdFromAuth: vi.fn().mockResolvedValue("client-1"),
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    client: {
      findFirst: vi.fn().mockResolvedValue({
        isPlatformOwner: true,
        subscriptionActive: false,
        subscriptionStatus: "inactive",
        subscriptionAddons: [],
      }),
    },
    agentConfig: {
      upsert: vi.fn(),
    },
  },
}));

function createSettingsForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("agentName", overrides.agentName ?? "Graft Bot");
  formData.set("greetingMessage", overrides.greetingMessage ?? "Hello");
  formData.set("systemPrompt", overrides.systemPrompt ?? "Help visitors book calls.");
  formData.set("widgetPrimaryColour", overrides.widgetPrimaryColour ?? "#7c3aed");
  formData.set("widgetSecondaryColour", overrides.widgetSecondaryColour ?? "#1e1b4b");
  formData.set("knowledgeBase", overrides.knowledgeBase ?? "[]");
  formData.set("calComUsername", overrides.calComUsername ?? "client-user");
  formData.set("defaultEventSlug", overrides.defaultEventSlug ?? "client-slug");
  return formData;
}

describe("saveBotSettingsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists client Cal.com username and event slug to AgentConfig", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");
    const { revalidatePath } = await import("next/cache");

    await saveBotSettingsAction(createSettingsForm());

    expect(prisma.agentConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: "client-1" },
        create: expect.objectContaining({
          clientId: "client-1",
          calComUsername: "client-user",
          defaultEventSlug: "client-slug",
        }),
        update: expect.objectContaining({
          calComUsername: "client-user",
          defaultEventSlug: "client-slug",
        }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("stores blank Cal.com settings as null so environment fallback can apply", async () => {
    const { default: prisma } = await import("@/lib/db/prisma");

    await saveBotSettingsAction(
      createSettingsForm({
        calComUsername: "   ",
        defaultEventSlug: "   ",
      }),
    );

    expect(prisma.agentConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          calComUsername: null,
          defaultEventSlug: null,
        }),
        update: expect.objectContaining({
          calComUsername: null,
          defaultEventSlug: null,
        }),
      }),
    );
  });
});
