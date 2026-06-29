import { describe, expect, it } from "vitest";
import { selectStitchPreset } from "@/lib/engagement/stitch-presets";

describe("selectStitchPreset", () => {
  it("landing builds always use the light GRAFT Kit", () => {
    expect(selectStitchPreset({ buildVariant: "landing" }).key).toBe("graft-kit");
    expect(selectStitchPreset({ buildVariant: "landing", businessArchetype: "traditional" }).key).toBe("graft-kit");
    expect(selectStitchPreset({ buildVariant: "landing", businessArchetype: "niche" }).key).toBe("graft-kit");
  });

  it("campaign dashboards for traditional businesses use Obsidian Scholar (dark)", () => {
    const p = selectStitchPreset({ buildVariant: "campaign", businessArchetype: "traditional" });
    expect(p.key).toBe("obsidian-scholar");
    expect(p.theme).toBe("dark");
  });

  it("campaign dashboards for niche businesses use Obsidian Precision (dark)", () => {
    const p = selectStitchPreset({ buildVariant: "campaign", businessArchetype: "niche" });
    expect(p.key).toBe("obsidian-precision");
    expect(p.theme).toBe("dark");
  });

  it("campaign defaults to Obsidian Precision when archetype is unknown", () => {
    expect(selectStitchPreset({ buildVariant: "campaign" }).key).toBe("obsidian-precision");
  });
});
