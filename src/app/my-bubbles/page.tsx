"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/ui/BottomNav";
import AppHeader from "@/components/ui/AppHeader";
import BubbleCard from "@/components/ui/BubbleCard";
import { mockBubbles, filterChips } from "@/lib/mockData";
import { Reveal, StaggerContainer, StaggerItem, AnimatedHeadline, EASE } from "@/components/motion/Reveal";
import { useSidebar } from "@/contexts/SidebarContext";

export default function MyBubblesPage() {
  const { expanded: sidebarExpanded } = useSidebar();
  const [activeFilter, setActiveFilter] = useState("All");
  const myBubbles = useMemo(() => mockBubbles.filter((_, i) => i % 2 === 0), []);

  const filteredBubbles = useMemo(() => {
    if (activeFilter === "All") return myBubbles;
    if (activeFilter === "Happening Now") return myBubbles.filter((b) => b.startingIn.includes("min"));
    if (activeFilter === "Starting Soon") return myBubbles.filter((b) => b.startingIn.includes("hr"));
    return myBubbles.filter((b) => b.category === activeFilter);
  }, [activeFilter, myBubbles]);

  return (
    <div className="min-h-screen pb-12 relative">
      <AppHeader title="Explore" />

      <div className={`relative z-10 transition-[padding] duration-300 ease-out ${sidebarExpanded ? "lg:pl-64" : "lg:pl-3"}`}>
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8">

          {/* Editorial title */}
          <section className="pt-12 pb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--color-text-primary)" }}>
              Around campus
            </p>
            <AnimatedHeadline
              text="Explore bubbles here."
              accentWords={["here."]}
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
                      background: active ? "transparent" : "rgba(10,7,5,0.6)",
                      border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.14)",
                      color: active ? "#2a1206" : "var(--color-text-primary)",
                      fontWeight: active ? 700 : 600,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    {active && (
                      <motion.div
                        layoutId="active-chip-indicator"
                        className="absolute inset-0 rounded-full"
                        style={{ background: "linear-gradient(135deg, #ff7a1a, #ffb56b)", boxShadow: "0 0 14px rgba(255,122,26,0.28)" }}
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
              <StaggerContainer key={activeFilter} className="grid grid-cols-3 gap-3 sm:gap-4 auto-rows-fr pb-10">
                {filteredBubbles.map((b) => (
                  <StaggerItem key={b.id} className="h-full">
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
