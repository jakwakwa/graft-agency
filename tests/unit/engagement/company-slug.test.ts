import { describe, expect, it } from "vitest";

import { slugFromCompanyName } from "@/lib/engagement/company-slug";

describe("slugFromCompanyName", () => {
  it("normalizes like jules-builder prospect paths", () => {
    expect(slugFromCompanyName("Virgin Active — Stellenbosch")).toBe("virgin-active-stellenbosch");
    expect(slugFromCompanyName("The Wes Bistro & Bar")).toBe("the-wes-bistro-bar");
  });

  it("truncates to 40 chars", () => {
    const long = "A".repeat(100);
    expect(slugFromCompanyName(long).length).toBe(40);
  });
});
