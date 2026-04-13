import { describe, it, expect, vi } from "vitest";
import { generateDesignConcepts } from "@/lib/services/stitch-mcp.service";

// Mock the MCP client — we test our wrapper logic, not Stitch itself
vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    callTool: vi.fn().mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify([
            {
              index: 0,
              name: "Clean Professional",
              description: "White background, blue accents",
              colorScheme: { primary: "#2563eb", background: "#ffffff", text: "#111827" },
              components: ["BookingForm", "CalendarPicker"],
              styleKeywords: ["clean", "professional", "trust"],
            },
            {
              index: 1,
              name: "Dark Dashboard",
              description: "Dark mode with purple accents",
              colorScheme: { primary: "#7c3aed", background: "#0f172a", text: "#f8fafc" },
              components: ["BookingForm", "CalendarPicker", "Dashboard"],
              styleKeywords: ["modern", "dark", "premium"],
            },
            {
              index: 2,
              name: "Warm Tradesperson",
              description: "Orange and grey, approachable",
              colorScheme: { primary: "#f97316", background: "#f9fafb", text: "#1f2937" },
              components: ["BookingForm", "QuoteCalculator"],
              styleKeywords: ["friendly", "warm", "approachable"],
            },
          ]),
        },
      ],
    }),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => ({
  StreamableHTTPClientTransport: vi.fn().mockImplementation(() => ({})),
}));

describe("generateDesignConcepts", () => {
  it("returns 3 design concepts", async () => {
    const concepts = await generateDesignConcepts({
      productName: "Acme Plumbing Booking Portal",
      description: "Online booking for plumbing services",
      styleHint: "Professional, trustworthy",
      components: ["BookingForm", "Dashboard"],
    });
    expect(concepts).toHaveLength(3);
    expect(concepts[0].name).toBeTruthy();
    expect(concepts[0].colorScheme.primary).toMatch(/^#/);
  });
});
