export type CategoryFilterId = "all" | "sports" | "study" | "gaming" | "food" | "music" | "social";

export const CATEGORY_FILTERS: { id: CategoryFilterId; label: string; emoji?: string }[] = [
  { id: "all", label: "All" },
  { id: "sports", label: "Sports", emoji: "🏀" },
  { id: "study", label: "Study", emoji: "📚" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "food", label: "Food", emoji: "🍕" },
  { id: "music", label: "Music", emoji: "🎵" },
];

export type CategoryTheme = {
  gradientFrom: string;
  gradientTo: string;
  border: string;
  glow: string;
};

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  Sports: { gradientFrom: "#ea580c", gradientTo: "#9a3412", border: "#fb923c", glow: "rgba(249,115,22,0.45)" },
  Fitness: { gradientFrom: "#ea580c", gradientTo: "#9a3412", border: "#fb923c", glow: "rgba(249,115,22,0.45)" },
  Study: { gradientFrom: "#2563eb", gradientTo: "#1e3a8a", border: "#60a5fa", glow: "rgba(59,130,246,0.45)" },
  Gaming: { gradientFrom: "#7c3aed", gradientTo: "#4c1d95", border: "#a78bfa", glow: "rgba(124,58,237,0.45)" },
  Food: { gradientFrom: "#dc2626", gradientTo: "#7f1d1d", border: "#f87171", glow: "rgba(220,38,38,0.45)" },
  Casual: { gradientFrom: "#0891b2", gradientTo: "#164e63", border: "#22d3ee", glow: "rgba(8,145,178,0.45)" },
  Social: { gradientFrom: "#9333ea", gradientTo: "#581c87", border: "#c084fc", glow: "rgba(147,51,234,0.45)" },
  Music: { gradientFrom: "#db2777", gradientTo: "#831843", border: "#f472b6", glow: "rgba(219,39,119,0.45)" },
};

const DEFAULT_THEME = CATEGORY_THEMES.Social;

export function getCategoryTheme(category: string): CategoryTheme {
  return CATEGORY_THEMES[category] ?? DEFAULT_THEME;
}

/** Category color for filter pills */
export function getFilterTheme(filterId: CategoryFilterId): CategoryTheme {
  switch (filterId) {
    case "sports":
      return CATEGORY_THEMES.Sports;
    case "study":
      return CATEGORY_THEMES.Study;
    case "gaming":
      return CATEGORY_THEMES.Gaming;
    case "food":
      return CATEGORY_THEMES.Food;
    case "music":
      return CATEGORY_THEMES.Music;
    case "social":
      return CATEGORY_THEMES.Social;
    default:
      return { gradientFrom: "#374151", gradientTo: "#1f2937", border: "#9ca3af", glow: "rgba(156,163,175,0.35)" };
  }
}

export function inferCategory(activity: string): string {
  const a = (activity || "").toLowerCase();
  if (a.includes("soccer") || a.includes("football") || a.includes("futsal")) return "Sports";
  if (a.includes("basketball") || a.includes("sport") || a.includes("run") || a.includes("fitness")) return "Sports";
  if (a.includes("study") || a.includes("leetcode") || a.includes("library")) return "Study";
  if (a.includes("coffee") || a.includes("food") || a.includes("lunch") || a.includes("dinner") || a.includes("pizza") || a.includes("eat")) return "Food";
  if (a.includes("game") || a.includes("gaming") || a.includes("smash")) return "Gaming";
  if (a.includes("music") || a.includes("concert") || a.includes("jam")) return "Music";
  if (a.includes("party") || a.includes("social") || a.includes("hang") || a.includes("chat")) return "Social";
  return "Social";
}

/** Category-aware emoji for map markers and cards */
export function activityEmoji(activity: string, category?: string): string {
  const a = (activity || "").toLowerCase();
  const cat = category ?? inferCategory(activity);

  if (a.includes("soccer") || a.includes("futsal") || (a.includes("football") && !a.includes("american"))) return "⚽";
  if (a.includes("basketball")) return "🏀";

  const map: Record<string, string> = {
    Sports: "🏀",
    Fitness: "🏀",
    Study: "📚",
    Gaming: "🎮",
    Food: "🍕",
    Music: "🎵",
    Social: "🎉",
    Casual: "🎉",
  };
  return map[cat] ?? "📍";
}

export function categoryMatchesFilter(category: string, filter: CategoryFilterId): boolean {
  if (filter === "all") return true;
  const c = category.toLowerCase();
  switch (filter) {
    case "sports":
      return c === "sports" || c === "fitness";
    case "study":
      return c === "study";
    case "gaming":
      return c === "gaming";
    case "food":
      return c === "food" || c === "casual";
    case "music":
      return c === "music";
    case "social":
      return c === "social";
    default:
      return true;
  }
}
