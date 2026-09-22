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
 *   - on "/", "/login", and "/onboarding", which already mount their own
 *     denser, page-scoped VantaBackground hero
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

const OWN_HERO_ROUTES = new Set(["/", "/login", "/onboarding"]);

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

  // Warm the Clouds effect + three.js chunk so that by the time the user
  // navigates to a page that needs it, it's already downloaded and cached -
  // only the (fast) WebGL scene init is left, instead of a chunk fetch + init.
  //
  // Deferred to idle rather than fired on mount: three.js is a few hundred KB
  // and starting it immediately made it compete with the chunks the current
  // page actually needs to become interactive. Idle keeps the prefetch benefit
  // without paying for it during first paint. Skipped entirely under reduced
  // motion, where the WebGL fog never renders anyway.
  useEffect(() => {
    if (reduced) return;

    const warm = () => {
      import("vanta/dist/vanta.clouds.min");
      import("three");
    };

    // requestIdleCallback isn't in Safari; the timeout is a rough stand-in.
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(warm, { timeout: 4000 });
      return () => window.cancelIdleCallback?.(handle);
    }
    const t = setTimeout(warm, 2000);
    return () => clearTimeout(t);
  }, [reduced]);

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
