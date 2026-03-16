interface AgentConfigInput {
  agentName: string | null;
  greetingMessage: string | null;
  knowledgeBase: unknown;
  systemPrompt: string;
  calComUsername?: string | null;
  defaultEventSlug?: string | null;
}

export function buildSystemPrompt(config: AgentConfigInput): string {
  const parts: string[] = [];

  parts.push(config.systemPrompt);
  parts.push("");
  parts.push(`You are ${config.agentName ?? "an AI assistant"}.`);

  if (config.greetingMessage) {
    parts.push(`Your greeting message is: "${config.greetingMessage}"`);
  }

  parts.push("");
  parts.push("Important behaviour rules:");
  parts.push("- Use UK English spelling (e.g. colour, organisation, behaviour)");
  parts.push("- Be helpful and professional");
  parts.push(
    "- When checking availability, always assume the user is in the 'Africa/Johannesburg' time zone unless they specify otherwise. If the user mentions load shedding, suggest slots during times that are generally less affected if the client has provided that info, or simply acknowledge the challenge and offer to book a flexible slot.",
  );

  if (config.calComUsername && config.defaultEventSlug) {
    parts.push(
      "- When asked about availability or booking, use checkAvailability directly. Do not search the knowledge base for calendar config.",
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
