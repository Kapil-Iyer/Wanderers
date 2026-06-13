"use client";

import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, X, ExternalLink } from "lucide-react";
import { getCategoryTheme } from "@/lib/eventCategories";
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
  category,
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
  const theme = getCategoryTheme(category);
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

  const showGlow = isHovered || isActive || isLocked;

  return (
    <div
      className={`pointer-events-auto select-none event-pill-cursor relative w-max min-w-[80px] ${
        isActive || isHovered || isLocked ? "z-30" : "z-10"
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
            className="absolute bottom-full left-1/2 mb-1.5 w-[240px] -translate-x-1/2"
            onMouseEnter={handlePointerEnter}
            onMouseLeave={handlePointerLeave}
          >
            <div
              className="relative overflow-hidden rounded-xl border border-white/10 bg-[rgba(15,17,35,0.92)] backdrop-blur-[10px]"
              style={{
                boxShadow: `0 12px 40px -8px ${theme.glow}, 0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)`,
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ backgroundColor: theme.border }}
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
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-[#0f1117] bg-white/10 text-xs"
                          >
                            {av}
                          </span>
                        ))}
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums"
                        style={{
                          backgroundColor: `${theme.border}33`,
                          color: theme.border,
                        }}
                      >
                        {joined}/{maxPeople} spots
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <div className="h-1 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: theme.border }}
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
                      className="mt-3 w-full rounded-lg py-2.5 text-[13px] font-bold text-white transition disabled:opacity-50"
                      style={{
                        background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
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
                      className="mt-2.5 flex w-full items-center justify-center gap-1 text-xs text-[#6366f1] underline-offset-2 transition hover:underline"
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
                      className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-[#6366f1] underline-offset-2 transition hover:underline"
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

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: isExpanded ? 0 : [0, -3, 0],
        }}
        transition={
          isExpanded
            ? { type: "spring", stiffness: 420, damping: 32 }
            : {
                y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: floatDelay },
                opacity: { duration: 0.3 },
              }
        }
        className={`relative w-max min-w-[80px] max-w-[120px] transition-shadow duration-300`}
        style={{
          boxShadow: showGlow
            ? `0 0 14px ${theme.glow}, 0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${theme.border}44`
            : "0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-[rgba(15,17,35,0.85)] backdrop-blur-[10px]"
        >
          <div
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ backgroundColor: theme.border }}
          />
          <div className="flex min-w-0 items-center gap-1.5 px-2.5 py-1.5">
            <span className="shrink-0 text-base leading-none">{emoji}</span>
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white">{title}</span>
            <span
              className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
              style={{
                backgroundColor: `${theme.border}33`,
                color: theme.border,
              }}
            >
              {joined}/{maxPeople}
            </span>
          </div>
        </div>

        {/* Chat-bubble anchor notch */}
        <div
          className="mx-auto h-0 w-0"
          style={{
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `6px solid rgba(15,17,35,0.85)`,
            filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.3))",
          }}
        />
      </motion.div>
    </div>
  );
}
