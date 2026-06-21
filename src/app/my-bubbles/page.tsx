"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/ui/BottomNav";
import BubbleCard from "@/components/ui/BubbleCard";
import { mockBubbles, filterChips } from "@/lib/mockData";
import { Reveal, StaggerContainer, StaggerItem, AnimatedHeadline, EASE } from "@/components/motion/Reveal";

export default function MyBubblesPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const myBubbles = useMemo(() => mockBubbles.filter((_, i) => i % 2 === 0), []);

  const filteredBubbles = useMemo(() => {
    if (activeFilter === "All") return myBubbles;
    if (activeFilter === "Happening Now") return myBubbles.filter((b) => b.startingIn.includes("min"));
    if (activeFilter === "Starting Soon") return myBubbles.filter((b) => b.startingIn.includes("hr"));
    return myBubbles.filter((b) => b.category === activeFilter);
  }, [activeFilter, myBubbles]);

  return (
    <div className="min-h-screen pb-40" style={{ background: "var(--color-bg)" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-40"
        style={{ background: "rgba(9,9,11,0.8)", borderBottom: "1px solid rgba(249,115,22,0.07)", backdropFilter: "blur(16px)" }}
      >
        <div className="px-5 sm:px-8 h-14 flex items-center lg:pl-72 max-w-[1400px] mx-auto">
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>My Bubbles</span>
        </div>
      </header>

      <div className="lg:pl-64">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8">

          {/* Editorial title */}
          <section className="pt-12 pb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#F97316" }}>
              Your nights out
            </p>
            <AnimatedHeadline
              text="Bubbles you're in."
              accentWords={["in."]}
              className="font-display text-4xl sm:text-6xl font-bold leading-[1.02] tracking-tight"
            />
          </section>

          {/* Filter chips */}
          <Reveal delay={0.05}>
            <div className="flex gap-2 overflow-x-auto pb-3 -mx-5 px-5 sm:-mx-8 sm:px-8 mb-8">
              {["All", ...filterChips].map((chip) => {
                const active = activeFilter === chip;
                return (
                  <motion.button
                    key={chip}
                    type="button"
                    onClick={() => setActiveFilter(chip)}
                    className="relative px-4 py-2 rounded-full text-xs whitespace-nowrap"
                    style={{
                      background: active ? "transparent" : "rgba(255,255,255,0.04)",
                      border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)",
                      color: active ? "#1a0a00" : "var(--color-text-secondary)",
                      fontWeight: active ? 700 : 500,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    {active && (
                      <motion.div
                        layoutId="active-chip-indicator"
                        className="absolute inset-0 rounded-full"
                        style={{ background: "linear-gradient(135deg, #F97316, #FBBF24)", boxShadow: "0 0 14px rgba(249,115,22,0.28)" }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{chip}</span>
                  </motion.button>
                );
              })}
            </div>
          </Reveal>

          {/* Grid */}
          <AnimatePresence mode="wait">
            {filteredBubbles.length > 0 ? (
              <StaggerContainer key={activeFilter} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 pb-10">
                {filteredBubbles.map((b) => (
                  <StaggerItem key={b.id}>
                    <BubbleCard bubble={b} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <motion.div
                key="empty"
                className="text-center py-24"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <div className="text-6xl mb-4">🫧</div>
                <p className="text-lg font-display font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {myBubbles.length === 0 ? "No bubbles yet" : "Nothing matches this filter"}
                </p>
                <p className="text-sm mt-1.5" style={{ color: "var(--color-text-secondary)" }}>
                  {myBubbles.length === 0 ? "Join or create one from the home page!" : "Try a different filter."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
