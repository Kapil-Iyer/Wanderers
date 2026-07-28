"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuthModal from "@/components/ui/AuthModal";
import SplashIntro, { SPLASH_KEY } from "@/components/ui/SplashIntro";
import CozyCampfireBackdrop from "@/components/ui/CozyCampfireBackdrop";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function LandingPage() {
  // null = undecided (avoids hydration mismatch); true = play splash; false = skip
  const [showSplash, setShowSplash] = useState<boolean | null>(null);

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

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 py-12">

      {/* One-time cinematic intro */}
      {showSplash && <SplashIntro onComplete={finishSplash} />}

      {/* Cozy campfire backdrop - blurred warm room behind the glass card */}
      <CozyCampfireBackdrop />

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
