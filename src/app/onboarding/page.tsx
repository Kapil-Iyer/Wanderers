"use client";

/**
 * ONBOARDING PAGE — "Who are you on campus?" vibe identity card layout
 * Visual revamp only. Underlying logic: stores selected interest tags in state,
 * same flow as before (→ /home on confirm). No data model changes.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

/* ── Vibe identity cards ── */
const vibeCards = [
  {
    id: "late-night-grinder",
    label: "Late Night Grinder",
    emoji: "🌙",
    desc: "DC at 2am, energy drinks, the grind never stops",
    interests: ["📚 Studying", "🧑‍💻 Coding"],
    bg: "linear-gradient(160deg, #1a0533 0%, #0f0020 50%, #200a00 100%)",
    accent: "#c084fc",
    particle: "⚡",
  },
  {
    id: "coffee-shop-regular",
    label: "Coffee Shop Regular",
    emoji: "☕",
    desc: "SLC, your corner table, oat milk flat white, vibes only",
    interests: ["☕ Coffee", "📷 Photography"],
    bg: "linear-gradient(160deg, #1a0d00 0%, #2d1600 50%, #0f0800 100%)",
    accent: "#fbbf24",
    particle: "✨",
  },
  {
    id: "pickup-sports-guy",
    label: "Pick-up Sports Guy",
    emoji: "🏀",
    desc: "PAC courts, 3v3, doesn't matter who — let's run it",
    interests: ["🏀 Basketball", "⚽ Soccer", "🏃 Running", "🏊 Swimming"],
    bg: "linear-gradient(160deg, #001a0d 0%, #00200f 50%, #001008 100%)",
    accent: "#4ade80",
    particle: "🔥",
  },
  {
    id: "study-buddy",
    label: "Study Buddy",
    emoji: "📖",
    desc: "Group rooms, shared notes, accountability partners",
    interests: ["📚 Studying", "🧑‍💻 Coding", "🎲 Board Games"],
    bg: "linear-gradient(160deg, #00101a 0%, #001520 50%, #000d14 100%)",
    accent: "#38bdf8",
    particle: "💡",
  },
  {
    id: "explorer",
    label: "Explorer",
    emoji: "🧭",
    desc: "Hikes, open mics, random events — if it's new, you're in",
    interests: ["🥾 Hiking", "🎵 Music", "🎭 Theater", "🎨 Arts"],
    bg: "linear-gradient(160deg, #120a00 0%, #1a0d00 50%, #0d0600 100%)",
    accent: "#f97316",
    particle: "🌟",
  },
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => router.push("/home"), 600);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)" }}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-30"
          style={{ background: "radial-gradient(ellipse, rgba(249,115,22,0.12) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 flex flex-col flex-1 max-w-xl mx-auto w-full px-5 pt-12 pb-10">

        {/* Header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, filter: "blur(12px)", y: 28 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.7, ease }}
        >
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2"
            style={{ color: "var(--color-accent-start)" }}>
            step 1 of 1
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight"
            style={{ color: "var(--color-text-primary)" }}>
            Who are you
            <br />
            <span className="text-gradient">on campus?</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Pick all that fit — we'll match you with your kind of bubbles.
          </p>
        </motion.div>

        {/* Identity cards */}
        <div className="flex flex-col gap-3 flex-1">
          {vibeCards.map((card, i) => {
            const isSelected = selected.has(card.id);
            return (
              <motion.button
                key={card.id}
                type="button"
                onClick={() => toggle(card.id)}
                className="relative overflow-hidden text-left rounded-2xl p-5"
                style={{
                  background: card.bg,
                  border: isSelected
                    ? `1.5px solid ${card.accent}`
                    : "1.5px solid rgba(255,255,255,0.06)",
                  boxShadow: isSelected
                    ? `0 0 28px ${card.accent}30, inset 0 1px 0 ${card.accent}20`
                    : "0 1px 3px rgba(0,0,0,0.4)",
                }}
                initial={{ opacity: 0, filter: "blur(12px)", y: 28 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.09, ease }}
                whileHover={{ y: -4, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Warm photo texture overlay */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    background: isSelected
                      ? `radial-gradient(ellipse at 80% 20%, ${card.accent}18 0%, transparent 60%)`
                      : "radial-gradient(ellipse at 80% 20%, rgba(249,115,22,0.05) 0%, transparent 60%)",
                  }} />

                <div className="relative flex items-center gap-4">
                  {/* Big emoji */}
                  <motion.div
                    className="text-4xl shrink-0"
                    whileHover={{ y: -3 }}
                    transition={{ delay: 0.1 }}
                  >
                    {card.emoji}
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base" style={{ color: "var(--color-text-primary)" }}>
                        {card.label}
                      </span>
                      {/* Interest tags */}
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${card.accent}18`, color: card.accent, border: `1px solid ${card.accent}30` }}>
                        {card.interests.length} interests
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--color-text-secondary)" }}>
                      {card.desc}
                    </p>
                  </div>

                  {/* Check / particle */}
                  <AnimatePresence mode="wait">
                    {isSelected ? (
                      <motion.div
                        key="check"
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `linear-gradient(135deg, #F97316, #FBBF24)` }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="particle"
                        className="text-xl shrink-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                      >
                        {card.particle}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease }}
        >
          <motion.button
            type="button"
            onClick={handleConfirm}
            disabled={selected.size === 0 || confirmed}
            className="w-full h-13 py-3.5 rounded-full font-bold text-base relative overflow-hidden"
            style={{
              background: selected.size > 0
                ? "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)"
                : "rgba(255,255,255,0.06)",
              color: selected.size > 0 ? "#1a0a00" : "var(--color-text-muted)",
              boxShadow: selected.size > 0 ? "0 0 32px rgba(249,115,22,0.3)" : "none",
              cursor: selected.size === 0 ? "not-allowed" : "pointer",
            }}
            whileHover={selected.size > 0 ? { scale: 1.03 } : {}}
            whileTap={selected.size > 0 ? { scale: 0.97 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {confirmed ? "Finding your people…" : selected.size === 0
              ? "Pick at least one"
              : `I'm all of these (${selected.size} selected) →`}
          </motion.button>
          <p className="text-center text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>
            You can always update this from your profile
          </p>
        </motion.div>
      </div>
    </div>
  );
}
