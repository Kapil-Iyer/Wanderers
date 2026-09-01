"use client";

import { motion } from "framer-motion";
import { Bell, MapPin, MessageSquare, Compass, User, Home } from "lucide-react";
import { DEMO_USER } from "./script";

/**
 * Fixed design canvas. The player scales this to fit its container, so every
 * scene can lay out against known pixel dimensions and never reflows.
 * Sized so that at a ~600px-wide hero column the effective scale is ~0.86 —
 * small enough to read as a device mockup, large enough that titles and
 * buttons stay legible.
 */
export const CANVAS_W = 700;
export const CANVAS_H = 450;

/* ---------------------------------------------------------------- timing */

/** True once the scene-local clock passes `ms`. Drives mount-based animation. */
export const at = (t: number, ms: number) => t >= ms;

/** 0→1 ramp between two scene-local timestamps. */
export function seg(t: number, from: number, to: number) {
  if (to <= from) return t >= to ? 1 : 0;
  return Math.min(1, Math.max(0, (t - from) / (to - from)));
}

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

export const EASE = [0.25, 0.46, 0.45, 0.94] as const;
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/* ---------------------------------------------------------------- palette */

export const APP_BG = "linear-gradient(180deg, #0e0a07 0%, #16110c 55%, #0c0907 100%)";
export const HEADER_BG = "linear-gradient(180deg, rgba(14,12,24,0.97), rgba(9,8,17,0.92))";
export const VIOLET = "#8b5cf6";
export const MAGENTA = "#E0339E";

/* ---------------------------------------------------------------- pieces */

export function Avatar({
  initials,
  size = 26,
  tint = "rgba(255,122,26,0.16)",
  accent = "#ffb56b",
  ring,
}: {
  initials: string;
  size?: number;
  tint?: string;
  accent?: string;
  ring?: string;
}) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        background: tint,
        color: accent,
        border: `1px solid ${ring ?? accent + "55"}`,
        fontSize: Math.round(size * 0.38),
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
}

export function GradientAvatar({ initials, size = 26 }: { initials: string; size?: number }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-lg font-bold"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${VIOLET}, ${MAGENTA})`,
        color: "#fff",
        fontSize: Math.round(size * 0.36),
      }}
    >
      {initials}
    </div>
  );
}

/** Faithful-ish recreation of AppHeader. */
export function AppTopBar({
  active = "Home",
  title,
  notifications = 0,
  highlightStart = false,
}: {
  active?: "Home" | "Explore" | "Messages" | "Profile";
  title?: string;
  notifications?: number;
  highlightStart?: boolean;
}) {
  const items = [
    { label: "Home", Icon: Home },
    { label: "Explore", Icon: Compass },
    { label: "Messages", Icon: MessageSquare },
    { label: "Profile", Icon: User },
  ] as const;

  return (
    <div
      className="relative flex flex-shrink-0 items-center justify-between px-3.5"
      style={{
        height: 46,
        background: HEADER_BG,
        borderBottom: "1px solid rgba(139,92,246,0.18)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: 1,
          background:
            "linear-gradient(90deg, transparent 5%, rgba(139,92,246,0.5) 50%, transparent 95%)",
        }}
      />

      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 26,
            height: 26,
            background: `linear-gradient(140deg, ${MAGENTA}, ${VIOLET})`,
            border: "1px solid rgba(139,92,246,0.45)",
            boxShadow: "0 0 10px rgba(139,92,246,0.35)",
            fontSize: 12,
          }}
        >
          📍
        </div>
        <div className="leading-none">
          <div
            className="font-display font-bold"
            style={{
              fontSize: 13,
              background: `linear-gradient(135deg, #FF5A36 0%, ${MAGENTA} 50%, ${VIOLET} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Wanderers
          </div>
          <div
            className="mt-0.5 flex items-center gap-1 font-bold uppercase"
            style={{ fontSize: 6.5, letterSpacing: "0.16em", color: "#A5A5B8" }}
          >
            {title ? (
              title
            ) : (
              <>
                <MapPin size={6} style={{ color: VIOLET }} /> University of Waterloo
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-0.5 rounded-xl p-1"
        style={{
          background: "linear-gradient(165deg, rgba(28,22,42,0.85), rgba(10,8,16,0.9))",
          border: "1px solid rgba(139,92,246,0.14)",
        }}
      >
        {items.map(({ label, Icon }) => {
          const isActive = label === active;
          return (
            <div
              key={label}
              className="relative flex items-center gap-1 rounded-lg px-2 py-1 font-semibold"
              style={{ fontSize: 8.5, color: isActive ? "#0a0a14" : "#A5A5B8" }}
            >
              {isActive && (
                // Deliberately not a shared layoutId: scenes crossfade, so two
                // top bars can be mounted at once and would fight over it.
                <div
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: `linear-gradient(145deg,#f472c8,${MAGENTA} 50%,#a3187a)`,
                    boxShadow: "0 3px 10px rgba(224,51,158,0.4)",
                  }}
                />
              )}
              <Icon size={9} className="relative z-10" />
              <span className="relative z-10">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        <motion.div
          animate={
            highlightStart
              ? { boxShadow: ["0 0 0 rgba(224,51,158,0)", "0 0 14px rgba(224,51,158,0.75)", "0 0 0 rgba(224,51,158,0)"] }
              : {}
          }
          transition={{ duration: 1.4, repeat: highlightStart ? Infinity : 0 }}
          className="flex items-center rounded-lg px-2 font-bold text-white"
          style={{
            height: 22,
            fontSize: 8.5,
            background: `linear-gradient(135deg, ${VIOLET}, ${MAGENTA})`,
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          Start Something
        </motion.div>
        <div
          className="relative flex items-center justify-center rounded-lg"
          style={{
            width: 22,
            height: 22,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
          }}
        >
          <Bell size={10} style={{ color: "#A5A5B8" }} />
          {notifications > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute flex items-center justify-center rounded-full font-bold text-white"
              style={{
                top: -3,
                right: -3,
                width: 11,
                height: 11,
                fontSize: 7,
                background: `linear-gradient(135deg, ${VIOLET}, ${MAGENTA})`,
                boxShadow: "0 0 8px rgba(224,51,158,0.6)",
              }}
            >
              {notifications}
            </motion.div>
          )}
        </div>
        <GradientAvatar initials={DEMO_USER.initials} size={22} />
      </div>
    </div>
  );
}

