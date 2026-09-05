"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation } from "lucide-react";
import type { Bubble } from "@/lib/mockData";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { formatDistance, haversineDistance, openGoogleMapsDirections } from "@/lib/distance";

const PLACEHOLDER_AVATARS = ["🦊", "🐻", "🐼", "🦁", "🐨", "🐸"];
/** Ember Aurora brand gradient: red-orange → magenta → violet */
const AURORA_GRADIENT = "linear-gradient(135deg, #FF5A36, #E0339E 60%, #8b5cf6)";

export type ActivityCardProps = {
  bubble: Bubble;
  index: number;
  isHovered?: boolean;
  isActive?: boolean;
  isJoining?: boolean;
  isAlreadyMember?: boolean;
  layout?: "horizontal" | "vertical";
  /** Replaces the "distance from you" badge, e.g. distance from a selected pin. */
  distanceLabel?: string;
  onJoin: () => void;
  onHover?: () => void;
  onLeave?: () => void;
  onViewOnMap?: () => void;
  onCardClick?: () => void;
  cardRef?: (el: HTMLDivElement | null) => void;
};

function isImminent(startingIn: string): boolean {
  const s = startingIn.trim().toLowerCase();
  if (s === "starting now" || s === "now" || s.includes("starting now")) return true;
  const mins = s.match(/(\d+)\s*mins?/);
  if (mins) return Number(mins[1]) <= 60;
  return false;
}

function DistanceBadge({ bubble }: { bubble: Bubble }) {
  const { userLocation, locationStatus, requestLocation } = useUserLocation();

  const pillStyle = {
    backgroundColor: "var(--panel-chip-bg)",
    color: "var(--color-text-secondary)",
    borderColor: "var(--panel-chip-border)",
  };

  if (locationStatus === "loading") {
    return (
      <span
        className="inline-block h-4 w-24 animate-pulse rounded-full border"
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
      <span
        className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px]"
        style={pillStyle}
      >
        <MapPin className="h-2.5 w-2.5" />
        {formatDistance(metres)}
      </span>
    );
  }

  if (locationStatus === "blocked") return null;

  if (locationStatus === "denied" || locationStatus === "idle") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          requestLocation();
        }}
        className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] underline decoration-dotted underline-offset-2 transition hover:opacity-80"
        style={pillStyle}
      >
        <MapPin className="h-2.5 w-2.5" />
        Enable location
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
  distanceLabel,
  onJoin,
  onHover,
  onLeave,
  onCardClick,
  cardRef,
}: ActivityCardProps) {
  const isFull = bubble.joined >= bubble.maxPeople;
  const [ripple, setRipple] = useState(false);
  const [displayJoined, setDisplayJoined] = useState(bubble.joined);
  const hasCoords = bubble.lat != null && bubble.lng != null;
  const imminent = isImminent(bubble.startingIn);

  const avatars =
    bubble.participants?.slice(0, 3).map((p) => p.avatar) ??
    PLACEHOLDER_AVATARS.slice(0, Math.min(bubble.joined || 1, 3));

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
      initial={{ opacity: 0, y: layout === "vertical" ? 10 : 16 }}
      animate={{
        opacity: 1,
        y: highlighted ? -4 : 0,
        scale: highlighted ? 1.01 : 1,
      }}
      transition={{
        delay: index * 0.05,
        type: "spring",
        stiffness: 380,
        damping: 26,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={() => onCardClick?.()}
      className="relative w-full min-w-0 cursor-pointer overflow-hidden rounded-xl"
      style={{
        background: "var(--panel-card-bg)",
        backdropFilter: "var(--panel-card-blur)",
        WebkitBackdropFilter: "var(--panel-card-blur)",
        border: "1px solid var(--panel-card-border)",
        borderLeft: "2px solid var(--panel-card-accent)",
        boxShadow: highlighted
          ? "var(--panel-card-shadow-hover)"
          : "var(--panel-card-shadow)",
      }}
    >
      <div className="relative flex h-full flex-col gap-1.5 p-2.5">
        <div className="flex items-start gap-1.5">
          <span className="text-base leading-none shrink-0 mt-0.5">{bubble.emoji}</span>
          <div className="min-w-0 flex-1">
            <h3
              className="text-[12px] font-semibold line-clamp-2 leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {bubble.title}
            </h3>
            <p
              className="mt-0.5 flex items-center gap-1 text-[10px]"
              style={{ color: "var(--color-text-muted)" }}
            >
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{bubble.zone || "Campus"}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
            style={
              imminent
                ? { backgroundColor: "var(--panel-time-bg)", color: "var(--panel-time-fg)" }
                : { backgroundColor: "var(--panel-chip-bg)", color: "var(--color-text-muted)" }
            }
          >
            {bubble.startingIn}
          </span>
          {distanceLabel ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px]"
              style={{
                backgroundColor: "var(--panel-time-bg)",
                color: "var(--panel-time-fg)",
                borderColor: "var(--panel-chip-border)",
              }}
            >
              <MapPin className="h-2.5 w-2.5" />
              {distanceLabel}
            </span>
          ) : (
            <DistanceBadge bubble={bubble} />
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex -space-x-1.5">
            {avatars.slice(0, 3).map((av, i) => (
              <span
                key={i}
                className="flex h-5 w-5 items-center justify-center rounded-full border text-[10px]"
                style={{
                  borderColor: "var(--panel-avatar-ring)",
                  backgroundColor: "var(--panel-avatar-bg)",
                }}
              >
                {av.length <= 2 ? av : av.charAt(0)}
              </span>
            ))}
          </div>
          <span
            className="text-[10px] tabular-nums"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {displayJoined}
            <span style={{ color: "var(--color-text-muted)" }}>/{bubble.maxPeople}</span>
          </span>
        </div>

        <div
          className="h-[3px] overflow-hidden rounded-full"
          style={{ background: "var(--panel-track-bg)" }}
        >
          <motion.div
            className="h-full rounded-full origin-left"
            style={{ background: AURORA_GRADIENT }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: displayJoined / Math.max(1, bubble.maxPeople) }}
            transition={{
              duration: 0.85,
              delay: 0.12 + index * 0.04,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          />
        </div>

        <div className="mt-auto flex items-stretch gap-1.5 pt-0.5">
          <motion.button
            type="button"
            disabled={isJoining || (isFull && !isAlreadyMember)}
            whileTap={{ scale: 0.97 }}
            onClick={handleJoinClick}
            className="relative min-w-0 flex-1 overflow-hidden rounded-lg py-1.5 text-[11px] font-bold text-white transition disabled:opacity-50"
            style={{
              background: AURORA_GRADIENT,
              boxShadow: "0 4px 14px rgba(224,51,158,0.28)",
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
                    : "Join"}
            </span>
          </motion.button>

          {hasCoords && (
            <button
              type="button"
              onClick={handleDirectionsClick}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border px-2 py-1.5 transition hover:opacity-80"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
              aria-label="Directions"
              title="Directions"
            >
              <Navigation className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
