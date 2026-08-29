"use client";

import { useEffect, useState } from "react";
import SplashIntro, { SPLASH_KEY } from "@/components/ui/SplashIntro";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Features } from "@/components/marketing/Features";
import { TechStackSection } from "@/components/marketing/TechStackSection";
import { FinalCta } from "@/components/marketing/FinalCta";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function MarketingPage() {
  // null = undecided (avoids a flash of page content before we know whether
  // to play the splash); true = play splash; false = skip straight to content.
  const [showSplash, setShowSplash] = useState<boolean | null>(null);

  // One-time cinematic intro, shared with /login via the same sessionStorage
  // key - whichever page a visitor lands on first plays it, the other won't.
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
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--color-bg)" }}>
      {showSplash && <SplashIntro onComplete={finishSplash} />}
      {showSplash === false && (
        <>
          <MarketingNav />
          <main>
            <MarketingHero />
            <HowItWorks />
            <Features />
            <TechStackSection />
            <FinalCta />
          </main>
          <MarketingFooter />
        </>
      )}
    </div>
  );
}
