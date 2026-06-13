import type { CategoryFilterId } from "@/lib/eventCategories";

export type CampusFilterId = "all" | "on" | "off";

const CAMPUS_PARAM = "campus";
const CATEGORY_PARAM = "category";

const ALLOWED_CAMPUS: CampusFilterId[] = ["all", "on", "off"];
const ALLOWED_CATEGORY: CategoryFilterId[] = [
  "all",
  "sports",
  "study",
  "gaming",
  "food",
  "music",
  "social",
];

export function readCampusFilterFromUrl(): CampusFilterId {
  if (typeof window === "undefined") return "all";
  const v = new URLSearchParams(window.location.search).get(CAMPUS_PARAM);
  return ALLOWED_CAMPUS.includes(v as CampusFilterId) ? (v as CampusFilterId) : "all";
}

export function readCategoryFilterFromUrl(): CategoryFilterId {
  if (typeof window === "undefined") return "all";
  const v = new URLSearchParams(window.location.search).get(CATEGORY_PARAM);
  return ALLOWED_CATEGORY.includes(v as CategoryFilterId) ? (v as CategoryFilterId) : "all";
}

export function writeMapFiltersToUrl(campus: CampusFilterId, category: CategoryFilterId) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (campus === "all") url.searchParams.delete(CAMPUS_PARAM);
  else url.searchParams.set(CAMPUS_PARAM, campus);
  if (category === "all") url.searchParams.delete(CATEGORY_PARAM);
  else url.searchParams.set(CATEGORY_PARAM, category);
  window.history.replaceState({}, "", url.toString());
}
