"use client";

import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, X, ExternalLink } from "lucide-react";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { formatDistance, haversineDistance, openGoogleMapsDirections } from "@/lib/distance";

const PLACEHOLDER_AVATARS = ["🦊", "🐻", "🐼", "🦁", "🐨", "🐸"];

export type EventPillProps = {
  emoji: string;
  title: string;
  category: string;
  zone: string;
  lat: number;
  lng: number;
  startingIn: string;
  joined: number;
  maxPeople: number;
  floatDelay?: number;
  isExpanded: boolean;
  isLocked?: boolean;
  isHovered?: boolean;
  isActive?: boolean;
  isJoining?: boolean;
  isAlreadyMember?: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onJoin: () => void;
  onClose?: () => void;
  onSelect?: () => void;
};

export default function EventPill({
  emoji,
  title,
  category: _category,
  zone,
  lat,
  lng,
  startingIn,
  joined,
  maxPeople,
  floatDelay = 0,
  isExpanded,
  isLocked,
  isHovered,
  isActive,
  isJoining,
  isAlreadyMember,
  onHoverStart,
  onHoverEnd,
  onJoin,
  onClose,
  onSelect,
}: EventPillProps) {
  const { userLocation, locationStatus } = useUserLocation();
  const spotsLeft = Math.max(0, maxPeople - joined);
  const distanceLabel =
    locationStatus === "granted" && userLocation
      ? `~${formatDistance(haversineDistance(userLocation.lat, userLocation.lng, lat, lng))}`
      : null;
  const fillPct = maxPeople > 0 ? (joined / maxPeople) * 100 : 0;
  const isFull = joined >= maxPeople;
  const lastTapRef = useRef<string | null>(null);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const avatars = PLACEHOLDER_AVATARS.slice(0, Math.min(joined || 1, 4));
  const selected = isActive || isLocked;

  const handlePointerEnter = useCallback(() => {
    onHoverStart();
  }, [onHoverStart]);

  const handlePointerLeave = useCallback(
    (e: React.MouseEvent) => {
      if (isLocked) return;
      const related = e.relatedTarget as Node | null;
      if (related && e.currentTarget.contains(related)) return;
      onHoverEnd();
    },
    [isLocked, onHoverEnd]
  );

  const handleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      onSelect?.();

      const isTouch = "touches" in e;
      if (isTouch) {
        if (lastTapRef.current === title && isExpanded) {
          lastTapRef.current = null;
          if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
          onJoin();
          return;
        }
        lastTapRef.current = title;
        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        tapTimerRef.current = setTimeout(() => {
          lastTapRef.current = null;
        }, 400);
        onHoverStart();
        return;
      }

      if (isLocked) return;
      onHoverStart();
    },
    [isExpanded, isLocked, onHoverStart, onJoin, onSelect, title]
  );

  return (
    <div
      className={`pointer-events-auto select-none event-pill-cursor relative ${
        selected || isHovered ? "z-30" : "z-10"
      }`}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onClick={handleTap}
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="detail-card"
            initial={{ opacity: 0, scale: 0.88, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-full left-1/2 mb-2 w-[240px] -translate-x-1/2"
            onMouseEnter={handlePointerEnter}
            onMouseLeave={handlePointerLeave}
          >
            <div
              className="relative overflow-hidden rounded-xl border backdrop-blur-[12px]"
              style={{
                background: "rgba(17, 10, 21, 0.93)",
                borderColor: "rgba(224, 51, 158, 0.35)",
                boxShadow:
                  "0 12px 40px -8px rgba(224, 51, 158, 0.28), 0 4px 20px rgba(0,0,0,0.45)",
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-[2px]"
                style={{ background: "linear-gradient(90deg, #FF5A36, #E0339E 60%, #8b5cf6)" }}
              />

              {isLocked && onClose && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="absolute right-2 top-2.5 flex h-6 w-6 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              <div className="px-3.5 pt-4 pb-3.5">
                <div className="flex items-start gap-2 pr-6">
                  <span className="text-xl shrink-0 leading-none">{emoji}</span>
                  <p className="text-sm font-semibold text-white leading-snug">{title}</p>
                </div>

                <div className="mt-2.5 space-y-1.5 text-xs text-white/50">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {zone || "Campus"}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 shrink-0" />
                    {startingIn}
                  </p>
                  {distanceLabel && (
                    <p className="flex items-center gap-1.5 text-white/45">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {distanceLabel}
                    </p>
                  )}
                </div>

                {isLocked && (
                  <>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex -space-x-1.5">
                        {avatars.map((av, i) => (
                          <span
                            key={i}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-[#0b0710] bg-white/10 text-xs"
                          >
                            {av}
                          </span>
                        ))}
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums"
                        style={{
                          backgroundColor: "rgba(224, 51, 158, 0.2)",
                          color: "#f9a8d4",
                        }}
                      >
                        {joined}/{maxPeople} spots
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <div className="h-1 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: "linear-gradient(90deg, #FF5A36, #E0339E 60%, #8b5cf6)",
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${fillPct}%` }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isJoining || (isFull && !isAlreadyMember)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onJoin();
                      }}
                      className="mt-3 w-full rounded-lg py-2.5 text-[13px] font-bold transition disabled:opacity-50"
                      style={{
                        background: "linear-gradient(135deg, #FF5A36, #E0339E 60%, #8b5cf6)",
                        color: "#ffffff",
                      }}
                    >
                      {isJoining
                        ? "Joining…"
                        : isAlreadyMember
                          ? "Open Chat"
                          : isFull
                            ? "Full"
                            : "Join Bubble"}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openGoogleMapsDirections(lat, lng);
                      }}
                      className="mt-2.5 flex w-full items-center justify-center gap-1 text-xs text-[#f9a8d4] underline-offset-2 transition hover:underline"
                    >
                      Open in Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </>
                )}

                {!isLocked && (
                  <>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-white/55">
                      <span>
                        {joined}/{maxPeople} joined
                      </span>
                      {spotsLeft > 0 && <span>{spotsLeft} left</span>}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openGoogleMapsDirections(lat, lng);
                      }}
                      className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-[#f9a8d4] underline-offset-2 transition hover:underline"
                    >
                      Open in Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium circular marker — map focal point */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{
          opacity: 1,
          scale: isHovered || selected ? 1.15 : 1,
          y: isExpanded ? 0 : [0, -2, 0],
        }}
        transition={
          isHovered || selected
            ? { type: "spring", stiffness: 420, damping: 22 }
            : {
                y: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: floatDelay },
                opacity: { duration: 0.25 },
              }
        }
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-[10px] ${
          selected ? "animate-pulse-marker" : ""
        }`}
        style={{
          background: "rgba(17, 10, 21, 0.85)",
          borderColor:
            isHovered || selected
              ? "rgba(224, 51, 158, 1)"
              : "rgba(224, 51, 158, 0.45)",
          boxShadow: selected
            ? undefined
            : isHovered
              ? "0 0 18px rgba(224, 51, 158, 0.5), 0 4px 16px rgba(0,0,0,0.4)"
              : "0 0 12px rgba(224, 51, 158, 0.25), 0 4px 14px rgba(0,0,0,0.4)",
        }}
        title={title}
      >
        <span className="leading-none" style={{ fontSize: 20 }} aria-hidden>
          {emoji}
        </span>
      </motion.div>
    </div>
  );
}
