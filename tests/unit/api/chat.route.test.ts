import { beforeEach, describe, expect, it, vi } from "vitest";

const convertToModelMessages = vi.fn();
const createUIMessageStream = vi.fn();
const createUIMessageStreamResponse = vi.fn();
const stepCountIs = vi.fn(() => "stop-condition");
const streamText = vi.fn();

const selectModel = vi.fn(() => "mock-model");
const buildSystemPrompt = vi.fn(() => "mock-system-prompt");
const createTools = vi.fn(() => ({ searchKnowledgeBase: { description: "tool" } }));
const getConfig = vi.fn();
const saveConversation = vi.fn();
const authoriseChat = vi.fn();
const recordAllowedUsage = vi.fn();
const getClientEntitlements = vi.fn();

vi.mock("ai", () => ({
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
}));

vi.mock("@/lib/ai/model-router", () => ({
  selectModel,
}));

vi.mock("@/lib/ai/system-prompt", () => ({
  buildSystemPrompt,
}));

vi.mock("@/lib/ai/tools", () => ({
  createTools,
}));

vi.mock("@/lib/billing/entitlements", () => ({
  getClientEntitlements,
}));

vi.mock("@/lib/services/agent.service", () => ({
  agentService: {
    getConfig,
  },
  isSyntheticAgentConfig: () => false,
  PLATFORM_LANDING_WIDGET_DEFAULTS: {
    agentName: "GRAFT Assistant",
    greetingMessage: "Hello!",
  },
}));

vi.mock("@/lib/services/conversation.service", () => ({
  conversationService: {
    save: saveConversation,
  },
}));

vi.mock("@/lib/services/chat-protection.service", () => ({
  chatProtectionService: {
    authorise: authoriseChat,
    recordAllowedUsage,
  },
}));

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createUIMessageStream.mockImplementation(({ onFinish }) => {
      void onFinish?.({
        messages: [
          {
            id: "assistant-1",
            parts: [{ text: "Hello there", type: "text" }],
            role: "assistant",
          },
        ],
      });

      return "mock-stream";
    });
    createUIMessageStreamResponse.mockReturnValue(new Response("ok"));
    convertToModelMessages.mockResolvedValue([{ content: "Hello there", role: "user" }]);
    streamText.mockReturnValue({
      toUIMessageStream: () => "ui-stream",
    });
    getConfig.mockResolvedValue({
      agentName: "GRAFT",
      greetingMessage: "Hello!",
      knowledgeBase: null,
      systemPrompt: "Be helpful",
    });
    authoriseChat.mockResolvedValue({ ok: true, clientId: "client-1", isPlatformDemo: false });
  });

  it("returns 400 when the request body is invalid", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        body: JSON.stringify({ clientId: "", sessionId: "" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(authoriseChat).not.toHaveBeenCalled();
    expect(getConfig).not.toHaveBeenCalled();
  });

  it("rejects unauthorised tenant requests before loading config or selecting a model", async () => {
    authoriseChat.mockResolvedValueOnce({
      ok: false,
      error: "Widget token is required",
      reason: "MISSING_WIDGET_TOKEN",
      status: 401,
    });

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        body: JSON.stringify({
          clientId: "client-1",
          messages: [{ id: "u1", parts: [{ text: "Hey", type: "text" }], role: "user" }],
          sessionId: "session-1",
        }),
        headers: { "Content-Type": "application/json", Origin: "https://graft.today" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(getConfig).not.toHaveBeenCalled();
    expect(selectModel).not.toHaveBeenCalled();
    expect(streamText).not.toHaveBeenCalled();
  });

  it("returns 400 when messages cannot be converted", async () => {
    convertToModelMessages.mockRejectedValueOnce(new Error("bad messages"));

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        body: JSON.stringify({
          clientId: "client-1",
          messages: [{ role: "user" }],
          sessionId: "session-1",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(createUIMessageStream).not.toHaveBeenCalled();
  });

  it("resolves clientId 'platform' to platform client and persists", async () => {
    authoriseChat.mockResolvedValueOnce({ ok: true, clientId: "platform-client-uuid", isPlatformDemo: true });

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        body: JSON.stringify({
          clientId: "platform",
          messages: [{ id: "u1", parts: [{ text: "Hey", type: "text" }], role: "user" }],
          sessionId: "session-1",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(authoriseChat).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedClientId: "platform",
        token: undefined,
      }),
    );
    expect(createTools).toHaveBeenCalledWith("platform-client-uuid", { bookingEnabled: false });
    expect(saveConversation).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: "platform-client-uuid", sessionId: "session-1" }),
    );
  });

  it("returns 503 when clientId is 'platform' but platform client not configured", async () => {
    authoriseChat.mockResolvedValueOnce({
      ok: false,
      error: "Platform client is not configured",
      reason: "PLATFORM_CLIENT_NOT_CONFIGURED",
      status: 503,
    });

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        body: JSON.stringify({
          clientId: "platform",
          messages: [],
          sessionId: "session-1",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(503);
    expect(getConfig).not.toHaveBeenCalled();
  });

  it("persists serialised messages on successful completion", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        body: JSON.stringify({
          clientId: "client-1",
          messages: [
            {
              id: "user-1",
              parts: [{ text: "Hello there", type: "text" }],
              role: "user",
            },
          ],
          sessionId: "session-1",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(createTools).toHaveBeenCalledWith("client-1", { bookingEnabled: false });
    expect(buildSystemPrompt).toHaveBeenCalledWith(expect.anything(), { bookingEnabled: false });
    expect(saveConversation).toHaveBeenCalledWith({
      clientId: "client-1",
      messages: [
        {
          id: "assistant-1",
          parts: [{ text: "Hello there", type: "text" }],
          role: "assistant",
        },
      ],
      sessionId: "session-1",
    });
    expect(recordAllowedUsage).toHaveBeenCalledWith({
      clientId: "client-1",
      messageCount: 1,
      model: "mock-model",
      sessionId: "session-1",
    });
  });

  it("enables booking tools and prompts when the workspace has the booking add-on", async () => {
    getClientEntitlements.mockResolvedValueOnce({ hasBookingAccess: true });

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        body: JSON.stringify({
          clientId: "client-1",
          messages: [{ id: "u1", parts: [{ text: "Hello!", type: "text" }], role: "user" }],
          sessionId: "session-1",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(createTools).toHaveBeenCalledWith("client-1", { bookingEnabled: true });
    expect(buildSystemPrompt).toHaveBeenCalledWith(expect.anything(), { bookingEnabled: true });
  });
});
