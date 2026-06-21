"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

type OffCampusFilterToastProps = {
  visible: boolean;
  onDismiss: () => void;
};

export default function OffCampusFilterToast({ visible, onDismiss }: OffCampusFilterToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!visible) return;
    timerRef.current = setTimeout(onDismiss, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 36, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="pointer-events-auto absolute inset-x-0 top-0 z-20 overflow-hidden"
        >
          <div
            className="flex h-9 items-center gap-2 border-b border-l-[3px] px-3"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-color)",
              borderLeftColor: "#f59e0b",
            }}
          >
            <p className="min-w-0 flex-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Off-campus events may require travel
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 px-1 text-base leading-none transition hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
