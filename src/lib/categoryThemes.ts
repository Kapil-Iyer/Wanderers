/**
 * CATEGORY THEMES - per-category gradient tuning for bubble poster cards.
 * Every theme is anchored in the Campus Aurora violet/cyan brand so it stays
 * coherent, but each category gets its own character via the gradient endpoint.
 */

export type CategoryTheme = {
  from: string;
  to: string;
  accent: string;
  tint: string; // low-alpha wash for the card body
};

const themes: Record<string, CategoryTheme> = {
  Sports:   { from: "#8b5cf6", to: "#6366f1", accent: "#a78bfa", tint: "rgba(139,92,246,0.10)" },
  Study:    { from: "#22d3ee", to: "#6366f1", accent: "#67e8f9", tint: "rgba(34,211,238,0.09)" },
  Gaming:   { from: "#d946ef", to: "#8b5cf6", accent: "#e879f9", tint: "rgba(217,70,239,0.08)" },
  Casual:   { from: "#a78bfa", to: "#22d3ee", accent: "#c4b5fd", tint: "rgba(167,139,250,0.09)" },
  Music:    { from: "#ec4899", to: "#8b5cf6", accent: "#f9a8d4", tint: "rgba(236,72,153,0.08)" },
  Outdoors: { from: "#22d3ee", to: "#10b981", accent: "#6ee7b7", tint: "rgba(16,185,129,0.07)" },
  default:  { from: "#8b5cf6", to: "#22d3ee", accent: "#a78bfa", tint: "rgba(139,92,246,0.09)" },
};

export function getCategoryTheme(category?: string): CategoryTheme {
  if (!category) return themes.default;
  return themes[category] ?? themes.default;
}
