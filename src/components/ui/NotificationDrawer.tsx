"use client";

/**
 * NOTIFICATION DRAWER — slide-out panel (right) holding connection requests
 * and "confirmed to attend" bubbles. Triggered by the bell in the top bar,
 * freeing the Home page to run full-width.
 *
 * Consumes ConnectionsContext + ConversationsContext directly. Ending an event
 * is delegated back to the parent via onEndEvent (which owns EndEventModal).
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Check, Calendar, Square } from "lucide-react";
import { useConnections } from "@/contexts/ConnectionsContext";
import { useConversations } from "@/contexts/ConversationsContext";
import { ProfileLink } from "@/components/ProfileLink";
import type { BubbleConversation } from "@/contexts/ConversationsContext";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export default function NotificationDrawer({
  open,
  onClose,
  onEndEvent,
}: {
  open: boolean;
  onClose: () => void;
  onEndEvent: (bubble: BubbleConversation) => void;
}) {
  const { filteredConnectionRequests, acceptRequest, rejectRequest } = useConnections();
  const { joinedBubbles } = useConversations();

  // Esc to close + lock body scroll
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            className="fixed inset-0 z-[60]"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            className="fixed top-0 right-0 bottom-0 z-[61] w-full max-w-sm overflow-y-auto"
            style={{
              background: "rgba(12,12,14,0.97)",
              borderLeft: "1px solid rgba(249,115,22,0.15)",
              backdropFilter: "blur(24px)",
              boxShadow: "-32px 0 80px rgba(0,0,0,0.6)",
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            role="dialog"
            aria-label="Notifications"
            aria-modal="true"
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-5 h-16"
              style={{
                background: "rgba(12,12,14,0.9)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                backdropFilter: "blur(12px)",
              }}
            >
              <h2 className="font-display text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                Activity
              </h2>
              <motion.button
                type="button"
                onClick={onClose}
                aria-label="Close notifications"
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-text-secondary)" }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="p-5 space-y-7">
              {/* Connection requests */}
              <section>
                <h3
                  className="text-xs font-bold uppercase tracking-[0.15em] mb-3 flex items-center gap-2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <UserPlus className="w-3.5 h-3.5" style={{ color: "#F97316" }} />
                  Connection Requests
                </h3>
                {filteredConnectionRequests.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No pending requests</p>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {filteredConnectionRequests.map((req) => (
                        <motion.div
                          key={req.id}
                          layout
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                          transition={{ duration: 0.3, ease: EASE }}
                          className="flex items-center gap-3 p-3 rounded-2xl"
                          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: "rgba(249,115,22,0.15)", color: "#F97316", border: "1px solid rgba(249,115,22,0.25)" }}
                          >
                            {req.avatar}
                          </div>
                          <div className="min-w-0 flex-1">
                            <ProfileLink
                              name={req.name}
                              avatar={req.avatar}
                              className="text-sm font-medium truncate block"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {req.name}
                            </ProfileLink>
                            <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Wants to connect</p>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <motion.button
                              type="button"
                              onClick={() => acceptRequest(req.id)}
                              aria-label={`Accept ${req.name}`}
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ background: "linear-gradient(135deg, #F97316, #FBBF24)", color: "#1a0a00" }}
                              whileHover={{ scale: 1.12 }}
                              whileTap={{ scale: 0.9 }}
                              transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            >
                              <Check className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              type="button"
                              onClick={() => rejectRequest(req.id)}
                              aria-label={`Dismiss ${req.name}`}
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ background: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)" }}
                              whileHover={{ scale: 1.12 }}
                              whileTap={{ scale: 0.9 }}
                              transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>

              {/* Confirmed to attend */}
              <section>
                <h3
                  className="text-xs font-bold uppercase tracking-[0.15em] mb-3 flex items-center gap-2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <Calendar className="w-3.5 h-3.5" style={{ color: "#F97316" }} />
                  Confirmed to Attend
                </h3>
                {joinedBubbles.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No bubbles yet</p>
                ) : (
                  <div className="space-y-2">
                    {joinedBubbles.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center gap-3 p-3 rounded-2xl"
                        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        <span className="text-xl shrink-0">{b.avatar}</span>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium truncate block" style={{ color: "var(--color-text-primary)" }}>{b.name}</span>
                          {b.duration && <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{b.duration}</span>}
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => onEndEvent(b)}
                          aria-label={`End ${b.name}`}
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}
                          whileHover={{ scale: 1.12 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                          <Square className="w-3 h-3 fill-current" />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
