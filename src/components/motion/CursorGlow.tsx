"use client";

/**
 * CURSOR GLOW — a soft warm light that trails the pin cursor with spring lag,
 * growing when hovering interactive elements. Decorative only (pointer-events
 * none, screen blend). Fine-pointer devices only; disabled for reduced motion.
 */

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

export default function CursorGlow() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hot, setHot] = useState(false);

  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 350, damping: 28, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 350, damping: 28, mass: 0.4 });

  useEffect(() => {
    if (reduce) return;
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = e.target as Element | null;
      setHot(!!el?.closest?.('button, a, [role="button"], input, textarea, label'));
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [reduce, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        x: sx,
        y: sy,
        pointerEvents: "none",
        zIndex: 9999,
        mixBlendMode: "screen",
      }}
    >
      <motion.div
        style={{
          translateX: "-50%",
          translateY: "-50%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(249,115,22,0.22) 42%, transparent 72%)",
          filter: "blur(2px)",
        }}
        animate={{ width: hot ? 60 : 34, height: hot ? 60 : 34, opacity: hot ? 0.5 : 0.3 }}
        transition={{ type: "spring", stiffness: 250, damping: 25 }}
      />
    </motion.div>
  );
}
