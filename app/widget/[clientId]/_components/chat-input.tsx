"use client";

import { SentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface ChatInputProps {
  input: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  isLoading: boolean;
}

export function ChatInput({ input, onChange, onSend, isLoading }: ChatInputProps) {
  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSend(input);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-2 border-t px-2 py-2"
      style={{
        background: "linear-gradient(180deg, var(--widget-secondary-soft) 0%, var(--widget-secondary) 100%)",
        borderColor: "var(--widget-border)",
      }}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message"
        disabled={isLoading}
        className="flex-1 rounded-full px-3 py-3 text-[11px] font-sans tracking-wide outline-none transition-shadow disabled:opacity-50 placeholder:opacity-40"
        aria-label="Chat message"
        style={{
          backgroundColor: "var(--widget-surface-elevated)",
          color: "var(--widget-on-surface)",
          border: "1px solid var(--widget-border)",
          boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--widget-primary-muted) 35%, transparent)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = "0 0 0 2px var(--widget-focus-ring)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow =
            "inset 0 1px 0 color-mix(in srgb, var(--widget-primary-muted) 35%, transparent)";
        }}
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="flex size-8 shrink-0 items-center justify-center rounded-full transition-opacity disabled:opacity-40"
        style={{
          backgroundColor: "var(--widget-primary)",
          color: "var(--widget-on-primary)",
        }}
        aria-label="Send message"
      >
        <HugeiconsIcon icon={SentIcon} className="size-4" />
      </button>
    </form>
  );
}
