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
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold tabular-nums"
      style={{
        background: "rgba(17, 10, 21, 0.92)",
        borderColor: "rgba(224, 51, 158, 0.55)",
        color: "#f9a8d4",
        boxShadow:
          "0 0 0 1px rgba(224, 51, 158, 0.22), 0 4px 18px rgba(0, 0, 0, 0.45), 0 0 16px rgba(224, 51, 158, 0.22)",
        backdropFilter: "blur(10px)",
      }}
      aria-label={`${count} nearby events`}
    >
      {count}
    </motion.button>
  );
}
