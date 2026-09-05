"use client";

import { motion } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";

type NearbyFocusHeaderProps = {
  emoji: string;
  title: string;
  zone: string;
  withinCount: number;
  radiusLabel: string;
  onBack: () => void;
};

export default function NearbyFocusHeader({
  emoji,
  title,
  zone,
  withinCount,
  radiusLabel,
  onBack,
}: NearbyFocusHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[11px] font-medium transition hover:opacity-80"
        style={{ color: "var(--color-text-muted)" }}
      >
        <ArrowLeft className="h-3 w-3" />
        All events
      </button>

      <div className="mt-1.5 flex items-start gap-1.5">
        <span className="text-base leading-none" aria-hidden>
          {emoji}
        </span>
        <div className="min-w-0">
          <h2
            className="truncate text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Near {title}
          </h2>
          <p
            className="flex items-center gap-1 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">
              {withinCount > 0
                ? `${withinCount} more within ${radiusLabel}`
                : `Nothing else within ${radiusLabel}`}
            </span>
          </p>
        </div>
      </div>
      <p className="mt-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
        {zone || "Campus"} · sorted by walking distance
      </p>
    </motion.div>
  );
}
