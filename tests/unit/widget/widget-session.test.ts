import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  chatStorageKey,
  clearWidgetSession,
  generateSessionId,
  loadMessagesFromStorage,
  persistMessagesToStorage,
  readOrCreateSessionId,
  sessionStorageKey,
} from "@/app/widget/[clientId]/_components/widget-session";

describe("widget-session helpers", () => {
  const clientId = "client-abc";

  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("builds stable storage keys per client", () => {
    expect(sessionStorageKey(clientId)).toBe("graft-today-session-client-abc");
    expect(chatStorageKey(clientId)).toBe("graft-today-chat-client-abc");
  });

  it("generateSessionId returns graft-today prefixed unique ids", () => {
    const a = generateSessionId();
    const b = generateSessionId();
    expect(a).toMatch(/^graft-today-\d+-[0-9a-f-]{36}$/i);
    expect(b).toMatch(/^graft-today-\d+-[0-9a-f-]{36}$/i);
    expect(a).not.toBe(b);
  });

  it("readOrCreateSessionId creates and stores a session when missing", () => {
    const id = readOrCreateSessionId(clientId);
    expect(id).toMatch(/^graft-today-/);
    expect(sessionStorage.getItem(sessionStorageKey(clientId))).toBe(id);
  });

  it("readOrCreateSessionId resumes an existing session", () => {
    sessionStorage.setItem(sessionStorageKey(clientId), "existing-session");
    expect(readOrCreateSessionId(clientId)).toBe("existing-session");
  });

  it("clearWidgetSession removes session and message keys", () => {
    sessionStorage.setItem(sessionStorageKey(clientId), "session-1");
    sessionStorage.setItem(chatStorageKey(clientId), JSON.stringify([{ id: "1" }]));

    clearWidgetSession(clientId);

    expect(sessionStorage.getItem(sessionStorageKey(clientId))).toBeNull();
    expect(sessionStorage.getItem(chatStorageKey(clientId))).toBeNull();
  });

  it("persistMessagesToStorage and loadMessagesFromStorage round-trip", () => {
    const messages = [
      {
        id: "m1",
        role: "user" as const,
        parts: [{ type: "text" as const, text: "hello" }],
      },
    ];

    persistMessagesToStorage(clientId, messages);
    expect(loadMessagesFromStorage(clientId)).toEqual(messages);
  });

  it("loadMessagesFromStorage returns [] for invalid JSON", () => {
    sessionStorage.setItem(chatStorageKey(clientId), "{not-json");
    expect(loadMessagesFromStorage(clientId)).toEqual([]);
  });

  it("persistMessagesToStorage skips empty message arrays", () => {
    persistMessagesToStorage(clientId, []);
    expect(sessionStorage.getItem(chatStorageKey(clientId))).toBeNull();
  });
});
