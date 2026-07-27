"use client";

/**
 * BUBBLE CARD — event poster card with Join + View Map actions.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import type { Bubble } from "@/lib/mockData";
import { getCategoryTheme } from "@/lib/categoryThemes";
import { useMapOverlay } from "@/contexts/MapOverlayContext";
import { useConversations } from "@/contexts/ConversationsContext";
import { ProfileLink } from "@/components/ProfileLink";
import { supabase } from "@/lib/supabase";
import { Users, Clock, MapPin } from "lucide-react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export default function BubbleCard({ bubble }: { bubble: Bubble }) {
  const mapOverlay = useMapOverlay();
  const router = useRouter();
  const { addBubbleConversation } = useConversations();
  const reduce = useReducedMotion();
  const zone = bubble.zone ?? bubble.distance;
  const fillPct = Math.min(1, bubble.joined / Math.max(1, bubble.maxPeople));
  const spotsLeft = Math.max(0, bubble.maxPeople - bubble.joined);
  const theme = getCategoryTheme(bubble.category);
  const isLive = bubble.startingIn.includes("min");
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (joining) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      toast.error("Sign in to join a bubble");
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
        toast.error(data.error ?? "Could not join");
        return;
      }
      const membersCount =
        typeof data?.data?.members_count === "number"
          ? data.data.members_count
          : bubble.joined + 1;
      addBubbleConversation({ ...bubble, joined: membersCount });
      toast.success(`Joined · ${membersCount}/${bubble.maxPeople} 🫧`);
      router.push(`/chat/bubble-${bubble.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setJoining(false);
    }
  };

  return (
    <motion.div
      className="group relative rounded-3xl h-full flex flex-col"
      style={{
        background: `linear-gradient(165deg, ${theme.tint} 0%, rgba(255,255,255,0.02) 45%)`,
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
      }}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
    >
      {isLive && !reduce && (
        <div className="absolute inset-0 rounded-3xl pointer-events-none animate-pulse-amber" aria-hidden="true" />
      )}

      <div
        className="relative h-32 flex items-center justify-center overflow-hidden rounded-t-3xl"
        style={{ background: `linear-gradient(135deg, ${theme.from}30 0%, ${theme.to}18 70%, transparent 100%)` }}
      >
        <span
          className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full"
          style={{ background: "rgba(0,0,0,0.4)", color: theme.accent, border: `1px solid ${theme.accent}40` }}
        >
          {bubble.category}
        </span>
        {spotsLeft > 0 && spotsLeft <= 3 && (
          <span
            className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`, color: "#1a0a00" }}
          >
            {spotsLeft} spot{spotsLeft > 1 ? "s" : ""} left
          </span>
        )}
        <span className="relative z-10 text-5xl">{bubble.emoji}</span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display text-lg font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>
          {bubble.title}
        </h3>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <MapPin className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            {zone}
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <Clock className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            {bubble.startingIn}
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <Users className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            {bubble.joined}/{bubble.maxPeople}
          </span>
        </div>

        <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`, originX: 0 }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: fillPct }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          />
        </div>

        <p className="text-sm mt-4 line-clamp-2 leading-relaxed flex-1" style={{ color: "var(--color-text-secondary)" }}>
          {bubble.description}
        </p>

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
  );
}
