"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check, RotateCcw } from "lucide-react";
import { CATEGORY_FILTERS, type CategoryFilterId } from "@/lib/eventCategories";
import {
  START_WITHIN_OPTIONS,
  TIME_OF_DAY_OPTIONS,
  type MapTimeFilter,
} from "@/lib/mapTimeFilter";

const AURORA_GRADIENT = "linear-gradient(135deg, #FF5A36, #E0339E 60%, #8b5cf6)";

type MapFilterPanelProps = {
  timeFilter: MapTimeFilter;
  onTimeFilterChange: (next: MapTimeFilter) => void;
  categoryFilter: CategoryFilterId;
  onCategoryChange: (id: CategoryFilterId) => void;
  resultCount: number;
  activeCount: number;
  onReset: () => void;
  onClose: () => void;
};

function OptionChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="relative shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition"
      style={
        active
          ? { color: "#ffffff", border: "1px solid transparent", background: AURORA_GRADIENT }
          : {
              background: "var(--panel-chip-bg)",
              border: "1px solid var(--panel-card-border)",
              color: "var(--color-text-secondary)",
            }
      }
    >
      <span className="relative z-10 inline-flex items-center gap-1">{children}</span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="mb-1.5 text-[10px] font-bold uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export default function MapFilterPanel({
  timeFilter,
  onTimeFilterChange,
  categoryFilter,
  onCategoryChange,
  resultCount,
  activeCount,
  onReset,
  onClose,
}: MapFilterPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const el = panelRef.current;
      if (!el) return;
      const target = e.target as Node | null;
      // The trigger button handles its own toggle, so ignore clicks inside it.
      if (target && (el.contains(target) || (target as HTMLElement).closest?.("[data-map-filter-trigger]")))
        return;
      onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-label="Event filters"
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="absolute left-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border"
      style={{
        background: "var(--panel-popover-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderColor: "var(--panel-popover-border)",
        boxShadow: "var(--panel-popover-shadow)",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: AURORA_GRADIENT }}
      />

      <div className="space-y-3.5 px-3.5 pb-3 pt-4">
        <Section title="Starting">
          {START_WITHIN_OPTIONS.map((opt) => (
            <OptionChip
              key={opt.id}
              active={timeFilter.startWithin === opt.id}
              onClick={() => onTimeFilterChange({ ...timeFilter, startWithin: opt.id })}
            >
              <span aria-hidden>{opt.emoji}</span>
              {opt.label}
            </OptionChip>
          ))}
        </Section>

        <Section title="Time of day">
          {TIME_OF_DAY_OPTIONS.map((opt) => (
            <OptionChip
              key={opt.id}
              active={timeFilter.timeOfDay === opt.id}
              onClick={() => onTimeFilterChange({ ...timeFilter, timeOfDay: opt.id })}
            >
              {opt.label}
              {opt.hint && (
                <span className="font-normal opacity-60 tabular-nums">{opt.hint}</span>
              )}
            </OptionChip>
          ))}
        </Section>

        <Section title="Activity">
          {CATEGORY_FILTERS.map((f) => (
            <OptionChip
              key={f.id}
              active={categoryFilter === f.id}
              onClick={() => onCategoryChange(f.id)}
            >
              {f.emoji && <span aria-hidden>{f.emoji}</span>}
              {f.label}
            </OptionChip>
          ))}
        </Section>

        <button
          type="button"
          onClick={() =>
            onTimeFilterChange({ ...timeFilter, onlyWithSpots: !timeFilter.onlyWithSpots })
          }
          className="flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition"
          style={{
            borderColor: timeFilter.onlyWithSpots
              ? "rgba(224,51,158,0.45)"
              : "var(--panel-card-border)",
            background: timeFilter.onlyWithSpots
              ? "var(--panel-time-bg)"
              : "var(--panel-chip-bg)",
          }}
          aria-pressed={timeFilter.onlyWithSpots}
        >
          <span
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border"
            style={
              timeFilter.onlyWithSpots
                ? { background: AURORA_GRADIENT, borderColor: "transparent" }
                : { borderColor: "var(--text-faint)" }
            }
          >
            {timeFilter.onlyWithSpots && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
          </span>
          <span className="text-[12px] font-medium" style={{ color: "var(--color-text-primary)" }}>
            Only events with spots left
          </span>
        </button>
      </div>

      <div
        className="flex items-center justify-between gap-2 border-t px-3.5 py-2.5"
        style={{ borderColor: "var(--panel-card-border)", background: "var(--panel-chip-bg)" }}
      >
        <button
          type="button"
          onClick={onReset}
          disabled={activeCount === 0}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium transition hover:opacity-80 disabled:opacity-35"
          style={{ color: "var(--color-text-muted)" }}
        >
          <RotateCcw className="h-3 w-3" />
          Reset all
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3.5 py-1.5 text-[12px] font-bold text-white transition"
          style={{ background: AURORA_GRADIENT, boxShadow: "0 4px 14px rgba(224,51,158,0.28)" }}
        >
          Show {resultCount} {resultCount === 1 ? "event" : "events"}
        </button>
      </div>
    </motion.div>
  );
}
