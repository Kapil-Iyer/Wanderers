"use client";

/**
 * BUBBLE CARD - large immersive "event poster" card.
 * Category-tuned warm gradient, lit-from-within emoji, animated capacity bar,
 * layered hover depth. Designed to live in a responsive grid.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
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
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseDurationMinutes(duration: string): number {
  const hrs = duration.match(/(\d+)\s*hr/i);
  const mins = duration.match(/(\d+)\s*min/i);
  return (hrs ? Number(hrs[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0) || 60;
}

export default function BubbleCard({ bubble }: { bubble: Bubble }) {
  const mapOverlay = useMapOverlay();
  const router = useRouter();
  const { addBubbleConversation } = useConversations();
  const reduce = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const [joinedCount, setJoinedCount] = useState(bubble.joined);
  useEffect(() => {
    setJoinedCount(bubble.joined);
  }, [bubble.id, bubble.joined]);
  const zone = bubble.zone ?? bubble.distance;
  const fillPct = Math.min(1, joinedCount / Math.max(1, bubble.maxPeople));
  const spotsLeft = Math.max(0, bubble.maxPeople - joinedCount);
  const theme = getCategoryTheme(bubble.category);
  const isLive = bubble.startingIn.includes("min");
  const [joining, setJoining] = useState(false);
  const isEmpty = joinedCount === 0;
  const isRealBubble = UUID_RE.test(bubble.id);

  const handleJoin = async () => {
    if (joining) return;
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
      // Demo cards use mock IDs that are not in the DB - create a real bubble first.
      if (!isRealBubble) {
        const createRes = await fetch("/api/bubbles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            activity: bubble.title,
            zone: bubble.zone ?? bubble.distance ?? "Campus",
            duration_minutes: parseDurationMinutes(bubble.duration),
            max_members: bubble.maxPeople,
            description: bubble.description,
            emoji: bubble.emoji,
          }),
        });
        const createData = await createRes.json().catch(() => ({}));
        if (!createRes.ok || !createData.success || !createData.data?.id) {
          const err = (createData.error ?? "Could not start bubble") as string;
          toast.error(
            /unauth/i.test(err) || createRes.status === 401
              ? "Session expired - sign in again"
              : err
          );
          if (/unauth/i.test(err) || createRes.status === 401) router.push("/");
          return;
        }
        const realId = createData.data.id as string;
        const membersCount =
          typeof createData.data.members_count === "number"
            ? createData.data.members_count
            : 1;
        setJoinedCount(membersCount);
        addBubbleConversation({ ...bubble, id: realId, joined: membersCount });
        toast.success(
          membersCount <= 1
            ? `Started · ${membersCount}/${bubble.maxPeople} 🫧`
            : `Joined · ${membersCount}/${bubble.maxPeople} 🫧`
        );
        router.push("/messages");
        router.push(`/chat/bubble-${realId}`);
        return;
      }

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
            ? "Session expired - sign in again"
            : err
        );
        if (/unauth/i.test(err) || res.status === 401) router.push("/");
        return;
      }
      const membersCount =
        typeof data?.data?.members_count === "number"
          ? data.data.members_count
          : joinedCount + 1;
      setJoinedCount(membersCount);
      addBubbleConversation({ ...bubble, joined: membersCount });
      toast.success(
        membersCount <= 1
          ? `Started · ${membersCount}/${bubble.maxPeople} 🫧`
          : `Joined · ${membersCount}/${bubble.maxPeople} 🫧`
      );
      router.push("/messages");
      router.push(`/chat/bubble-${bubble.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setJoining(false);
    }
  };

  const ctaLabel = joining
    ? isEmpty
      ? "Starting…"
      : "Joining…"
    : isEmpty
      ? "Start this bubble"
      : "Join bubble";

  return (
    <div className="relative h-[300px]" style={{ perspective: "1600px" }}>
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <motion.div
          className="group relative rounded-2xl h-full flex flex-col overflow-hidden"
          style={{
            background: "linear-gradient(165deg, #16120e 0%, #0c0907 50%, #080604 100%)",
            border: "1.5px solid rgba(255,181,107,0.18)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4), 0 10px 28px -10px rgba(0,0,0,0.65)",
            backfaceVisibility: "hidden",
            pointerEvents: flipped ? "none" : "auto",
          }}
          whileHover={{
            y: -4,
            rotateX: 2,
            boxShadow: `inset 0 1px 0 ${theme.from}40, 0 14px 32px -12px ${theme.from}40, 0 0 20px ${theme.from}12`,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          {isLive && !reduce && (
            <div className="absolute inset-0 rounded-2xl pointer-events-none animate-pulse-amber" aria-hidden="true" />
          )}

          <button
            type="button"
            onClick={() => setFlipped(true)}
            aria-label="More info"
            className="absolute -top-1.5 -right-1.5 z-20 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(10,7,5,0.92)",
              border: `1px solid ${theme.accent}55`,
              color: theme.accent,
              boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            <Info className="w-3 h-3" />
          </button>

          <div
            className="relative h-24 flex items-center justify-center overflow-hidden rounded-t-2xl shrink-0"
            style={{
              background: `linear-gradient(135deg, ${theme.from}22 0%, ${theme.to}12 50%, transparent 100%), #0a0806`,
            }}
          >
            <div
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full"
              style={{ background: `radial-gradient(circle, ${theme.from}30 0%, transparent 70%)` }}
            />
            <span
              className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(0,0,0,0.35)",
                color: theme.accent,
                border: `1px solid ${theme.accent}40`,
              }}
            >
              {bubble.category}
            </span>
            {spotsLeft > 0 && spotsLeft <= 3 && (
              <span
                className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                  color: "#2a1206",
                }}
              >
                {spotsLeft} left
              </span>
            )}
            <motion.span
              className="relative z-10 text-4xl drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
              whileHover={{ y: -2 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 18 }}
            >
              {bubble.emoji}
            </motion.span>
          </div>

          <div className="p-3.5 flex flex-col flex-1 min-h-0">
            <h3
              className="font-display text-base font-bold leading-tight line-clamp-2 min-h-[2.5rem]"
              style={{ color: "var(--color-text-primary)" }}
            >
              {bubble.title}
            </h3>

            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                <MapPin className="w-3 h-3" style={{ color: theme.accent }} />
                {zone}
              </span>
              <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                <Clock className="w-3 h-3" style={{ color: theme.accent }} />
                {bubble.startingIn}
              </span>
              <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                <Users className="w-3 h-3" style={{ color: theme.accent }} />
                {joinedCount === 0
                  ? `0 people · ${bubble.maxPeople} spots`
                  : `${joinedCount}/${bubble.maxPeople}`}
              </span>
            </div>

            <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
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
              className="text-xs mt-2.5 line-clamp-2 leading-relaxed flex-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {isEmpty
                ? "Be the first wanderer - start this bubble and others can join."
                : bubble.description || "Join this bubble and meet people nearby."}
            </p>

            <div className="mt-2.5 flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{
                  background: `${theme.from}28`,
                  color: theme.accent,
                  border: `1px solid ${theme.accent}40`,
                }}
              >
                {isEmpty ? "+" : bubble.creatorAvatar}
              </div>
              <span className="text-[11px] truncate flex-1" style={{ color: "var(--color-text-secondary)" }}>
                {isEmpty ? (
                  "Open · waiting for first wanderer"
                ) : (
                  <ProfileLink
                    name={bubble.creator}
                    avatar={bubble.creatorAvatar}
                    className="text-[11px]"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {bubble.creator}
                  </ProfileLink>
                )}
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <motion.button
                type="button"
                onClick={handleJoin}
                disabled={joining}
                className="flex-1 h-9 rounded-full text-xs font-bold disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                  color: "#1a0a00",
                  boxShadow: `0 0 14px ${theme.from}28`,
                }}
                whileTap={{ scale: 0.97 }}
              >
                {ctaLabel}
              </motion.button>
              {mapOverlay ? (
                <button
                  type="button"
                  onClick={() => mapOverlay.openMap()}
                  className="h-9 px-2.5 rounded-full text-[11px] font-semibold shrink-0"
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
                  className="h-9 px-2.5 rounded-full text-[11px] font-semibold shrink-0 inline-flex items-center"
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

        <div
          className="absolute inset-0 rounded-2xl h-full flex flex-col p-3.5"
          style={{
            background: "linear-gradient(165deg, #16120e 0%, #0c0907 55%, #080604 100%)",
            border: "1px solid rgba(255,181,107,0.16)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.5)",
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
            style={{
              background: "rgba(10,7,5,0.92)",
              border: `1px solid ${theme.accent}55`,
              color: theme.accent,
              boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <span
            className="self-start text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full mb-3"
            style={{
              background: "rgba(0,0,0,0.35)",
              color: theme.accent,
              border: `1px solid ${theme.accent}40`,
            }}
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
              {joinedCount === 0
                ? `0 people · ${bubble.maxPeople} spots`
                : `${joinedCount}/${bubble.maxPeople} joined`}
              {joinedCount > 0 &&
                (spotsLeft > 0 ? ` · ${spotsLeft} spot${spotsLeft > 1 ? "s" : ""} left` : " · full")}
            </div>
          </div>

          <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{
                background: `${theme.from}28`,
                color: theme.accent,
                border: `1px solid ${theme.accent}40`,
              }}
            >
              {isEmpty ? "+" : bubble.creatorAvatar}
            </div>
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {isEmpty ? (
                "No host yet - start it to claim the spot"
              ) : (
                <>
                  Hosted by <span style={{ color: "var(--color-text-primary)" }}>{bubble.creator}</span>
                </>
              )}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
