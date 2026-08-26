"use client";

/**
 * GLOBAL BACKDROP - the living background behind every page (Home, Messages,
 * Explore, Profile, Chat...). Replaces the old static PlexusBackground SVG
 * with a GSAP-faded-in Vanta.CLOUDS - drifting 3D clouds. Vanta's own default
 * palette is a bright daytime sky; every color here is retuned to a dark,
 * warm-lit night sky instead so it fits the app's ink-dark theme.
 *
 * Deliberately skips itself in two cases, both to avoid a second concurrent
 * WebGL context:
 *   - the map overlay is open (it hosts its own Google Maps WebGL view)
 *   - on "/" and "/onboarding", which already mount their own denser,
 *     page-scoped VantaBackground hero
 * In both cases (and under prefers-reduced-motion) it falls back to the
 * static PlexusBackground SVG instead of rendering nothing.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useMapOverlay } from "@/contexts/MapOverlayContext";
import VantaBackground from "@/components/motion/VantaBackground";
import PlexusBackground from "@/components/PlexusBackground";

const OWN_HERO_ROUTES = new Set(["/", "/onboarding"]);

export default function GlobalBackdrop() {
  const pathname = usePathname();
  const mapOverlay = useMapOverlay();
  const ref = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Warm the Clouds effect + three.js chunk as soon as the app boots (even while
  // sitting on "/" where this component itself renders null), so by the time the
  // user navigates to a page that needs it, it's already downloaded and cached -
  // only the (fast) WebGL scene init is left, instead of a chunk fetch + init.
  useEffect(() => {
    import("vanta/dist/vanta.clouds.min");
    import("three");
  }, []);

  const hasOwnHero = pathname ? OWN_HERO_ROUTES.has(pathname) : false;
  const mapIsOpen = mapOverlay?.isOpen ?? false;
  const showLiveFog = !hasOwnHero && !mapIsOpen && !reduced;

  useGSAP(
    () => {
      if (!ref.current || !showLiveFog) return;
      gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 1.1, ease: "power2.out" });
    },
    { scope: ref, dependencies: [showLiveFog] }
  );

  if (hasOwnHero) return null;

  if (!showLiveFog) {
    return <PlexusBackground />;
  }

  return (
    <div ref={ref} className="fixed inset-0 -z-10 pointer-events-none" aria-hidden>
      <VantaBackground
        effect="clouds"
        backgroundColor={0x0b0710}
        options={{
          skyColor: 0x150a1c,
          cloudColor: 0x3a1a35,
          cloudShadowColor: 0x0d0510,
          sunColor: 0xe0339e,
          sunGlareColor: 0xff5a36,
          sunlightColor: 0xff9a6b,
          scale: 2.2,
          speed: 0.7,
        }}
      />
    </div>
  );
}
