"use client";

/**
 * START SOMETHING FAB — centered pill above the bottom nav with a continuous
 * heartbeat: scale 1 → 1.08 → 1 every 2.5s plus a sonar glow ring that expands
 * and fades (box-shadow 0 → 20px spread). The hero action; always unmissable.
 * Reduced motion: pulse + sonar dropped, static glow + tap feedback remain.
 */

import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";

export default function StartSomethingFab({ onClick }: { onClick: () => void }) {
  const reduce = useReducedMotion();

  return (
    <div className="fixed bottom-24 lg:bottom-8 left-0 right-0 lg:left-64 z-40 flex justify-center pointer-events-none">
      <div className="relative pointer-events-auto">
        <motion.button
          type="button"
          onClick={onClick}
          aria-label="Start Something — create a new bubble"
          className="relative flex items-center gap-2 h-13 px-7 py-3.5 rounded-full font-bold text-sm"
          style={{
            background: "linear-gradient(135deg, #ff7a1a 0%, #ffb56b 100%)",
            color: "#2a1206",
          }}
          animate={
            reduce
              ? { boxShadow: "0 0 28px rgba(255,122,26,0.35)" }
              : {
                  // heartbeat scale + sonar ping ring, in sync
                  scale: [1, 1.08, 1],
                  boxShadow: [
                    "0 0 0 0 rgba(255,122,26,0.4), 0 0 24px rgba(255,122,26,0.3)",
                    "0 0 0 20px rgba(255,122,26,0), 0 0 44px rgba(255,122,26,0.5)",
                    "0 0 0 0 rgba(255,122,26,0), 0 0 24px rgba(255,122,26,0.3)",
                  ],
                }
          }
          transition={{ duration: 2.5, repeat: reduce ? 0 : Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.93 }}
        >
          <motion.span whileHover={{ rotate: 90 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Plus className="w-4 h-4" />
          </motion.span>
          Start Something
        </motion.button>
      </div>
    </div>
  );
}
