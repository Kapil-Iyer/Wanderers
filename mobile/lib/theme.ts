/**
 * Central design tokens - JS-level values for LinearGradient/shadowColor/SVG
 * fills (APIs tailwind.config.js's className colors can't express). Sourced
 * from the web app's src/app/globals.css :root tokens and the actual shipped
 * component styles (not the mostly-unused shadcn primitives) - see the
 * design-pass plan for the full trace.
 */

export const colors = {
  bg: "#0B0710",
  textPrimary: "#FAFAFA",
  textSecondary: "#A5A5B8",
  textMuted: "#55556B",

  accentStart: "#FF5A36",
  accentMid: "#E0339E",
  accentEnd: "#8B5CF6",

  cardGlassBg: "rgba(10,9,8,0.72)",
  cardBorder: "rgba(255,255,255,0.07)",

  inputBg: "rgba(255,255,255,0.04)",
  inputBorder: "rgba(255,255,255,0.08)",
  inputBorderFocus: "rgba(224,51,158,0.55)",

  border: "rgba(224,51,158,0.14)",
} as const;

export const radii = {
  card: 16,
  pill: 999,
} as const;

export const gradients = {
  primaryButton: [colors.accentEnd, colors.accentMid] as const,
  aurora: [colors.accentMid, colors.accentEnd, colors.accentStart] as const,
};

export const glow = {
  shadowColor: colors.accentEnd,
  shadowOpacity: 0.4,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
} as const;
