"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const sections = [
  { id: "how-it-works", label: "How it works" },
  { id: "features", label: "Features" },
  { id: "stack", label: "Stack" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlights whichever section is currently crossing a line a third of the way
  // down the viewport, so the nav pill tracks scroll position, not just clicks.
  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-33% 0px -60% 0px" }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={{
        borderBottom: scrolled ? "1px solid var(--color-border)" : "1px solid transparent",
        background: scrolled ? "rgba(11,7,16,0.75)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <a href="#top" className="flex items-center gap-2 font-display text-lg font-bold cursor-pointer" style={{ color: "var(--color-text-primary)" }}>
          <svg width="20" height="21" viewBox="0 0 100 103" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="nav-pin" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="55%" stopColor="#E0339E" />
                <stop offset="100%" stopColor="#FF9130" />
              </linearGradient>
            </defs>
            <path
              d="M50 95 C50 95 15 66 15 42 C15 22.7 30.7 8 50 8 C69.3 8 85 22.7 85 42 C85 66 50 95 50 95 Z"
              fill="url(#nav-pin)"
            />
          </svg>
          <span><span className="text-gradient">W</span>anderers</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {sections.map((s) => {
            const active = activeId === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => handleNavClick(e, s.id)}
                className="relative cursor-pointer rounded-full px-3.5 py-1.5 text-sm transition-colors"
                style={{ color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
              >
                {active && (
                  <motion.span
                    layoutId="marketing-nav-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{s.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="hidden cursor-pointer text-sm font-medium transition-colors sm:inline"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="btn-gradient h-9 cursor-pointer px-4 text-sm"
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
}
