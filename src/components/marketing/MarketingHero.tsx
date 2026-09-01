"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown } from "lucide-react";
import VantaBackground from "@/components/motion/VantaBackground";
import { ProductWalkthrough } from "@/components/marketing/walkthrough/ProductWalkthrough";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useGuest } from "@/contexts/GuestContext";

export function MarketingHero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { enterGuestMode } = useGuest();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(".hero-eyebrow", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 })
        .fromTo(".hero-title", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9 }, "-=0.45")
        .fromTo(".hero-sub", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.55")
        .fromTo(".hero-cta", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, "-=0.5")
        .fromTo(
          ".hero-demo",
          { opacity: 0, y: 28, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 1 },
          "-=0.85",
        )
        .fromTo(".hero-scroll", { opacity: 0 }, { opacity: 1, duration: 0.6 }, "-=0.3");

      gsap.to(".hero-scroll-icon", {
        y: 6,
        duration: 0.9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      id="top"
      ref={rootRef}
      /* Deliberately under a full viewport so the "Plans die in group chats"
         section peeks above the fold — visitors were missing the scroll cue. */
      className="relative flex min-h-[82svh] items-center overflow-hidden"
    >
      <VantaBackground
        effect="cells"
        backgroundColor={0x0b0710}
        options={{ color1: 0xe0339e, color2: 0x8b5cf6, size: 1.6 }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 42% 50%, rgba(11,7,16,0.94) 0%, rgba(11,7,16,0.8) 45%, rgba(11,7,16,0.45) 72%, rgba(11,7,16,0.6) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-14 pt-28 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] lg:gap-14 lg:pb-10 lg:pt-24">
        {/* ------------------------------------------------------- copy */}
        <div className="flex flex-col items-start text-left">
          <span
            className="hero-eyebrow mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]"
            style={{
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-accent-start)",
            }}
          >
            University of Waterloo · exclusive
          </span>

          <h1
            className="hero-title font-display text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-5xl xl:text-6xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            Campus is <span className="text-gradient">alive.</span>
          </h1>

          <p
            className="hero-sub mt-6 max-w-md text-balance text-base sm:text-lg"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Wanderers turns a pickup game, a study grind, or a coffee run into an open invite
            anyone nearby can join. Find your people. Start something.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="hero-cta btn-gradient h-12 px-7 text-sm"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={() => {
                enterGuestMode();
                router.push("/home");
              }}
              className="hero-cta h-12 rounded-full px-7 text-sm font-semibold transition-colors"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                background: "var(--color-surface)",
              }}
            >
              Continue as Guest →
            </button>
          </div>

          <a
            href="#how-it-works"
            className="hero-scroll mt-10 flex items-center gap-2 text-xs transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            Scroll to explore
            <ArrowDown className="hero-scroll-icon h-4 w-4" />
          </a>
        </div>

        {/* -------------------------------------------------- walkthrough */}
        <div className="hero-demo w-full">
          <div className="mb-3 flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full"
                style={{ background: "var(--color-accent-mid)", opacity: 0.7 }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--color-accent-mid)" }}
              />
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--color-text-muted)" }}
            >
              The full walkthrough · no signup needed
            </span>
          </div>
          <ProductWalkthrough />
        </div>
      </div>
    </div>
  );
}
