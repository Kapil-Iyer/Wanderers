"use client";

/**
 * Campus event card - matches BubbleCard compact footprint (300px, 3-up grid)
 * with info flip for details.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, ArrowRight, Info, X } from "lucide-react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const CARD_STYLE: React.CSSProperties = {
  background: "linear-gradient(165deg, #16142a 0%, #0c0a18 50%, #08070f 100%)",
  border: "1.5px solid rgba(139,92,246,0.18)",
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
  const [flipped, setFlipped] = useState(false);
  const accent = "#a78bfa";

  return (
    <div className="relative h-[300px]" style={{ perspective: "1600px" }}>
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {/* Front */}
        <motion.div
          className="absolute inset-0 rounded-2xl h-full flex flex-col overflow-hidden"
          style={{
            ...CARD_STYLE,
            backfaceVisibility: "hidden",
            pointerEvents: flipped ? "none" : "auto",
          }}
          whileHover={{
            y: -4,
            boxShadow:
              "inset 0 1px 0 rgba(139,92,246,0.18), 0 14px 32px -12px rgba(139,92,246,0.26)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFlipped(true);
            }}
            aria-label="More info"
            className="absolute top-2.5 right-2.5 z-30 w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
            style={{
              background: "rgba(10,9,20,0.92)",
              border: `1px solid ${accent}70`,
              color: accent,
              boxShadow: "0 2px 10px rgba(0,0,0,0.55)",
            }}
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          <div
            className="relative h-24 flex items-center justify-center shrink-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(139,92,246,0.22) 0%, rgba(224,51,158,0.1) 50%, transparent 100%), #0a0910",
            }}
          >
            <div
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)",
              }}
              aria-hidden
            />
            <span
              className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(0,0,0,0.45)",
                color: "#a78bfa",
                border: "1px solid rgba(139,92,246,0.35)",
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
                <MapPin className="w-3 h-3 shrink-0" style={{ color: "#a78bfa" }} />
                <span className="truncate">{location}</span>
              </span>
              <span
                className="flex items-center gap-1 text-[11px]"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <Clock className="w-3 h-3 shrink-0" style={{ color: "#a78bfa" }} />
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
                background: "linear-gradient(135deg, #8b5cf6, #E0339E)",
                color: "#fff",
                boxShadow: "0 0 14px rgba(139,92,246,0.32)",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Start a bubble <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl h-full flex flex-col p-3.5"
          style={{
            ...CARD_STYLE,
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            pointerEvents: flipped ? "auto" : "none",
          }}
        >
          <button
            type="button"
            onClick={() => setFlipped(false)}
            aria-label="Close info"
            className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(10,9,20,0.92)",
              border: `1px solid ${accent}70`,
              color: accent,
              boxShadow: "0 2px 10px rgba(0,0,0,0.55)",
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <span
            className="self-start text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full mb-3"
            style={{
              background: "rgba(0,0,0,0.35)",
              color: accent,
              border: `1px solid ${accent}40`,
            }}
          >
            Campus
          </span>

          <h3 className="font-display text-lg font-bold leading-tight pr-8" style={{ color: "var(--color-text-primary)" }}>
            {emoji} {title}
          </h3>

          <p className="text-sm mt-3 leading-relaxed flex-1 overflow-y-auto" style={{ color: "var(--color-text-secondary)" }}>
            {organizer
              ? `${organizer} is hosting this campus event. Start a Wanderers bubble so friends can join you there.`
              : "Official campus event. Start a Wanderers bubble and go together."}
          </p>

          <div className="mt-4 space-y-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "#a78bfa" }} />
              {location}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "#a78bfa" }} />
              {timeLabel}
            </div>
          </div>

          <motion.button
            type="button"
            onClick={onStartBubble}
            className="mt-4 w-full h-9 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shrink-0"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #E0339E)",
              color: "#fff",
            }}
            whileTap={{ scale: 0.97 }}
          >
            Start a bubble <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