/** Section kicker used across the app screens. */
export function Kicker({ children, color = "#ffb56b" }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className="font-bold uppercase"
      style={{ fontSize: 7.5, letterSpacing: "0.18em", color }}
    >
      {children}
    </div>
  );
}

/** The live "University of Waterloo · Live" pill from the home hero. */
export function LivePill() {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-1"
      style={{
        background: "rgba(10,7,5,0.7)",
        border: "1px solid rgba(255,122,26,0.3)",
      }}
    >
      <span className="relative flex" style={{ width: 5, height: 5 }}>
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full"
          style={{ background: "#4ade80", opacity: 0.6 }}
        />
        <span className="relative inline-flex rounded-full" style={{ width: 5, height: 5, background: "#4ade80" }} />
      </span>
      <span
        className="font-bold uppercase"
        style={{ fontSize: 7, letterSpacing: "0.15em", color: "#FAFAFA" }}
      >
        University of Waterloo
      </span>
      <span style={{ width: 2, height: 2, borderRadius: 99, background: "#55556B" }} />
      <span className="font-bold uppercase" style={{ fontSize: 7, letterSpacing: "0.15em", color: "#4ade80" }}>
        Live
      </span>
    </div>
  );
}

/** Capacity bar with an animated fill. */
export function CapacityBar({
  pct,
  from,
  to,
  height = 3,
}: {
  pct: number;
  from: string;
  to: string;
  height?: number;
}) {
  return (
    <div
      className="w-full overflow-hidden rounded-full"
      style={{ height, background: "rgba(255,255,255,0.07)" }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${from}, ${to})`, originX: 0 }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: Math.min(1, pct) }}
        transition={{ duration: 0.9, ease: EASE }}
      />
    </div>
  );
}

/** The pin cursor from globals.css, as a moving demo cursor. */
export function DemoCursor({
  x,
  y,
  clicking = false,
  visible = true,
}: {
  x: number;
  y: number;
  clicking?: boolean;
  visible?: boolean;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute z-50"
      animate={{ x, y, opacity: visible ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.6 }}
      style={{ top: 0, left: 0 }}
    >
      {clicking && (
        <motion.div
          className="absolute rounded-full"
          initial={{ scale: 0, opacity: 0.7 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          style={{
            top: -8,
            left: -8,
            width: 22,
            height: 22,
            border: `1.5px solid ${MAGENTA}`,
            background: "rgba(224,51,158,0.18)",
          }}
        />
      )}
      <svg width="17" height="17" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
        <path
          d="M12 2C8.1 2 5 5.1 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3.1-7-7-7z"
          fill="#FF5A36"
          stroke="#E0339E"
          strokeWidth="1.5"
        />
        <circle cx="12" cy="9" r="2.4" fill="#fff" />
      </svg>
    </motion.div>
  );
}

/** Text that reveals character-by-character over a time window. */
export function Typed({
  text,
  t,
  from,
  to,
  caret = false,
}: {
  text: string;
  t: number;
  from: number;
  to: number;
  caret?: boolean;
}) {
  const p = seg(t, from, to);
  const n = Math.round(p * text.length);
  return (
    <span>
      {text.slice(0, n)}
      {caret && p > 0 && p < 1 && (
        <span style={{ opacity: 0.7, color: "#ffb56b" }}>|</span>
      )}
    </span>
  );
}

/** A soft floating orb, as used behind the home + profile heroes. */
export function Orb({
  size,
  color,
  top,
  left,
}: {
  size: number;
  color: string;
  top: number | string;
  left: number | string;
}) {
  return (
    <div
      className="pointer-events-none absolute rounded-full"
      style={{
        width: size,
        height: size,
        top,
        left,
        background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
      }}
    />
  );
}
