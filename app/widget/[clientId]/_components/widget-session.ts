import type { UIMessage } from "ai";

export function sessionStorageKey(clientId: string): string {
  return `graft-today-session-${clientId}`;
}

export function chatStorageKey(clientId: string): string {
  return `graft-today-chat-${clientId}`;
}

export function generateSessionId(): string {
  return `graft-today-${Date.now()}-${crypto.randomUUID()}`;
}

export function readOrCreateSessionId(clientId: string): string {
  if (typeof window === "undefined") return generateSessionId();

  const stored = sessionStorage.getItem(sessionStorageKey(clientId));
  if (stored) return stored;

  const id = generateSessionId();
  sessionStorage.setItem(sessionStorageKey(clientId), id);
  return id;
}

export function clearWidgetSession(clientId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(sessionStorageKey(clientId));
  sessionStorage.removeItem(chatStorageKey(clientId));
}

export function loadMessagesFromStorage(clientId: string): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = sessionStorage.getItem(chatStorageKey(clientId));
    if (!stored) return [];
    return JSON.parse(stored) as UIMessage[];
  } catch {
    return [];
  }
}

export function persistMessagesToStorage(clientId: string, messages: UIMessage[]): void {
  if (typeof window === "undefined" || messages.length === 0) return;
  sessionStorage.setItem(chatStorageKey(clientId), JSON.stringify(messages));
}
