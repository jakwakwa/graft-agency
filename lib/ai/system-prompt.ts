interface AgentConfigInput {
  agentName: string | null;
  greetingMessage: string | null;
  knowledgeBase: unknown;
  systemPrompt: string;
  calComUsername?: string | null;
  defaultEventSlug?: string | null;
}

export interface SystemPromptOptions {
  /** Gated by the Booking Integration add-on — see createTools. */
  bookingEnabled: boolean;
}

export function buildSystemPrompt(config: AgentConfigInput, options: SystemPromptOptions): string {
  const parts: string[] = [];

  parts.push(config.systemPrompt);
  parts.push("");
  parts.push(`You are ${config.agentName ?? "an AI assistant"}.`);

  if (config.greetingMessage) {
    parts.push(`Your greeting message is: "${config.greetingMessage}"`);
  }

  parts.push("");
  parts.push("Important behaviour rules:");
  parts.push("- Be helpful and professional");

  if (options.bookingEnabled) {
    parts.push(
      "- When checking availability, always assume the user is in the 'Africa/Johannesburg' time zone unless they specify otherwise. If the user mentions load shedding, suggest slots during times that are generally less affected if the client has provided that info, or simply acknowledge the challenge and offer to book a flexible slot.",
    );

    if (config.calComUsername && config.defaultEventSlug) {
      parts.push(
        "- When asked about availability or booking, use checkAvailability directly. Do not search the knowledge base for calendar config.",
      );
    }
  } else {
    parts.push(
      "- You cannot book meetings, appointments, or calls, and you cannot check calendar availability — never offer to do so. If a visitor wants to speak to someone, schedule anything, or asks for a callback, ask for their name and an email address or phone number, capture it with captureLeadDetails, and reassure them that a staff member will get back to them shortly.",
    );
  }

  if (config.knowledgeBase && Array.isArray(config.knowledgeBase) && config.knowledgeBase.length > 0) {
    parts.push("");
    parts.push("## Knowledge Base");
    parts.push("");
    for (const entry of config.knowledgeBase) {
      if (entry.question && entry.answer) {
        parts.push(`Q: ${entry.question}`);
        parts.push(`A: ${entry.answer}`);
        parts.push("");
      }
    }
  }

  return parts.join("\n");
}
