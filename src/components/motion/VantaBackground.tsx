"use client";

/**
 * VantaBackground - reusable wrapper around a Vanta.js WebGL effect.
 *
 * Reserved for a small number of high-impact "hero" surfaces (landing,
 * onboarding) - never mounted globally/fixed. See the design plan for the
 * perf rationale: a second always-on WebGL canvas next to the map overlay's
 * own Google Maps WebGL context is a real GPU-contention risk with no
 * product benefit, so this only ever renders scoped inside a `relative`
 * parent that unmounts naturally on navigation.
 *
 * Vanta needs a real DOM canvas + `window`, so the effect module itself is
 * imported inside an effect (not a top-level next/dynamic(ssr:false)) - the
 * container div and its static CSS gradient fallback can still render on
 * first paint, avoiding layout shift when the canvas mounts a beat later.
 */

import { useEffect, useRef, useState } from "react";

/**
 * Only the three.js-rendered effects. Vanta's `topology` and `trunk` render on
 * p5.js instead, and supporting them meant shipping p5 (~820 kB, plus acorn and
 * escodegen for its parser) in the build for two effects no call site used.
 * Re-add them here along with the `p5` dependency if a design ever wants them.
 *
 * `waves` is deliberately absent: with three r185 it renders its clear colour
 * but no mesh, so you get a flat rectangle that looks like an intentional
 * gradient. Vanta 0.5.24 predates this three version and not every effect
 * survived. Verify any effect added here actually draws before shipping it -
 * the CSS fallback below makes a dead canvas look fine.
 */
type VantaEffectName = "net" | "fog" | "cells" | "birds" | "globe" | "clouds";

type VantaInstance = { destroy: () => void };

interface VantaBackgroundProps {
  effect: VantaEffectName;
  color?: number;
  backgroundColor?: number;
  options?: Record<string, unknown>;
  className?: string;
  /** CSS gradient shown before the canvas mounts and under prefers-reduced-motion. */
  fallbackGradient?: string;
}

type VantaEffectFactory = (config: Record<string, unknown>) => VantaInstance;

const EFFECT_LOADERS: Record<VantaEffectName, () => Promise<{ default: VantaEffectFactory }>> = {
  net: () => import("vanta/dist/vanta.net.min"),
  fog: () => import("vanta/dist/vanta.fog.min"),
  cells: () => import("vanta/dist/vanta.cells.min"),
  birds: () => import("vanta/dist/vanta.birds.min"),
  globe: () => import("vanta/dist/vanta.globe.min"),
  clouds: () => import("vanta/dist/vanta.clouds.min"),
};

export default function VantaBackground({
  effect,
  color = 0xe0339e,
  backgroundColor = 0x0b0710,
  options,
  className,
  fallbackGradient = "radial-gradient(1200px 760px at 50% 30%, #1c0f1a 0%, #100812 60%, #0b0710 100%)",
}: VantaBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vantaRef = useRef<VantaInstance | null>(null);
  const initializedRef = useRef(false);
  const [reduced, setReduced] = useState(true); // default to the safe/static state until checked

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced || !containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    let cancelled = false;

    (async () => {
      const [{ default: createEffect }, THREE] = await Promise.all([
        EFFECT_LOADERS[effect](),
        import("three"),
      ]);
      if (cancelled || !containerRef.current) return;
      vantaRef.current = createEffect({
        el: containerRef.current,
        THREE,
        color,
        backgroundColor,
        mouseControls: true,
        touchControls: false,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        ...options,
      });
    })();

    return () => {
      cancelled = true;
      vantaRef.current?.destroy();
      vantaRef.current = null;
      initializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, effect]);

  return (
    <div
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundImage: fallbackGradient }}
    >
      <div ref={containerRef} className="absolute inset-0" />
      {/* red-orange -> violet tint, bookending the magenta network line color to read as the
          logo's full three-color pin blend (Vanta.NET only takes a single node/line color) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,90,54,0.14) 0%, transparent 45%, transparent 55%, rgba(139,92,246,0.18) 100%)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
