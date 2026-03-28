"use client";

import { SendIcon } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border px-3 py-2">
      <input
        type="text"
        value={input}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message"
        disabled={isLoading}
        className="flex-1 rounded-full placeholder:text-white/20 focus-visible:border-indigo-500 focus-visible:shadow-indigo focus-visible:shadow-[0_0px_25px_violet]/60 border border-border bg-background px-3 py-2 text-sm outline-none  focus:ring-1 focus:ring-ring disabled:opacity-50"
        aria-label="Chat message"
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
        style={{ backgroundColor: primaryColour }}
        aria-label="Send message"
      >
        <SendIcon className="size-4" />
      </button>
    </form>
  );
}
