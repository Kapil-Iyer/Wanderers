"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGSAP } from "@gsap/react";
import AuthModal from "@/components/ui/AuthModal";
import SplashIntro, { SPLASH_KEY } from "@/components/ui/SplashIntro";
import VantaBackground from "@/components/motion/VantaBackground";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function LoginPage() {
  // null = undecided (avoids hydration mismatch); true = play splash; false = skip
  const [showSplash, setShowSplash] = useState<boolean | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setShowSplash(!sessionStorage.getItem(SPLASH_KEY));
    } catch {
      setShowSplash(false);
    }
  }, []);

  const finishSplash = () => {
    try { sessionStorage.setItem(SPLASH_KEY, "1"); } catch { /* sessionStorage unavailable */ }
    setShowSplash(false);
  };

  // GSAP fades the Vanta canvas in first; framer-motion's own staggered
  // entrance (below) then handles the hero text/card reveal independently.
  useGSAP(() => {
    if (showSplash !== false || !heroRef.current || prefersReducedMotion()) return;
    gsap.fromTo(heroRef.current, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power2.out" });
  }, { scope: heroRef, dependencies: [showSplash] });

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 py-12">

      {/* One-time cinematic intro */}
      {showSplash && <SplashIntro onComplete={finishSplash} />}

      {/* Aurora network hero backdrop - Vanta.NET, scoped to this page only */}
      <div ref={heroRef} className="absolute inset-0">
        <VantaBackground
          effect="net"
          color={0xe0339e}
          backgroundColor={0x0b0710}
          options={{ points: 7.0, maxDistance: 22.0, spacing: 22.0, showDots: true }}
        />
      </div>
      {/* dark scrim behind the hero text/card so the network stays legible only at the margins */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 62% 58% at 50% 45%, rgba(5,5,9,0.88) 0%, rgba(5,5,9,0.6) 45%, transparent 78%)",
        }}
      />

      {/* Page content - slides up after the splash hands off */}
      <AnimatePresence>
        {showSplash === false && (
          <motion.div
            key="landing-content"
            className="relative z-10 w-full flex flex-col items-center"
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
          >
            {/* Hero text above card */}
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, filter: "blur(12px)", y: 28 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.7, ease }}
            >
              <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3"
                style={{ color: "var(--color-accent-start)" }}>
                University of Waterloo - exclusive
              </p>
              <h1 className="font-display text-5xl sm:text-6xl font-bold leading-tight mb-4"
                style={{ color: "var(--color-text-primary)" }}>
                Campus is{" "}
                <span className="text-gradient">alive.</span>
              </h1>
              <p className="text-base max-w-xs mx-auto" style={{ color: "var(--color-text-secondary)" }}>
                Real students, real moments - happening right now near you.
              </p>
            </motion.div>

            {/* Auth card */}
            <motion.div
              className="w-full flex justify-center"
              initial={{ opacity: 0, filter: "blur(12px)", y: 36 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease }}
            >
              <AuthModal />
            </motion.div>

            {/* Bottom tagline */}
            <motion.p
              className="mt-8 text-xs"
              style={{ color: "var(--color-text-muted)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Your next memory is one tap away.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
