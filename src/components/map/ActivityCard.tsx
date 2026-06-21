"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation } from "lucide-react";
import type { Bubble } from "@/lib/mockData";
import { getCategoryTheme } from "@/lib/eventCategories";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { formatDistance, haversineDistance, openGoogleMapsDirections } from "@/lib/distance";

const PLACEHOLDER_AVATARS = ["🦊", "🐻", "🐼", "🦁", "🐨", "🐸"];

export type ActivityCardProps = {
  bubble: Bubble;
  index: number;
  isHovered?: boolean;
  isActive?: boolean;
  isJoining?: boolean;
  isAlreadyMember?: boolean;
  layout?: "horizontal" | "vertical";
  onJoin: () => void;
  onHover?: () => void;
  onLeave?: () => void;
  onViewOnMap?: () => void;
  onCardClick?: () => void;
  cardRef?: (el: HTMLDivElement | null) => void;
};

function DistanceBadge({
  bubble,
}: {
  bubble: Bubble;
}) {
  const { userLocation, locationStatus, requestLocation } = useUserLocation();

  const pillStyle = {
    backgroundColor: "var(--bg-page)",
    color: "var(--text-muted)",
    borderColor: "var(--border-color)",
  };

  if (locationStatus === "loading") {
    return (
      <span
        className="inline-block h-5 w-28 animate-pulse rounded-full border"
        style={pillStyle}
      />
    );
  }

  if (locationStatus === "granted" && userLocation && bubble.lat != null && bubble.lng != null) {
    const metres = haversineDistance(
      userLocation.lat,
      userLocation.lng,
      bubble.lat,
      bubble.lng
    );
    return (
      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]" style={pillStyle}>
        📍 ~{formatDistance(metres)}
      </span>
    );
  }

  if (locationStatus === "blocked") {
    return null;
  }

  if (locationStatus === "denied" || locationStatus === "idle") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          requestLocation();
        }}
        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] underline decoration-dotted underline-offset-2 transition hover:opacity-80"
        style={pillStyle}
      >
        📍 Enable location for distance
      </button>
    );
  }

  return null;
}

export default function ActivityCard({
  bubble,
  index,
  isHovered,
  isActive,
  isJoining,
  isAlreadyMember,
  layout = "horizontal",
  onJoin,
  onHover,
  onLeave,
  onCardClick,
  cardRef,
}: ActivityCardProps) {
  const theme = getCategoryTheme(bubble.category);
  const fillPct = bubble.maxPeople > 0 ? (bubble.joined / bubble.maxPeople) * 100 : 0;
  const isFull = bubble.joined >= bubble.maxPeople;
  const [ripple, setRipple] = useState(false);
  const [displayJoined, setDisplayJoined] = useState(bubble.joined);
  const hasCoords = bubble.lat != null && bubble.lng != null;

  const avatars =
    bubble.participants?.slice(0, 4).map((p) => p.avatar) ??
    PLACEHOLDER_AVATARS.slice(0, Math.min(bubble.joined || 1, 4));

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAlreadyMember || isJoining) {
      onJoin();
      return;
    }
    if (isFull) return;
    setRipple(true);
    setDisplayJoined((n) => Math.min(n + 1, bubble.maxPeople));
    setTimeout(() => setRipple(false), 600);
    onJoin();
  };

  const handleDirectionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasCoords) openGoogleMapsDirections(bubble.lat!, bubble.lng!);
  };

  const highlighted = isHovered || isActive;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: layout === "vertical" ? 12 : 20 }}
      animate={{
        opacity: 1,
        y: highlighted ? -2 : 0,
      }}
      transition={{ delay: index * 0.08, duration: 0.3, ease: "easeOut" }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={() => onCardClick?.()}
      className="relative w-full min-w-0 cursor-pointer overflow-hidden rounded-2xl border transition-all duration-200"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: isActive ? "var(--text-muted)" : "var(--border-color)",
        borderTopWidth: 3,
        borderTopColor: theme.border,
        boxShadow: highlighted
          ? `0 8px 32px -8px ${theme.glow}, 0 2px 12px rgba(0,0,0,0.15)`
          : "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div className="relative flex h-full flex-col gap-2.5 p-3.5">
        <div className="flex items-start gap-2">
          <span className="text-xl leading-none shrink-0 mt-0.5">{bubble.emoji}</span>
          <div className="min-w-0 flex-1">
            <h3
              className="text-[13px] font-semibold line-clamp-2 leading-snug"
              style={{ color: "var(--text-primary)" }}
            >
              {bubble.title}
            </h3>
            <p
              className="mt-0.5 flex items-center gap-1 text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{bubble.zone || "Campus"}</span>
            </p>
          </div>
        </div>

        <div
          className="self-start rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums"
          style={{ backgroundColor: `${theme.border}22`, color: theme.border }}
        >
          🕐 {bubble.startingIn}
        </div>

        <DistanceBadge bubble={bubble} />

        <div className="flex items-center justify-between gap-2">
          <div className="flex -space-x-1.5">
            {avatars.slice(0, 4).map((av, i) => (
              <span
                key={i}
                className="flex h-6 w-6 items-center justify-center rounded-full border text-xs"
                style={{
                  borderColor: "var(--bg-card)",
                  backgroundColor: "var(--btn-hover-bg)",
                }}
              >
                {av.length <= 2 ? av : av.charAt(0)}
              </span>
            ))}
          </div>
          <span className="text-[11px] tabular-nums" style={{ color: "var(--text-subtle)" }}>
            {displayJoined}
            <span style={{ color: "var(--text-faint)" }}>/{bubble.maxPeople}</span>
          </span>
        </div>

        <div
          className="h-[3px] overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--border-color)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: theme.border }}
            initial={{ width: `${fillPct}%` }}
            animate={{ width: `${(displayJoined / bubble.maxPeople) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        </div>

        <div className="mt-auto flex items-stretch gap-2">
          <motion.button
            type="button"
            disabled={isJoining || (isFull && !isAlreadyMember)}
            whileTap={{ scale: 0.97 }}
            onClick={handleJoinClick}
            className="relative min-w-0 flex-1 overflow-hidden rounded-xl py-2.5 text-[12px] font-bold text-white transition disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
            }}
          >
            {ripple && (
              <motion.span
                className="absolute inset-0 bg-white/30"
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.55 }}
              />
            )}
            <span className="relative">
              {isJoining
                ? "Joining…"
                : isAlreadyMember
                  ? "Open Chat"
                  : isFull
                    ? "Full"
                    : "Join Bubble"}
            </span>
          </motion.button>

          {hasCoords && (
            <button
              type="button"
              onClick={handleDirectionsClick}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border px-2.5 py-2.5 text-[11px] font-medium transition hover:opacity-80"
              style={{
                borderColor: "var(--border-color)",
                color: "var(--text-muted)",
              }}
            >
              <Navigation className="h-3.5 w-3.5" />
              Directions
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
