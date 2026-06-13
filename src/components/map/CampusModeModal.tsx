"use client";

import { motion } from "framer-motion";
import type { CampusMode } from "@/lib/campusBounds";

type CampusModeModalProps = {
  onSelect: (mode: CampusMode) => void;
  themeClass: string;
};

export default function CampusModeModal({ onSelect, themeClass }: CampusModeModalProps) {
  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center px-4 ${themeClass}`}
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-[360px] rounded-[20px] border p-6 text-center shadow-2xl"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="text-[48px] leading-none">🎓</div>
        <h2
          className="mt-4 text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Where do you want to explore?
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Start on campus or see what&apos;s happening around Waterloo too.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => onSelect("campus")}
            className="w-full rounded-xl px-4 py-3 text-left transition hover:opacity-95"
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            }}
          >
            <span className="block text-sm font-bold text-white">🏫 Stay on Campus</span>
            <span className="mt-0.5 block text-[11px] text-white/60">
              University of Waterloo only
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelect("explore")}
            className="w-full rounded-xl border px-4 py-3 text-left transition hover:opacity-90"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-page)",
            }}
          >
            <span className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              🌍 Explore Nearby Too
            </span>
            <span className="mt-0.5 block text-[11px]" style={{ color: "var(--text-muted)" }}>
              Waterloo &amp; Kitchener area
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
