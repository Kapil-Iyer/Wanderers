"use client";

/**
 * SPLASH INTRO - one-time cinematic entry (landing page only).
 *
 * Story (fills the motto "Find your people. Start something."):
 *   1. the pin logo blooms + its outline draws itself
 *   2. a WIDE glowing trail unrolls up through the pin (a road, not a thin line)
 *   3. a little wanderer strides up the trail
 *   4. at the summit they plant an orange flag that unfurls and waves
 *   5. two companions appear beside them - you've found your people
 *   6. "Wanderers" + tagline reveal, then the lockup hands off to the AuthModal
 *
 * Plays once per session (sessionStorage). Reduced motion → calm fade, final
 * frame composed statically.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
export const SPLASH_KEY = "wanderers-splash-seen";

const PIN_PATH =
  "M50 95 C50 95 15 66 15 42 C15 22.7 30.7 8 50 8 C69.3 8 85 22.7 85 42 C85 66 50 95 50 95 Z";
// Wide winding trail from the pin tip up to the summit.
const TRAIL_PATH = "M50 90 C38 78 62 70 50 60 C40 51 60 47 50 40";
const SUMMIT = { x: 50, y: 40 };

export default function SplashIntro({ onComplete }: { onComplete: () => void }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"play" | "exit">("play");

  useEffect(() => {
    const exitAt = setTimeout(() => setPhase("exit"), reduce ? 1700 : 4200);
    const doneAt = setTimeout(onComplete, reduce ? 2200 : 4900);
    return () => { clearTimeout(exitAt); clearTimeout(doneAt); };
  }, [onComplete, reduce]);

  return (
    <AnimatePresence>
      {phase === "play" && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: "#050505" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={
            reduce
              ? { opacity: 0, transition: { duration: 0.5 } }
              : { opacity: 0, scale: 0.92, y: -48, filter: "blur(8px)", transition: { duration: 0.7, ease: EASE } }
          }
          transition={{ duration: 0.5 }}
        >
          {/* aurora bloom behind the lockup */}
          <motion.div
            className="absolute w-[520px] h-[520px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 65%)" }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduce ? 0 : 0.9, duration: 1.2, ease: EASE }}
          />

          <svg width="150" height="156" viewBox="0 0 100 103" fill="none" aria-hidden="true">
            <defs>
              {/* Matches the logo pin's own amber (top) -> magenta -> violet (bottom) blend */}
              <linearGradient id="splash-amber" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="55%" stopColor="#E0339E" />
                <stop offset="100%" stopColor="#FF9130" />
              </linearGradient>
              <linearGradient id="splash-trail" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#4c1d95" />
                <stop offset="100%" stopColor="#E0339E" />
              </linearGradient>
              <radialGradient id="splash-fill" cx="50%" cy="40%" r="65%">
                <stop offset="0%" stopColor="rgba(224,51,158,0.4)" />
                <stop offset="55%" stopColor="rgba(139,92,246,0.24)" />
                <stop offset="100%" stopColor="rgba(139,92,246,0.04)" />
              </radialGradient>
            </defs>

            {/* gradient fill bloom inside the pin */}
            <motion.path
              d={PIN_PATH}
              fill="url(#splash-fill)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduce ? 0.1 : 1.0, duration: 0.9, ease: EASE }}
            />

            {/* pin outline traces itself */}
            <motion.path
              d={PIN_PATH}
              stroke="url(#splash-amber)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0.9 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: reduce ? 0 : 1.2, ease: "easeInOut" }}
            />

            {/* WIDE glowing trail - soft outer glow + bright core */}
            <motion.path
              d={TRAIL_PATH}
              stroke="url(#splash-trail)"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
              opacity={0.25}
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: reduce ? 0.1 : 0.8, duration: reduce ? 0 : 0.8, ease: EASE }}
              style={{ filter: "blur(2px)" }}
            />
            <motion.path
              d={TRAIL_PATH}
              stroke="url(#splash-trail)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: reduce ? 0.1 : 0.8, duration: reduce ? 0 : 0.8, ease: EASE }}
            />
            {/* dashed centre line for a "road" read */}
            <motion.path
              d={TRAIL_PATH}
              stroke="rgba(255,245,225,0.9)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray="2 4"
              fill="none"
              initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.8 }}
              transition={{ delay: reduce ? 0.1 : 1.0, duration: reduce ? 0 : 0.7 }}
            />

            {/* wanderer striding up the trail */}
            {!reduce && (
              <motion.g
                initial={{ offsetDistance: "0%", opacity: 0 }}
                animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 1] }}
                transition={{ delay: 1.5, duration: 1.3, ease: "easeInOut", times: [0, 0.12, 0.9, 1] }}
                style={{ offsetPath: `path("${TRAIL_PATH}")`, offsetRotate: "0deg" }}
              >
                <circle cx="0" cy="-4" r="1.6" fill="#FAFAFA" />
                <line x1="0" y1="-2.4" x2="0" y2="1.4" stroke="#FAFAFA" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="0" y1="1.4" x2="-2" y2="5" stroke="#FAFAFA" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="0" y1="1.4" x2="2" y2="4.6" stroke="#FAFAFA" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="0" y1="-1.2" x2="-1.8" y2="0.8" stroke="#FAFAFA" strokeWidth="1" strokeLinecap="round" />
                <line x1="0" y1="-1.2" x2="1.8" y2="-0.6" stroke="#FAFAFA" strokeWidth="1" strokeLinecap="round" />
              </motion.g>
            )}

            {/* companions appear at the summit - "find your people" */}
            {!reduce && [{ dx: -9, d: 2.95 }, { dx: 8, d: 3.1 }].map((c, i) => (
              <motion.g
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 0.85, y: 0 }}
                transition={{ delay: c.d, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <circle cx={SUMMIT.x + c.dx} cy={SUMMIT.y - 3.5} r="1.3" fill="#E0339E" />
                <line x1={SUMMIT.x + c.dx} y1={SUMMIT.y - 2.2} x2={SUMMIT.x + c.dx} y2={SUMMIT.y + 1.4}
                  stroke="#E0339E" strokeWidth="1" strokeLinecap="round" />
              </motion.g>
            ))}

            {/* flagpole rises at the summit */}
            <motion.line
              x1={SUMMIT.x} y1={SUMMIT.y} x2={SUMMIT.x} y2={SUMMIT.y - 18}
              stroke="#E5E7EB" strokeWidth="1.4" strokeLinecap="round"
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: reduce ? 0.2 : 2.75, duration: reduce ? 0 : 0.3, ease: "easeOut" }}
              style={{ transformOrigin: `${SUMMIT.x}px ${SUMMIT.y}px` }}
            />
            {/* orange flag unfurls + waves */}
            <motion.path
              d={`M${SUMMIT.x} ${SUMMIT.y - 18} L${SUMMIT.x + 15} ${SUMMIT.y - 14.5} L${SUMMIT.x} ${SUMMIT.y - 11} Z`}
              fill="url(#splash-amber)"
              initial={reduce ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
              animate={
                reduce
                  ? { scaleX: 1, opacity: 1 }
                  : { scaleX: 1, opacity: 1, skewX: [0, -6, 4, -2, 0] }
              }
              transition={{
                delay: reduce ? 0.2 : 3.0,
                duration: reduce ? 0 : 0.6,
                ease: [0.34, 1.56, 0.64, 1],
                skewX: { delay: 3.3, duration: 1.0, ease: "easeInOut" },
              }}
              style={{ transformOrigin: `${SUMMIT.x}px ${SUMMIT.y - 14.5}px`, filter: "drop-shadow(0 0 4px rgba(139,92,246,0.6))" }}
            />
            {/* spark at the flag */}
            {!reduce && (
              <motion.circle
                cx={SUMMIT.x} cy={SUMMIT.y - 18} r="2.4" fill="#E0339E"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.8, 1], opacity: [0, 1, 0.9] }}
                transition={{ delay: 3.0, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ transformOrigin: `${SUMMIT.x}px ${SUMMIT.y - 18}px`, filter: "drop-shadow(0 0 5px rgba(224,51,158,0.9))" }}
              />
            )}
          </svg>

          {/* Wordmark */}
          <motion.h1
            className="font-display text-5xl font-bold mt-6"
            style={{ color: "#FAFAFA" }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(12px)", y: 24 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ delay: reduce ? 0.3 : 3.3, duration: 0.7, ease: EASE }}
          >
            Wanderers
          </motion.h1>

          <motion.p
            className="text-[11px] font-bold uppercase mt-3"
            style={{ color: "var(--color-text-primary)" }}
            initial={{ opacity: 0, letterSpacing: reduce ? "0.32em" : "0.08em" }}
            animate={{ opacity: 1, letterSpacing: "0.32em" }}
            transition={{ delay: reduce ? 0.4 : 3.6, duration: 0.7, ease: EASE }}
          >
            - Find your people -
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
