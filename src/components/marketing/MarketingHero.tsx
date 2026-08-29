"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown } from "lucide-react";
import VantaBackground from "@/components/motion/VantaBackground";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

export function MarketingHero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(".hero-eyebrow", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 })
        .fromTo(".hero-title", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9 }, "-=0.45")
        .fromTo(".hero-sub", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.55")
        .fromTo(".hero-cta", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, "-=0.5")
        .fromTo(".hero-scroll", { opacity: 0 }, { opacity: 1, duration: 0.6 }, "-=0.2");

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
    <div id="top" ref={rootRef} className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
      <VantaBackground
        effect="cells"
        backgroundColor={0x0b0710}
        options={{ color1: 0xe0339e, color2: 0x8b5cf6, size: 1.6 }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 65% at 50% 46%, rgba(11,7,16,0.93) 0%, rgba(11,7,16,0.75) 48%, rgba(11,7,16,0.35) 75%, rgba(11,7,16,0.55) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pt-24 text-center">
        <span
          className="hero-eyebrow mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-accent-start)" }}
        >
          University of Waterloo · exclusive
        </span>

        <h1
          className="hero-title font-display text-5xl font-bold leading-[1.05] sm:text-6xl md:text-7xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          Campus is <span className="text-gradient">alive.</span>
        </h1>

        <p
          className="hero-sub mt-6 max-w-2xl text-balance text-base sm:text-lg"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Wanderers turns a pickup game, a study grind, or a coffee run into an open invite
          anyone nearby can join. Find your people. Start something.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={() => router.push("/login")} className="hero-cta btn-gradient h-12 px-7 text-sm">
            Get Started
          </button>
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="hero-cta h-12 rounded-full px-7 text-sm font-semibold transition-colors"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-primary)", background: "var(--color-surface)" }}
          >
            Continue as Guest →
          </button>
        </div>

        <a
          href="#how-it-works"
          className="hero-scroll mt-16 flex flex-col items-center gap-2 text-xs transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          Scroll to explore
          <ArrowDown className="hero-scroll-icon h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
