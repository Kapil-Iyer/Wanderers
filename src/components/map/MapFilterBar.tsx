"use client";

import { CATEGORY_FILTERS, getFilterTheme } from "@/lib/eventCategories";
import { useMapFilter } from "@/contexts/MapFilterContext";
import type { CampusFilterId } from "@/lib/mapFilterUrl";

type MapFilterBarProps = {
  campusFilter: CampusFilterId;
  onCampusFilterChange: (id: CampusFilterId) => void;
};

export default function MapFilterBar({
  campusFilter,
  onCampusFilterChange,
}: MapFilterBarProps) {
  const { filter, setFilter } = useMapFilter();

  const handleCampusClick = (id: "on" | "off") => {
    onCampusFilterChange(campusFilter === id ? "all" : id);
  };

  return (
    <div
      className="shrink-0 border-b px-3 py-2"
      style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bar-bg)" }}
    >
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        <div
          className="flex shrink-0 rounded-full border p-0.5"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <button
            type="button"
            onClick={() => handleCampusClick("on")}
            className="rounded-full px-2.5 py-1.5 text-[11px] font-medium transition sm:px-3 sm:text-xs"
            style={
              campusFilter === "on"
                ? { backgroundColor: "#6366f1", color: "#fff", boxShadow: "0 0 8px #6366f140" }
                : { color: "var(--text-muted)" }
            }
            aria-pressed={campusFilter === "on"}
          >
            <span className="sm:hidden">🏫 On</span>
            <span className="hidden sm:inline">🏫 On campus</span>
          </button>
          <button
            type="button"
            onClick={() => handleCampusClick("off")}
            className="rounded-full px-2.5 py-1.5 text-[11px] font-medium transition sm:px-3 sm:text-xs"
            style={
              campusFilter === "off"
                ? { backgroundColor: "#f59e0b", color: "#fff", boxShadow: "0 0 8px #f59e0b40" }
                : { color: "var(--text-muted)" }
            }
            aria-pressed={campusFilter === "off"}
          >
            <span className="sm:hidden">🌍 Off</span>
            <span className="hidden sm:inline">🌍 Off campus</span>
          </button>
        </div>

        <div
          className="mx-0.5 h-4 w-px shrink-0"
          style={{ backgroundColor: "var(--border-color)" }}
        />

        {CATEGORY_FILTERS.map((f) => {
          const active = filter === f.id;
          const theme = getFilterTheme(f.id);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className="relative shrink-0"
            >
              <span
                className={`relative flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs ${
                  active ? "border-transparent text-white" : "hover:opacity-90"
                }`}
                style={
                  active
                    ? {
                        backgroundColor: theme.border,
                        boxShadow: `0 0 8px ${theme.glow}`,
                      }
                    : {
                        borderColor: "var(--border-filter-pill-inactive)",
                        backgroundColor: "var(--bg-filter-pill-inactive)",
                        color: "var(--text-filter-pill-inactive)",
                      }
                }
              >
                {f.emoji && <span>{f.emoji}</span>}
                <span className={f.id === "all" ? "" : "hidden sm:inline"}>{f.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
