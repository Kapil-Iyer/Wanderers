/**
 * CATEGORY THEMES - per-category gradient tuning for bubble poster cards.
 * Every theme is anchored in emerald (Digital Dusk) so the brand stays
 * coherent, but each category gets its own character via the gradient endpoint.
 */

export type CategoryTheme = {
  from: string;
  to: string;
  accent: string;
  tint: string; // low-alpha wash for the card body
};

const themes: Record<string, CategoryTheme> = {
  Sports:   { from: "#ff7a1a", to: "#EF4444", accent: "#ff8a3d", tint: "rgba(255,122,26,0.10)" },
  Study:    { from: "#ffb56b", to: "#F59E0B", accent: "#ffb56b", tint: "rgba(255,181,107,0.09)" },
  Gaming:   { from: "#ff7a1a", to: "#DB2777", accent: "#FB7185", tint: "rgba(219,39,119,0.08)" },
  Casual:   { from: "#ff8a3d", to: "#ffb56b", accent: "#FDBA74", tint: "rgba(255,138,61,0.09)" },
  Music:    { from: "#ff7a1a", to: "#EC4899", accent: "#F9A8D4", tint: "rgba(236,72,153,0.08)" },
  Outdoors: { from: "#16A34A", to: "#84CC16", accent: "#A3E635", tint: "rgba(132,204,22,0.07)" },
  default:  { from: "#ff7a1a", to: "#ffb56b", accent: "#ff8a3d", tint: "rgba(255,122,26,0.09)" },
};

export function getCategoryTheme(category?: string): CategoryTheme {
  if (!category) return themes.default;
  return themes[category] ?? themes.default;
}
