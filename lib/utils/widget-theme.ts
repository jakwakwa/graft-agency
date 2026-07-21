/**
 * Builds a multi-tone widget palette from brand primary + secondary colours.
 * Shades are derived by mixing toward white/black and cross-mixing the two brands.
 */

export type WidgetThemeTokens = {
  primary: string;
  primarySoft: string;
  primaryMuted: string;
  primaryDeep: string;
  secondary: string;
  secondarySoft: string;
  secondaryDeep: string;
  surface: string;
  surfaceElevated: string;
  onPrimary: string;
  onSecondary: string;
  onSurface: string;
  border: string;
  focusRing: string;
};

const HEX_RE = /^#([0-9A-Fa-f]{6})$/;

export function normaliseHex(input: string | null | undefined, fallback: string): string {
  const raw = input?.trim() ?? "";
  if (HEX_RE.test(raw)) return raw.toUpperCase();
  if (HEX_RE.test(fallback)) return fallback.toUpperCase();
  return "#7C3AED";
}

/** When secondary is unset, derive a deeper companion from primary. */
export function deriveSecondaryFromPrimary(primary: string): string {
  return mixHex(primary, "#0A0A0A", 0.42);
}

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const to = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

/** Mix `from` toward `to` by `amount` (0 = from, 1 = to). */
export function mixHex(from: string, to: string, amount: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const t = Math.min(1, Math.max(0, amount));
  return rgbToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastInk(background: string): string {
  return relativeLuminance(background) > 0.45 ? "#14120F" : "#F7F4EF";
}

export function buildWidgetTheme(
  primaryInput: string | null | undefined,
  secondaryInput: string | null | undefined,
  defaults: { primary: string; secondary: string } = { primary: "#7C3AED", secondary: "#1E1B4B" },
): WidgetThemeTokens {
  const primary = normaliseHex(primaryInput, defaults.primary);
  const secondary = secondaryInput?.trim()
    ? normaliseHex(secondaryInput, defaults.secondary)
    : deriveSecondaryFromPrimary(primary);

  const primarySoft = mixHex(primary, "#FFFFFF", 0.28);
  const primaryMuted = mixHex(primary, "#FFFFFF", 0.55);
  const primaryDeep = mixHex(primary, "#000000", 0.28);
  const secondarySoft = mixHex(secondary, "#FFFFFF", 0.22);
  const secondaryDeep = mixHex(secondary, "#000000", 0.35);
  // Surface: secondary base lightly lifted, then nudged toward primary for cohesion
  const surface = mixHex(mixHex(secondary, "#0C0C0C", 0.55), primary, 0.08);
  const surfaceElevated = mixHex(surface, "#FFFFFF", 0.08);
  const border = mixHex(secondarySoft, "#FFFFFF", 0.12);

  return {
    primary,
    primarySoft,
    primaryMuted,
    primaryDeep,
    secondary,
    secondarySoft,
    secondaryDeep,
    surface,
    surfaceElevated,
    onPrimary: contrastInk(primary),
    onSecondary: contrastInk(secondary),
    onSurface: contrastInk(surface),
    border,
    focusRing: mixHex(primary, "#FFFFFF", 0.35),
  };
}

/** CSS custom properties for the widget root. */
export function widgetThemeToCssVars(theme: WidgetThemeTokens): Record<string, string> {
  return {
    "--widget-primary": theme.primary,
    "--widget-primary-soft": theme.primarySoft,
    "--widget-primary-muted": theme.primaryMuted,
    "--widget-primary-deep": theme.primaryDeep,
    "--widget-secondary": theme.secondary,
    "--widget-secondary-soft": theme.secondarySoft,
    "--widget-secondary-deep": theme.secondaryDeep,
    "--widget-surface": theme.surface,
    "--widget-surface-elevated": theme.surfaceElevated,
    "--widget-on-primary": theme.onPrimary,
    "--widget-on-secondary": theme.onSecondary,
    "--widget-on-surface": theme.onSurface,
    "--widget-border": theme.border,
    "--widget-focus-ring": theme.focusRing,
  };
}
