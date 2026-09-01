"use client";

/**
 * Full-panel locked state shown to guests on pages/sections that require a
 * real account (currently just Messages/chat - real-time chat can't exist
 * without a real Supabase-backed identity).
 */

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

const panelStyle: React.CSSProperties = {
  background: "linear-gradient(165deg, rgba(36,28,22,0.92) 0%, rgba(18,13,10,0.96) 100%)",
  border: "1px solid rgba(255,181,107,0.14)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 12px 40px -16px rgba(0,0,0,0.65)",
};

export default function GuestLocked({ message }: { message: string }) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl px-6 py-14 text-center"
      style={panelStyle}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: "rgba(255,122,26,0.12)", border: "1px solid rgba(255,122,26,0.28)" }}
      >
        <Lock className="w-6 h-6" style={{ color: "#ff7a1a" }} />
      </div>
      <p className="font-display text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
        Sign up to unlock this
      </p>
      <p className="text-sm mt-2 max-w-[300px] mx-auto leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        {message}
      </p>
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold"
        style={{ background: "linear-gradient(135deg, #ff7a1a, #ffb56b)", color: "#2a1206", boxShadow: "0 8px 24px rgba(255,122,26,0.28)" }}
      >
        Sign Up
      </button>
    </motion.div>
  );
}
