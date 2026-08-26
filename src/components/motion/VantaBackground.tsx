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

type VantaEffectName = "net" | "fog" | "topology" | "cells" | "birds" | "trunk" | "globe" | "clouds";

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
  topology: () => import("vanta/dist/vanta.topology.min"),
  cells: () => import("vanta/dist/vanta.cells.min"),
  birds: () => import("vanta/dist/vanta.birds.min"),
  trunk: () => import("vanta/dist/vanta.trunk.min"),
  globe: () => import("vanta/dist/vanta.globe.min"),
  clouds: () => import("vanta/dist/vanta.clouds.min"),
};

// Most Vanta effects render on three.js; Topology and Trunk render on p5.js instead -
// each needs its renderer library injected under a different config key.
const EFFECT_RENDERER: Record<VantaEffectName, "three" | "p5"> = {
  net: "three",
  fog: "three",
  topology: "p5",
  cells: "three",
  birds: "three",
  trunk: "p5",
  globe: "three",
  clouds: "three",
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
      const renderer = EFFECT_RENDERER[effect];
      const [{ default: createEffect }, rendererModule] = await Promise.all([
        EFFECT_LOADERS[effect](),
        renderer === "p5" ? import("p5") : import("three"),
      ]);
      if (cancelled || !containerRef.current) return;
      const rendererProp = renderer === "p5" ? { p5: rendererModule.default } : { THREE: rendererModule };
      vantaRef.current = createEffect({
        el: containerRef.current,
        ...rendererProp,
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
