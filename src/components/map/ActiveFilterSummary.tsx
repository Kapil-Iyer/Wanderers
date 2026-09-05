"use client";

import type { CategoryFilterId } from "@/lib/eventCategories";
import { CATEGORY_FILTERS } from "@/lib/eventCategories";
import type { CampusFilterId } from "@/lib/mapFilterUrl";
import {
  describeTimeFilter,
  isTimeFilterActive,
  type MapTimeFilter,
} from "@/lib/mapTimeFilter";

type ActiveFilterSummaryProps = {
  campusFilter: CampusFilterId;
  categoryFilter: CategoryFilterId;
  timeFilter: MapTimeFilter;
  onClear: () => void;
};

export default function ActiveFilterSummary({
  campusFilter,
  categoryFilter,
  timeFilter,
  onClear,
}: ActiveFilterSummaryProps) {
  const hasActiveFilters =
    campusFilter !== "all" || categoryFilter !== "all" || isTimeFilterActive(timeFilter);
  if (!hasActiveFilters) return null;

  const categoryLabel = CATEGORY_FILTERS.find((f) => f.id === categoryFilter)?.label;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {campusFilter === "on" && (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: "var(--panel-info-bg)", color: "var(--panel-info-fg)" }}
        >
          🏫 On campus
        </span>
      )}
      {campusFilter === "off" && (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: "var(--panel-warn-bg)", color: "var(--panel-warn-fg)" }}
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
      {describeTimeFilter(timeFilter).map((label) => (
        <span
          key={label}
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: "var(--panel-time-bg)", color: "var(--panel-time-fg)" }}
        >
          {label}
        </span>
      ))}
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
