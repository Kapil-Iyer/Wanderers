"use client";

import { motion } from "framer-motion";

type ClusterPillProps = {
  count: number;
  onClick: () => void;
};

export default function ClusterPill({ count, onClick }: ClusterPillProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-[rgba(15,17,35,0.85)] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-[10px] hover:border-white/25"
    >
      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/15 px-1 text-[10px] font-bold">
        {count}
      </span>
      nearby
    </motion.button>
  );
}
