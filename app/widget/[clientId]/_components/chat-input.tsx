"use-client";

import { SentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface ChatInputProps {
  input: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  isLoading: boolean;
  primaryColour: string;
}

export function ChatInput({ input, onChange, onSend, isLoading, primaryColour }: ChatInputProps) {
  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSend(input);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-2 border-t bg-primary border-border px-2 py-2" style={{ backgroundColor: primaryColour }}>
      <input
        type="text"
        value={input}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message"
        disabled={isLoading}
        className="flex-1 rounded-full placeholder:text-white/40 focus-visible:border-cyan-800 shadow-sm shadow-blue-600 focus-visible:shadow-blue-500 focus-visible:shadow-[0_-1px_1px] border-1 border-blue-200 px-3 py-3 text-sm outline-1 outline-blue-400 text-[11px] font-sans tracking-wide focus:ring-2 focus:ring-blue-900 disabled:opacity-50"
        aria-label="Chat message"
        style={{ backgroundColor: `${primaryColour} !important` }}
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
        style={{ backgroundColor: primaryColour }}
        aria-label="Send message"
      >
        <HugeiconsIcon icon={SentIcon} className="size-4" />
      </button>
    </form>
  );
}
