import { describe, expect, it } from "vitest";

import { slugFromCompanyName } from "@/lib/engagement/company-slug";

describe("slugFromCompanyName", () => {
  it("normalizes like jules-builder prospect paths", () => {
    expect(slugFromCompanyName("Virgin Active — Stellenbosch")).toBe("virgin-active-stellenbosch");
    expect(slugFromCompanyName("The Wes Bistro & Bar")).toBe("the-wes-bistro-bar");
  });

  it("removes leading and trailing non-alphanumeric characters", () => {
    expect(slugFromCompanyName("!@#Apple!@#")).toBe("apple");
    expect(slugFromCompanyName("  Spaces  ")).toBe("spaces");
  });

  it("handles empty strings", () => {
    expect(slugFromCompanyName("")).toBe("");
  });

  it("preserves numbers and replaces consecutive non-alphanumerics with a single dash", () => {
    expect(slugFromCompanyName("Company 123")).toBe("company-123");
    expect(slugFromCompanyName("a   b")).toBe("a-b");
    expect(slugFromCompanyName("a@#$b")).toBe("a-b");
  });

  it("truncates to 40 chars", () => {
    const long = "A".repeat(100);
    expect(slugFromCompanyName(long).length).toBe(40);
  });
});
