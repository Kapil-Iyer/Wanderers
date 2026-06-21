/**
 * CATEGORY THEMES — per-category warm gradient tuning for bubble poster cards.
 * Every theme is anchored in orange so the brand "warm fire in the dark" stays
 * coherent, but each category gets its own character via the gradient endpoint.
 */

export type CategoryTheme = {
  from: string;
  to: string;
  accent: string;
  tint: string; // low-alpha wash for the card body
};

const themes: Record<string, CategoryTheme> = {
  Sports:   { from: "#F97316", to: "#EF4444", accent: "#FB923C", tint: "rgba(249,115,22,0.10)" },
  Study:    { from: "#FBBF24", to: "#F59E0B", accent: "#FBBF24", tint: "rgba(251,191,36,0.09)" },
  Gaming:   { from: "#F97316", to: "#DB2777", accent: "#FB7185", tint: "rgba(219,39,119,0.08)" },
  Casual:   { from: "#FB923C", to: "#FBBF24", accent: "#FDBA74", tint: "rgba(251,146,60,0.09)" },
  Music:    { from: "#F97316", to: "#EC4899", accent: "#F9A8D4", tint: "rgba(236,72,153,0.08)" },
  Outdoors: { from: "#F59E0B", to: "#84CC16", accent: "#FCD34D", tint: "rgba(132,204,22,0.07)" },
  default:  { from: "#F97316", to: "#FBBF24", accent: "#FB923C", tint: "rgba(249,115,22,0.09)" },
};

export function getCategoryTheme(category?: string): CategoryTheme {
  if (!category) return themes.default;
  return themes[category] ?? themes.default;
}
