interface AgentConfigInput {
  agentName: string | null;
  greetingMessage: string | null;
  knowledgeBase: unknown;
  systemPrompt: string;
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
