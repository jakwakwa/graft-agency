import { describe, expect, it } from "vitest";
import { shouldShowLandingChat } from "@/components/marketing/landing-chat-launcher";

describe("shouldShowLandingChat", () => {
  it("returns false when platform client id is missing or blank", () => {
    expect(shouldShowLandingChat(null)).toBe(false);
    expect(shouldShowLandingChat(undefined)).toBe(false);
    expect(shouldShowLandingChat("")).toBe(false);
    expect(shouldShowLandingChat("   ")).toBe(false);
  });

  it("returns true when platform client id is present", () => {
    expect(shouldShowLandingChat("cl_abc123")).toBe(true);
  });
});
