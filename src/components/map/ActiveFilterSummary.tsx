"use client";

import type { CategoryFilterId } from "@/lib/eventCategories";
import { CATEGORY_FILTERS } from "@/lib/eventCategories";
import type { CampusFilterId } from "@/lib/mapFilterUrl";

type ActiveFilterSummaryProps = {
  campusFilter: CampusFilterId;
  categoryFilter: CategoryFilterId;
  onClear: () => void;
};

export default function ActiveFilterSummary({
  campusFilter,
  categoryFilter,
  onClear,
}: ActiveFilterSummaryProps) {
  const hasActiveFilters = campusFilter !== "all" || categoryFilter !== "all";
  if (!hasActiveFilters) return null;

  const categoryLabel = CATEGORY_FILTERS.find((f) => f.id === categoryFilter)?.label;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {campusFilter === "on" && (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: "rgba(99,102,241,0.15)", color: "#818cf8" }}
        >
          🏫 On campus
        </span>
      )}
      {campusFilter === "off" && (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "#fbbf24" }}
        >
          🌍 Off campus
        </span>
      )}
      {categoryFilter !== "all" && categoryLabel && (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: "var(--btn-active-bg)", color: "var(--text-muted)" }}
        >
          {categoryLabel}
        </span>
      )}
      <button
        type="button"
        onClick={onClear}
        className="text-[10px] transition hover:opacity-80"
        style={{ color: "var(--text-faint)" }}
      >
        Clear all
      </button>
    </div>
  );
}
