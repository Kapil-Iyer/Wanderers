"use client";

/**
 * COZY CAMPFIRE BACKDROP — a heavily-blurred warm "cabin by the fire" scene for
 * the login page. Pure CSS/SVG (no external photos): a flickering fire glow pools
 * up from the bottom, soft candle/chandelier bokeh floats above, embers drift
 * upward, and a deep vignette frames it all. The whole scene sits behind a blur
 * so the auth card reads as glass over a cozy room.
 */

import { motion, useReducedMotion } from "framer-motion";

const EMBERS = [
  { left: "18%", size: 4, dur: 7, delay: 0, drift: "14px" },
  { left: "30%", size: 3, dur: 9, delay: 1.4, drift: "-10px" },
  { left: "44%", size: 5, dur: 6.5, delay: 2.2, drift: "18px" },
  { left: "52%", size: 3, dur: 8, delay: 0.6, drift: "-16px" },
  { left: "63%", size: 4, dur: 7.5, delay: 3, drift: "10px" },
  { left: "74%", size: 3, dur: 9.5, delay: 1.8, drift: "-12px" },
  { left: "84%", size: 5, dur: 6.8, delay: 2.6, drift: "16px" },
];

// soft bokeh lights (candles / chandelier)
const BOKEH = [
  { left: "22%", top: "20%", size: 90, opacity: 0.18 },
  { left: "70%", top: "16%", size: 120, opacity: 0.14 },
  { left: "48%", top: "10%", size: 70, opacity: 0.2 },
  { left: "10%", top: "44%", size: 100, opacity: 0.1 },
  { left: "88%", top: "40%", size: 80, opacity: 0.12 },
];

export default function CozyCampfireBackdrop() {
  const reduce = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* base warm room tone */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 110%, #3a1c06 0%, #1a0e04 35%, #0a0603 70%, #050505 100%)",
        }}
      />

      {/* blurred scene layer: bokeh lights */}
      <div className="absolute inset-0" style={{ filter: "blur(28px)" }}>
        {BOKEH.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: b.left,
              top: b.top,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle, rgba(255,196,120,${b.opacity}) 0%, transparent 70%)`,
            }}
          />
        ))}
      </div>

      {/* fireplace glow pooling up from the bottom centre */}
      <div
        className={reduce ? "absolute" : "absolute animate-fire-flicker"}
        style={{
          left: "50%",
          bottom: "-12%",
          width: "70%",
          height: "55%",
          transform: "translateX(-50%)",
          transformOrigin: "bottom center",
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(249,140,40,0.5) 0%, rgba(249,115,22,0.28) 30%, rgba(180,60,10,0.12) 55%, transparent 75%)",
          filter: "blur(20px)",
        }}
      />
      {/* hotter inner ember bed */}
      <div
        className={reduce ? "absolute" : "absolute animate-fire-flicker"}
        style={{
          left: "50%",
          bottom: "-6%",
          width: "34%",
          height: "26%",
          transform: "translateX(-50%)",
          transformOrigin: "bottom center",
          animationDelay: "-1.2s",
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(255,210,140,0.55) 0%, rgba(249,140,40,0.3) 45%, transparent 75%)",
          filter: "blur(14px)",
        }}
      />

      {/* rising embers */}
      {!reduce &&
        EMBERS.map((e, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: e.left,
              bottom: "8%",
              width: e.size,
              height: e.size,
              background: "radial-gradient(circle, #fed7aa 0%, #f97316 60%, transparent 100%)",
              boxShadow: "0 0 6px rgba(249,115,22,0.7)",
              // @ts-expect-error custom prop consumed by the ember-rise keyframe
              "--ember-drift": e.drift,
              animation: `ember-rise ${e.dur}s linear ${e.delay}s infinite`,
            }}
          />
        ))}

      {/* gentle warm wash that breathes */}
      {!reduce && (
        <motion.div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(249,115,22,0.10), transparent 70%)" }}
          animate={{ opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* vignette + top darkening for cozy framing */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 45%, transparent 30%, rgba(5,5,5,0.55) 80%, rgba(5,5,5,0.85) 100%), linear-gradient(to bottom, rgba(5,5,5,0.6) 0%, transparent 30%)",
        }}
      />
    </div>
  );
}
