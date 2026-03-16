import { describe, expect, it } from "vitest";
import { normalizeFirecrawlResponse } from "@/lib/scraper/normalize-firecrawl-response";

describe("normalizeFirecrawlResponse", () => {
  it("maps domain-specific keys to canonical shape", () => {
    const raw = {
      stratcol_co_za_chatbot: false,
      stratcol_co_za_chatbot_citation: "https://stratcol.co.za/",
      stratcol_co_za_voice_agent: false,
      stratcol_co_za_voice_agent_citation: "https://stratcol.co.za/",
      stratcol_co_za_core_services: [
        {
          service_name: "Ordinary Debit Orders",
          service_name_citation: "https://stratcol.co.za/debit-orders/",
          service_description: "Enables clients to set customised transaction dates.",
          service_description_citation: "https://stratcol.co.za/debit-orders/",
        },
        {
          service_name: "DebiCheck",
          service_description: "An electronically authorised debit-order mandate.",
        },
      ],
    };

    const result = normalizeFirecrawlResponse(raw);

    expect(result).toEqual({
      hasChatbot: false,
      hasVoiceAgent: false,
      coreServices: [
        {
          service_name: "Ordinary Debit Orders",
          service_description: "Enables clients to set customised transaction dates.",
        },
        { service_name: "DebiCheck", service_description: "An electronically authorised debit-order mandate." },
      ],
    });
  });

  it("returns false for hasChatbot/hasVoiceAgent when keys not found", () => {
    const result = normalizeFirecrawlResponse({});
    expect(result.hasChatbot).toBe(false);
    expect(result.hasVoiceAgent).toBe(false);
    expect(result.coreServices).toEqual([]);
  });

  it("returns true when chatbot/voice_agent are true", () => {
    const raw = {
      example_com_chatbot: true,
      example_com_voice_agent: true,
      example_com_core_services: [],
    };
    const result = normalizeFirecrawlResponse(raw);
    expect(result.hasChatbot).toBe(true);
    expect(result.hasVoiceAgent).toBe(true);
  });

  it("ignores citation keys when resolving boolean values", () => {
    const raw = {
      foo_chatbot: true,
      foo_chatbot_citation: "https://example.com",
    };
    const result = normalizeFirecrawlResponse(raw);
    expect(result.hasChatbot).toBe(true);
  });

  it("handles non-object input gracefully", () => {
    const result = normalizeFirecrawlResponse(null);
    expect(result).toEqual({
      hasChatbot: false,
      hasVoiceAgent: false,
      coreServices: [],
    });
  });
});
