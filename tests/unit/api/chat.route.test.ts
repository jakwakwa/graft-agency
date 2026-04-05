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

vi.mock("@/lib/services/agent.service", () => ({
  agentService: {
    getConfig,
  },
}));

vi.mock("@/lib/services/conversation.service", () => ({
  conversationService: {
    save: saveConversation,
  },
}));

const getPlatformClientId = vi.fn();
vi.mock("@/lib/auth/resolve-client", () => ({
  getPlatformClientId,
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
    expect(getConfig).not.toHaveBeenCalled();
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
    getPlatformClientId.mockResolvedValue("platform-client-uuid");

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        body: JSON.stringify({
          clientId: "platform",
          messages: [{ id: "u1", parts: [{ text: "Hi", type: "text" }], role: "user" }],
          sessionId: "session-1",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(getPlatformClientId).toHaveBeenCalled();
    expect(createTools).toHaveBeenCalledWith("platform-client-uuid");
    expect(saveConversation).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: "platform-client-uuid", sessionId: "session-1" }),
    );
  });

  it("returns 503 when clientId is 'platform' but platform client not configured", async () => {
    getPlatformClientId.mockResolvedValue(null);

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
    expect(createTools).toHaveBeenCalledWith("client-1");
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
  });
});
