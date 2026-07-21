import { describe, expect, it } from "vitest";
import {
  buildWidgetTheme,
  contrastInk,
  deriveSecondaryFromPrimary,
  mixHex,
  normaliseHex,
  widgetThemeToCssVars,
} from "@/lib/utils/widget-theme";

describe("widget-theme", () => {
  it("normalises valid hex and falls back otherwise", () => {
    expect(normaliseHex("#abc123", "#000000")).toBe("#ABC123");
    expect(normaliseHex("nope", "#7c3aed")).toBe("#7C3AED");
  });

  it("mixes colours toward a target", () => {
    expect(mixHex("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    expect(mixHex("#FF0000", "#0000FF", 0)).toBe("#FF0000");
  });

  it("picks contrasting ink for light and dark backgrounds", () => {
    expect(contrastInk("#FFFFFF")).toBe("#14120F");
    expect(contrastInk("#111111")).toBe("#F7F4EF");
  });

  it("derives a secondary companion when none is set", () => {
    const derived = deriveSecondaryFromPrimary("#7C3AED");
    expect(derived).toMatch(/^#[0-9A-F]{6}$/);
    expect(derived).not.toBe("#7C3AED");
  });

  it("builds a multi-tone palette from primary + secondary", () => {
    const theme = buildWidgetTheme("#7C3AED", "#1E1B4B");
    expect(theme.primary).toBe("#7C3AED");
    expect(theme.secondary).toBe("#1E1B4B");
    expect(theme.primarySoft).not.toBe(theme.primary);
    expect(theme.primaryDeep).not.toBe(theme.primary);
    expect(theme.secondarySoft).not.toBe(theme.secondary);
    expect(theme.surface).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("exports CSS variables for the widget root", () => {
    const vars = widgetThemeToCssVars(buildWidgetTheme("#E49B57", "#2A2118"));
    expect(vars["--widget-primary"]).toBe("#E49B57");
    expect(vars["--widget-secondary"]).toBe("#2A2118");
    expect(vars["--widget-primary-soft"]).toBeTruthy();
    expect(vars["--widget-focus-ring"]).toBeTruthy();
  });
});
