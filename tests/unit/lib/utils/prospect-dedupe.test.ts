import { describe, expect, it } from "vitest";
import {
  normalizeProspectCompanyName,
  normalizeProspectWebsiteUrl,
  prospectIdentityKeys,
  scrapedDataWebsiteUrl,
} from "@/lib/utils/prospect-dedupe";

describe("normalizeProspectCompanyName", () => {
  it("lowercases the name", () => {
    expect(normalizeProspectCompanyName("Acme Corp")).toBe("acme corp");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeProspectCompanyName("  Acme Corp  ")).toBe("acme corp");
  });

  it("collapses multiple internal spaces to a single space", () => {
    expect(normalizeProspectCompanyName("Acme   Corp")).toBe("acme corp");
  });

  it("collapses tabs and newlines to a single space", () => {
    expect(normalizeProspectCompanyName("Acme\t\nCorp")).toBe("acme corp");
  });

  it("returns empty string when given empty string", () => {
    expect(normalizeProspectCompanyName("")).toBe("");
  });

  it("returns a single space when given only whitespace (trim then collapse)", () => {
    // trim removes outer whitespace → empty string; collapse of empty string is empty
    expect(normalizeProspectCompanyName("   ")).toBe("");
  });

  it("handles already-normalised input unchanged", () => {
    expect(normalizeProspectCompanyName("acme corp")).toBe("acme corp");
  });

  it("preserves punctuation within the name", () => {
    expect(normalizeProspectCompanyName("Smith & Jones, Ltd.")).toBe("smith & jones, ltd.");
  });
});

describe("normalizeProspectWebsiteUrl", () => {
  it("returns empty string for empty input", () => {
    expect(normalizeProspectWebsiteUrl("")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeProspectWebsiteUrl("   ")).toBe("");
  });

  it("strips www. prefix from full URL", () => {
    expect(normalizeProspectWebsiteUrl("https://www.example.com")).toBe("example.com");
  });

  it("strips WWW. prefix case-insensitively", () => {
    expect(normalizeProspectWebsiteUrl("https://WWW.Example.com")).toBe("example.com");
  });

  it("lowercases the host", () => {
    expect(normalizeProspectWebsiteUrl("https://Example.COM")).toBe("example.com");
  });

  it("adds https:// when no protocol is present and parses correctly", () => {
    expect(normalizeProspectWebsiteUrl("example.com")).toBe("example.com");
  });

  it("strips trailing slash from root URL", () => {
    expect(normalizeProspectWebsiteUrl("https://example.com/")).toBe("example.com");
  });

  it("preserves path when present", () => {
    expect(normalizeProspectWebsiteUrl("https://example.com/about")).toBe("example.com/about");
  });

  it("strips trailing slash from path", () => {
    expect(normalizeProspectWebsiteUrl("https://example.com/about/")).toBe("example.com/about");
  });

  it("preserves multi-segment path", () => {
    expect(normalizeProspectWebsiteUrl("https://www.example.com/blog/post-1")).toBe(
      "example.com/blog/post-1"
    );
  });

  it("handles http:// protocol", () => {
    expect(normalizeProspectWebsiteUrl("http://www.example.com")).toBe("example.com");
  });

  it("handles bare hostname with path (no protocol)", () => {
    expect(normalizeProspectWebsiteUrl("example.com/pricing")).toBe("example.com/pricing");
  });

  it("trims whitespace before parsing", () => {
    expect(normalizeProspectWebsiteUrl("  https://example.com  ")).toBe("example.com");
  });

  it("falls back gracefully for unparseable input without a protocol", () => {
    // The fallback lowercases and strips common prefixes
    const result = normalizeProspectWebsiteUrl("NOT A VALID URL !!##");
    expect(result).toBe("not a valid url !!##");
  });

  it("falls back and strips http:// from malformed URL", () => {
    // URL constructor throws; fallback regex strips the scheme
    const result = normalizeProspectWebsiteUrl("http://[invalid");
    expect(typeof result).toBe("string");
    expect(result.startsWith("http://")).toBe(false);
  });
});

describe("scrapedDataWebsiteUrl", () => {
  it("returns websiteUrl string when present and non-empty", () => {
    expect(scrapedDataWebsiteUrl({ websiteUrl: "https://example.com" })).toBe("https://example.com");
  });

  it("returns null when websiteUrl is an empty string", () => {
    expect(scrapedDataWebsiteUrl({ websiteUrl: "" })).toBeNull();
  });

  it("returns null when websiteUrl is whitespace-only", () => {
    expect(scrapedDataWebsiteUrl({ websiteUrl: "   " })).toBeNull();
  });

  it("returns null when websiteUrl is not a string", () => {
    expect(scrapedDataWebsiteUrl({ websiteUrl: 42 })).toBeNull();
  });

  it("returns null when websiteUrl key is absent", () => {
    expect(scrapedDataWebsiteUrl({ other: "value" })).toBeNull();
  });

  it("returns null for null input", () => {
    expect(scrapedDataWebsiteUrl(null)).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(scrapedDataWebsiteUrl("string")).toBeNull();
  });
});

describe("prospectIdentityKeys", () => {
  it("returns normalised nameKey and urlKey", () => {
    const result = prospectIdentityKeys("  Acme Corp  ", "https://www.acme.com/");
    expect(result).toEqual({ nameKey: "acme corp", urlKey: "acme.com" });
  });

  it("returns empty strings for empty inputs", () => {
    const result = prospectIdentityKeys("", "");
    expect(result).toEqual({ nameKey: "", urlKey: "" });
  });
});
