import { describe, expect, it } from "vitest";
import { selectStitchPreset } from "@/lib/engagement/stitch-presets";

describe("selectStitchPreset", () => {
  it("landing builds always use the light GRAFT Kit", () => {
    expect(selectStitchPreset({ buildVariant: "landing" }).key).toBe("graft-kit-clarity");
    expect(selectStitchPreset({ buildVariant: "landing", businessArchetype: "traditional" }).key).toBe(
      "graft-kit-clarity",
    );
    expect(selectStitchPreset({ buildVariant: "landing", businessArchetype: "niche" }).key).toBe("graft-kit-clarity");
  });

  it("campaign dashboards for traditional businesses use Obsidian Scholar (dark)", () => {
    const p = selectStitchPreset({ buildVariant: "campaign", businessArchetype: "traditional" });
    expect(p.key).toBe("obsidian-scholar");
    expect(p.theme).toBe("dark");
  });

  it("campaign dashboards for niche businesses use Coach Vici (dark)", () => {
    const p = selectStitchPreset({ buildVariant: "campaign", businessArchetype: "niche" });
    expect(p.key).toBe("coach-vici");
    expect(p.theme).toBe("dark");
  });

  it("campaign defaults to Coach Vici when archetype is unknown", () => {
    expect(selectStitchPreset({ buildVariant: "campaign" }).key).toBe("coach-vici");
  });
});
