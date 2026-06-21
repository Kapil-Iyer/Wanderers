"use client";

/**
 * ROUTE TRANSITION — App Router template.tsx re-mounts on every navigation,
 * giving each route a clean cross-fade entrance.
 *
 * IMPORTANT: this wrapper animates OPACITY ONLY. Animating transform/filter
 * here (e.g. blur-slide-up) would make this element a containing block for any
 * `position: fixed` descendant — breaking the FAB, bottom nav, and drawers.
 * The dramatic blur-slide-up entrances live in the in-page Reveal / Stagger /
 * AnimatedHeadline components instead, where they don't affect fixed layout.
 */

import { motion, useReducedMotion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0.2 : 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
