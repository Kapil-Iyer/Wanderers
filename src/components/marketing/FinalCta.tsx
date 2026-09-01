"use client";

import { useRouter } from "next/navigation";
import { Reveal } from "@/components/marketing/Reveal";
import { useGuest } from "@/contexts/GuestContext";

export function FinalCta() {
  const router = useRouter();
  const { enterGuestMode } = useGuest();

  return (
    <section className="relative mx-auto max-w-4xl px-6 py-28 text-center">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(224,51,158,0.1) 0%, transparent 70%)" }}
      />
      <Reveal>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--color-text-primary)" }}>
          Ready to find your <span className="text-gradient">people?</span>
        </h2>
        <p className="mt-4" style={{ color: "var(--color-text-secondary)" }}>
          Your next memory is one tap away.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={() => router.push("/login")} className="btn-gradient h-12 px-7 text-sm">
            Get Started
          </button>
          <button
            type="button"
            onClick={() => {
              enterGuestMode();
              router.push("/home");
            }}
            className="h-12 rounded-full px-7 text-sm font-semibold transition-colors"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-primary)", background: "var(--color-surface)" }}
          >
            Continue as Guest →
          </button>
        </div>
      </Reveal>
    </section>
  );
}
