"use client";

/**
 * BUBBLE CARD — large immersive "event poster" card.
 * Category-tuned warm gradient, lit-from-within emoji, animated capacity bar,
 * layered hover depth. Designed to live in a responsive grid.
 */

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Bubble } from "@/lib/mockData";
import { getCategoryTheme } from "@/lib/categoryThemes";
import { useMapOverlay } from "@/contexts/MapOverlayContext";
import { ProfileLink } from "@/components/ProfileLink";
import { Users, Clock, MapPin } from "lucide-react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export default function BubbleCard({ bubble }: { bubble: Bubble }) {
  const mapOverlay = useMapOverlay();
  const reduce = useReducedMotion();
  const zone = bubble.zone ?? bubble.distance;
  const fillPct = Math.min(1, bubble.joined / bubble.maxPeople);
  const spotsLeft = Math.max(0, bubble.maxPeople - bubble.joined);
  const theme = getCategoryTheme(bubble.category);
  const isLive = bubble.startingIn.includes("min");

  return (
    <motion.div
      className="group relative rounded-3xl h-full flex flex-col"
      style={{
        background: `linear-gradient(165deg, ${theme.tint} 0%, rgba(255,255,255,0.02) 45%)`,
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.4)",
      }}
      whileHover={{
        y: -7,
        scale: 1.018,
        boxShadow: `inset 0 1px 0 ${theme.from}40, 0 24px 60px -16px ${theme.from}45, 0 0 32px ${theme.from}18`,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {/* ambient breathing glow for live bubbles — separate layer so the CSS
          keyframe never fights Framer's hover box-shadow on the card itself */}
      {isLive && !reduce && (
        <div className="absolute inset-0 rounded-3xl pointer-events-none animate-pulse-amber" aria-hidden="true" />
      )}

      {/* Poster header */}
      <div
        className="relative h-36 flex items-center justify-center overflow-hidden rounded-t-3xl"
        style={{ background: `linear-gradient(135deg, ${theme.from}38 0%, ${theme.to}22 60%, transparent 100%)` }}
      >
        {/* glow pool */}
        <div
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full"
          style={{ background: `radial-gradient(circle, ${theme.from}30 0%, transparent 70%)` }}
        />
        {/* category tag */}
        <span
          className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full"
          style={{ background: "rgba(0,0,0,0.35)", color: theme.accent, border: `1px solid ${theme.accent}40` }}
        >
          {bubble.category}
        </span>
        {/* spots-left badge */}
        {spotsLeft > 0 && spotsLeft <= 3 && (
          <span
            className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`, color: "#1a0a00" }}
          >
            {spotsLeft} spot{spotsLeft > 1 ? "s" : ""} left
          </span>
        )}
        {/* emoji — secondary layered hover */}
        <motion.span
          className="relative z-10 text-6xl drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
          whileHover={{ y: -3 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 18 }}
        >
          {bubble.emoji}
        </motion.span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display text-lg font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>
          {bubble.title}
        </h3>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <MapPin className="w-3.5 h-3.5" style={{ color: theme.accent }} />{zone}
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <Clock className="w-3.5 h-3.5" style={{ color: theme.accent }} />{bubble.startingIn}
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <Users className="w-3.5 h-3.5" style={{ color: theme.accent }} />{bubble.joined}/{bubble.maxPeople}
          </span>
        </div>

        {/* Capacity bar */}
        <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`, originX: 0 }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: fillPct }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          />
        </div>

        <p className="text-sm mt-4 line-clamp-2 leading-relaxed flex-1" style={{ color: "var(--color-text-secondary)" }}>
          {bubble.description}
        </p>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: `${theme.from}28`, color: theme.accent, border: `1px solid ${theme.accent}40` }}
            >
              {bubble.creatorAvatar}
            </div>
            <ProfileLink
              name={bubble.creator}
              avatar={bubble.creatorAvatar}
              className="text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {bubble.creator}
            </ProfileLink>
          </div>

          {mapOverlay ? (
            <motion.button
              type="button"
              onClick={() => mapOverlay.openMap()}
              className="px-4 py-2 rounded-full text-xs font-bold"
              style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`, color: "#1a0a00", boxShadow: `0 0 16px ${theme.from}30` }}
              whileHover={{ scale: 1.06, boxShadow: `0 0 24px ${theme.from}55` }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              View Map
            </motion.button>
          ) : (
            <Link href="/map">
              <motion.span
                className="px-4 py-2 rounded-full text-xs font-bold inline-block"
                style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`, color: "#1a0a00", boxShadow: `0 0 16px ${theme.from}30` }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                View Map
              </motion.span>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
