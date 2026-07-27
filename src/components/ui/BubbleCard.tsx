"use client";

/**
 * BUBBLE CARD — large immersive "event poster" card.
 * Category-tuned warm gradient, lit-from-within emoji, animated capacity bar,
 * layered hover depth. Designed to live in a responsive grid.
 */

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import type { Bubble } from "@/lib/mockData";
import { getCategoryTheme } from "@/lib/categoryThemes";
import { useMapOverlay } from "@/contexts/MapOverlayContext";
import { useConversations } from "@/contexts/ConversationsContext";
import { ProfileLink } from "@/components/ProfileLink";
import { supabase } from "@/lib/supabase";
import { Users, Clock, MapPin, Info, X } from "lucide-react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export default function BubbleCard({ bubble }: { bubble: Bubble }) {
  const mapOverlay = useMapOverlay();
  const router = useRouter();
  const { addBubbleConversation } = useConversations();
  const reduce = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const zone = bubble.zone ?? bubble.distance;
  const fillPct = Math.min(1, bubble.joined / Math.max(1, bubble.maxPeople));
  const spotsLeft = Math.max(0, bubble.maxPeople - bubble.joined);
  const theme = getCategoryTheme(bubble.category);
  const isLive = bubble.startingIn.includes("min");
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (joining) return;
    // Refresh so we don't send an expired access token
    const { data: refreshed } = await supabase.auth.refreshSession();
    const token =
      refreshed.session?.access_token ??
      (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) {
      toast.error("Sign in to join a bubble");
      router.push("/");
      return;
    }
    setJoining(true);
    try {
      const res = await fetch("/api/bubbles/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bubble_id: bubble.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        const err = (data.error ?? "Could not join") as string;
        toast.error(
          /unauth/i.test(err) || res.status === 401
            ? "Session expired — sign in again"
            : err
        );
        if (/unauth/i.test(err) || res.status === 401) router.push("/");
        return;
      }
      const membersCount =
        typeof data?.data?.members_count === "number"
          ? data.data.members_count
          : bubble.joined + 1;
      addBubbleConversation({ ...bubble, joined: membersCount });
      toast.success(`Joined · ${membersCount}/${bubble.maxPeople} 🫧`);
      // Stack Messages under chat so Back / browser-back lands on /messages, not Home
      router.push("/messages");
      router.push(`/chat/bubble-${bubble.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="relative h-[420px]" style={{ perspective: "1600px" }}>
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {/* ── FRONT — fixed height so new events match every other card ── */}
        <motion.div
          className="group relative rounded-3xl h-full flex flex-col overflow-hidden"
          style={{
            background: `linear-gradient(165deg, ${theme.tint} 0%, rgba(10,7,5,0.95) 45%)`,
            border: "1.5px solid rgba(255,181,107,0.18)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.35), 0 10px 28px -10px rgba(0,0,0,0.55)",
            backfaceVisibility: "hidden",
            pointerEvents: flipped ? "none" : "auto",
          }}
          whileHover={{
            y: -5,
            rotateX: 2,
            boxShadow: `inset 0 1px 0 ${theme.from}40, 0 18px 40px -14px ${theme.from}40, 0 0 24px ${theme.from}14`,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          {/* ambient breathing glow for live bubbles — separate layer so the CSS
              keyframe never fights Framer's hover box-shadow on the card itself */}
          {isLive && !reduce && (
            <div className="absolute inset-0 rounded-3xl pointer-events-none animate-pulse-amber" aria-hidden="true" />
          )}

          {/* info toggle — flips the card to reveal details */}
          <button
            type="button"
            onClick={() => setFlipped(true)}
            aria-label="More info"
            className="absolute -top-2 -right-2 z-20 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(10,7,5,0.92)", border: `1px solid ${theme.accent}55`, color: theme.accent, boxShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {/* Poster header */}
          <div
            className="relative h-36 flex items-center justify-center overflow-hidden rounded-t-3xl"
            style={{ background: `linear-gradient(135deg, ${theme.from}38 0%, ${theme.to}22 60%, transparent 100%), rgba(8,6,4,0.97)` }}
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
                style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`, color: "#2a1206" }}
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
            <h3
              className="font-display text-lg font-bold leading-tight line-clamp-2 min-h-[2.75rem]"
              style={{ color: "var(--color-text-primary)" }}
            >
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

            <p
              className="text-sm mt-4 line-clamp-2 leading-relaxed min-h-[2.5rem]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {bubble.description || "Join this bubble and meet people nearby."}
            </p>

            {/* Footer — creator */}
            <div className="mt-5 flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: `${theme.from}28`, color: theme.accent, border: `1px solid ${theme.accent}40` }}
              >
                {bubble.creatorAvatar}
              </div>
              <ProfileLink
                name={bubble.creator}
                avatar={bubble.creatorAvatar}
                className="text-xs truncate flex-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {bubble.creator}
              </ProfileLink>
            </div>

            {/* Actions — Join + Map */}
            <div className="mt-4 flex items-center gap-2">
              <motion.button
                type="button"
                onClick={handleJoin}
                disabled={joining}
                className="flex-1 h-11 rounded-full text-sm font-bold disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                  color: "#1a0a00",
                  boxShadow: `0 0 16px ${theme.from}28`,
                }}
                whileTap={{ scale: 0.97 }}
              >
                {joining ? "Joining…" : "Join bubble"}
              </motion.button>
              {mapOverlay ? (
                <button
                  type="button"
                  onClick={() => mapOverlay.openMap()}
                  className="h-11 px-3 rounded-full text-xs font-semibold shrink-0"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Map
                </button>
              ) : (
                <Link
                  href="/map"
                  className="h-11 px-3 rounded-full text-xs font-semibold shrink-0 inline-flex items-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Map
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── BACK — info face ── */}
        <div
          className="absolute inset-0 rounded-3xl h-full flex flex-col p-5"
          style={{
            background: `linear-gradient(165deg, ${theme.tint} 0%, rgba(10,7,5,0.97) 45%)`,
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.4)",
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            pointerEvents: flipped ? "auto" : "none",
          }}
        >
          <button
            type="button"
            onClick={() => setFlipped(false)}
            aria-label="Close info"
            className="absolute -top-2 -right-2 z-20 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(10,7,5,0.92)", border: `1px solid ${theme.accent}55`, color: theme.accent, boxShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <span
            className="self-start text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full mb-3"
            style={{ background: "rgba(0,0,0,0.35)", color: theme.accent, border: `1px solid ${theme.accent}40` }}
          >
            {bubble.category}
          </span>

          <h3 className="font-display text-lg font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>
            {bubble.emoji} {bubble.title}
          </h3>

          <p className="text-sm mt-3 leading-relaxed flex-1 overflow-y-auto" style={{ color: "var(--color-text-secondary)" }}>
            {bubble.description}
          </p>

          <div className="mt-4 space-y-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accent }} />
              {zone}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accent }} />
              Starts in {bubble.startingIn} · lasts {bubble.duration}
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accent }} />
              {bubble.joined}/{bubble.maxPeople} joined
              {spotsLeft > 0 ? ` · ${spotsLeft} spot${spotsLeft > 1 ? "s" : ""} left` : " · full"}
            </div>
          </div>

          <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ background: `${theme.from}28`, color: theme.accent, border: `1px solid ${theme.accent}40` }}
            >
              {bubble.creatorAvatar}
            </div>
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Hosted by <span style={{ color: "var(--color-text-primary)" }}>{bubble.creator}</span>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
