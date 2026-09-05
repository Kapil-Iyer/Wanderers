"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { useMapFilter } from "@/contexts/MapFilterContext";
import type { CampusFilterId } from "@/lib/mapFilterUrl";
import MapFilterPanel from "@/components/map/MapFilterPanel";
import {
  countActiveTimeFilters,
  DEFAULT_TIME_FILTER,
  type MapTimeFilter,
} from "@/lib/mapTimeFilter";

const AURORA_GRADIENT = "linear-gradient(135deg, #FF5A36, #E0339E 60%, #8b5cf6)";

type MapFilterBarProps = {
  campusFilter: CampusFilterId;
  onCampusFilterChange: (id: CampusFilterId) => void;
  timeFilter: MapTimeFilter;
  onTimeFilterChange: (next: MapTimeFilter) => void;
  resultCount: number;
};

const CAMPUS_CHIPS: { id: CampusFilterId; label: string; short: string }[] = [
  { id: "on", label: "On campus", short: "On" },
  { id: "off", label: "Off campus", short: "Off" },
  { id: "all", label: "All", short: "All" },
];

const CHIP_INACTIVE = {
  background: "var(--bar-btn-bg)",
  border: "1px solid var(--border-color)",
  color: "var(--color-text-secondary)",
};

export default function MapFilterBar({
  campusFilter,
  onCampusFilterChange,
  timeFilter,
  onTimeFilterChange,
  resultCount,
}: MapFilterBarProps) {
  const { filter, setFilter } = useMapFilter();
  const [panelOpen, setPanelOpen] = useState(false);

  const activeCount = countActiveTimeFilters(timeFilter) + (filter !== "all" ? 1 : 0);

  return (
    <div
      className="relative z-30 shrink-0 border-b px-3 py-2"
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: "var(--bar-bg)",
      }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-map-filter-trigger
          onClick={() => setPanelOpen((o) => !o)}
          className="relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition sm:text-xs"
          style={
            activeCount > 0 || panelOpen
              ? {
                  color: "#ffffff",
                  border: "1px solid transparent",
                  background: AURORA_GRADIENT,
                  boxShadow: "0 0 14px rgba(224,51,158,0.3)",
                }
              : CHIP_INACTIVE
          }
          aria-expanded={panelOpen}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span
              className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums"
              style={{ background: "rgba(0,0,0,0.32)", color: "#ffffff" }}
            >
              {activeCount}
            </span>
          )}
        </button>

        <div
          className="mx-0.5 h-4 w-px shrink-0"
          style={{ backgroundColor: "var(--border-color)" }}
        />

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {CAMPUS_CHIPS.map((chip) => {
            const active = campusFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => onCampusFilterChange(chip.id)}
                className="relative shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-semibold sm:px-3 sm:text-xs"
                style={
                  active
                    ? { color: "#ffffff", border: "1px solid transparent" }
                    : CHIP_INACTIVE
                }
                aria-pressed={active}
              >
                {active && (
                  <motion.div
                    layoutId="map-campus-filter-active"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: AURORA_GRADIENT,
                      boxShadow: "0 0 14px rgba(224,51,158,0.3)",
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  <span className="sm:hidden">{chip.short}</span>
                  <span className="hidden sm:inline">{chip.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        <span
          className="ml-auto shrink-0 text-[11px] tabular-nums"
          style={{ color: "var(--color-text-muted)" }}
        >
          {resultCount} {resultCount === 1 ? "event" : "events"}
        </span>
      </div>

      <AnimatePresence>
        {panelOpen && (
          <MapFilterPanel
            timeFilter={timeFilter}
            onTimeFilterChange={onTimeFilterChange}
            categoryFilter={filter}
            onCategoryChange={setFilter}
            resultCount={resultCount}
            activeCount={activeCount}
            onReset={() => {
              onTimeFilterChange(DEFAULT_TIME_FILTER);
              setFilter("all");
            }}
            onClose={() => setPanelOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
