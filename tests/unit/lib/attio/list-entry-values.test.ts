import { describe, expect, it } from "vitest";
import {
  deriveLeadTypeLabel,
  formatCreatedByLabel,
  mapLeadSourceToProspectSource,
} from "@/lib/attio/list-entry-values";

describe("mapLeadSourceToProspectSource", () => {
  it("maps inbound and outbound", () => {
    expect(mapLeadSourceToProspectSource("INBOUND")).toBe("inbound");
    expect(mapLeadSourceToProspectSource("OUTBOUND_PROSPECT")).toBe("outbound");
  });
});

describe("deriveLeadTypeLabel", () => {
  it("prefers industry when present", () => {
    expect(deriveLeadTypeLabel({ industry: "  Plumbing  " })).toBe("Plumbing");
  });

  it("uses first core service name when industry absent", () => {
    expect(
      deriveLeadTypeLabel({
        coreServices: [{ service_name: "Drainage", service_description: "" }],
      }),
    ).toBe("Drainage");
    expect(deriveLeadTypeLabel({ coreServices: [{ name: "Retail", description: "" }] })).toBe("Retail");
  });

  it("falls back to truncated business description", () => {
    const long = "x".repeat(130);
    const out = deriveLeadTypeLabel({ businessDescription: long });
    expect(out).toHaveLength(120);
    expect(out?.endsWith("...")).toBe(true);
  });
});

describe("formatCreatedByLabel", () => {
  it("prefers full name then first+last then username then email", () => {
    expect(formatCreatedByLabel({ fullName: "Jane Doe" })).toBe("Jane Doe");
    expect(formatCreatedByLabel({ firstName: "Jane", lastName: "Doe" })).toBe("Jane Doe");
    expect(formatCreatedByLabel({ username: "jdoe" })).toBe("jdoe");
    expect(formatCreatedByLabel({ primaryEmail: "j@example.com" })).toBe("j@example.com");
    expect(formatCreatedByLabel({})).toBe("Unknown user");
  });
});
