"use client";

/**
 * Campus event card - matches BubbleCard compact footprint (300px, 3-up grid).
 */

import { motion } from "framer-motion";
import { MapPin, Clock, ArrowRight } from "lucide-react";

const CARD_STYLE: React.CSSProperties = {
  background: "linear-gradient(165deg, #16120e 0%, #0c0907 50%, #080604 100%)",
  border: "1.5px solid rgba(255,181,107,0.18)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4), 0 10px 28px -10px rgba(0,0,0,0.65)",
};

type CampusEventCardProps = {
  emoji: string;
  title: string;
  location: string;
  timeLabel: string;
  organizer?: string | null;
  onStartBubble: () => void;
};

export default function CampusEventCard({
  emoji,
  title,
  location,
  timeLabel,
  organizer,
  onStartBubble,
}: CampusEventCardProps) {
  return (
    <motion.div
      className="h-[300px] rounded-2xl flex flex-col overflow-hidden"
      style={CARD_STYLE}
      whileHover={{
        y: -4,
        boxShadow:
          "inset 0 1px 0 rgba(255,181,107,0.15), 0 14px 32px -12px rgba(255,122,26,0.22)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <div
        className="relative h-24 flex items-center justify-center shrink-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,122,26,0.22) 0%, rgba(255,181,107,0.1) 50%, transparent 100%), #0a0806",
        }}
      >
        <div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255,122,26,0.28) 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <span
          className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(0,0,0,0.45)",
            color: "#ffb56b",
            border: "1px solid rgba(255,181,107,0.35)",
          }}
        >
          Campus
        </span>
        <span className="relative z-10 text-4xl drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          {emoji}
        </span>
      </div>

      <div className="p-3.5 flex flex-col flex-1 min-h-0">
        <h3
          className="font-display text-base font-bold leading-tight line-clamp-2 min-h-[2.5rem]"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h3>

        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          <span
            className="flex items-center gap-1 text-[11px] min-w-0"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <MapPin className="w-3 h-3 shrink-0" style={{ color: "#ff7a1a" }} />
            <span className="truncate">{location}</span>
          </span>
          <span
            className="flex items-center gap-1 text-[11px]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <Clock className="w-3 h-3 shrink-0" style={{ color: "#ff7a1a" }} />
            {timeLabel}
          </span>
        </div>

        <p
          className="text-xs mt-2.5 line-clamp-2 leading-relaxed flex-1"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {organizer
            ? `Hosted by ${organizer}. Start a bubble and go with friends.`
            : "Official campus event - start a bubble and go together."}
        </p>

        <motion.button
          type="button"
          onClick={onStartBubble}
          className="mt-2.5 w-full h-9 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shrink-0"
          style={{
            background: "linear-gradient(135deg, #ff7a1a, #ffb56b)",
            color: "#2a1206",
            boxShadow: "0 0 14px rgba(255,122,26,0.28)",
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          Start a bubble <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
