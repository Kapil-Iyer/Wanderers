"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle, MapPin, ChevronRight, Users } from "lucide-react";
import BottomNav from "@/components/ui/BottomNav";
import AppHeader from "@/components/ui/AppHeader";
import { ProfileLink } from "@/components/ProfileLink";
import { useConversations } from "@/contexts/ConversationsContext";
import { useConnections } from "@/contexts/ConnectionsContext";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/motion/Reveal";
import { useSidebar } from "@/contexts/SidebarContext";

const panelStyle: React.CSSProperties = {
  background: "linear-gradient(165deg, rgba(36,28,22,0.92) 0%, rgba(18,13,10,0.96) 100%)",
  border: "1px solid rgba(255,181,107,0.14)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 12px 40px -16px rgba(0,0,0,0.65)",
};

export default function MessagesPage() {
  const router = useRouter();
  const { expanded: sidebarExpanded } = useSidebar();
  const { conversations, loadingJoined, refreshJoinedBubbles } = useConversations();
  const { getConnectedFriends } = useConnections();
  const circle = getConnectedFriends();
  const liveNow = circle.filter((f) => f.currentEvent);
  const activeChats = conversations.filter((c) => c.lastMessage !== "Bubble ended");
  const endedChats = conversations.filter((c) => c.lastMessage === "Bubble ended");

  useEffect(() => {
    refreshJoinedBubbles();
  }, [refreshJoinedBubbles]);

  return (
    <div className="min-h-screen pb-12 relative">
      <AppHeader
        title="Messages"
        center={
          conversations.length > 0 ? (
            <span className="text-[11px] font-medium tabular-nums" style={{ color: "var(--color-text-muted)" }}>
              {activeChats.length} active
              {endedChats.length > 0 ? ` · ${endedChats.length} ended` : ""}
            </span>
          ) : null
        }
      />

      <div
        className={`relative z-10 transition-[padding] duration-300 ease-out ${sidebarExpanded ? "lg:pl-64" : "lg:pl-3"}`}
      >
        <div className="max-w-xl mx-auto px-5 sm:px-6">
          {/* Hero - one job */}
          <section className="pt-9 pb-8">
            <motion.p
              className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3"
              style={{ color: "rgba(255,181,107,0.85)" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              Inbox
            </motion.p>
            <motion.h1
              className="font-display text-4xl sm:text-[2.75rem] font-bold leading-[1.05] tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
            >
              Your <span className="text-gradient">conversations</span>
            </motion.h1>
            <motion.p
              className="mt-3 text-sm max-w-sm leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              Bubble group chats you&apos;ve joined - pick one up anytime.
            </motion.p>
          </section>

          {/* Bubble chats */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-3.5">
              <MessageCircle className="w-3.5 h-3.5" style={{ color: "#ff7a1a" }} />
              <h2
                className="text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ color: "var(--color-text-muted)" }}
              >
                Bubble chats
              </h2>
            </div>

            {loadingJoined && conversations.length === 0 ? (
              <div className="rounded-2xl px-5 py-12 text-center" style={panelStyle}>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Loading your chats…
                </p>
              </div>
            ) : conversations.length === 0 ? (
              <Reveal>
                <div className="relative overflow-hidden rounded-2xl px-6 py-10 text-center" style={panelStyle}>
                  <div
                    className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse 70% 100% at 50% 100%, rgba(255,122,26,0.16), transparent 70%)",
                    }}
                    aria-hidden
                  />
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{
                        background: "rgba(255,122,26,0.12)",
                        border: "1px solid rgba(255,122,26,0.28)",
                      }}
                    >
                      <MessageCircle className="w-6 h-6" style={{ color: "#ff7a1a" }} />
                    </div>
                    <p className="font-display text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                      No chats yet
                    </p>
                    <p
                      className="text-sm mt-2 max-w-[260px] mx-auto leading-relaxed"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Join a bubble nearby to unlock its group chat.
                    </p>
                    <Link href="/home" className="inline-block mt-6">
                      <motion.span
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold"
                        style={{
                          background: "linear-gradient(135deg, #ff7a1a, #ffb56b)",
                          color: "#2a1206",
                          boxShadow: "0 8px 24px rgba(255,122,26,0.28)",
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <MapPin className="w-4 h-4" />
                        Browse bubbles
                      </motion.span>
                    </Link>
                  </div>
                </div>
              </Reveal>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={panelStyle}>
                <StaggerContainer amount={0.04}>
                  {conversations.map((convo, i) => {
                    const ended = convo.lastMessage === "Bubble ended";
                    return (
                      <StaggerItem key={convo.id}>
                        <motion.button
                          type="button"
                          onClick={() => router.push(`/chat/${convo.id}`)}
                          className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left group"
                          style={{
                            borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
                          }}
                          whileHover={{ backgroundColor: "rgba(255,122,26,0.06)" }}
                          transition={{ duration: 0.15 }}
                        >
                          <div
                            className="relative w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
                            style={{
                              background: ended
                                ? "rgba(255,255,255,0.04)"
                                : "linear-gradient(145deg, rgba(255,122,26,0.22), rgba(255,122,26,0.08))",
                              border: ended
                                ? "1px solid rgba(255,255,255,0.08)"
                                : "1px solid rgba(255,122,26,0.3)",
                              boxShadow: ended ? "none" : "0 4px 14px rgba(255,122,26,0.12)",
                            }}
                          >
                            {convo.avatar.length <= 2 ? (
                              <span
                                className="text-xs font-bold"
                                style={{ color: "var(--color-text-primary)" }}
                              >
                                {convo.avatar}
                              </span>
                            ) : (
                              convo.avatar
                            )}
                            {convo.unread > 0 && (
                              <span
                                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
                                style={{
                                  background: "linear-gradient(135deg, #ff7a1a, #ffb56b)",
                                  color: "#2a1206",
                                }}
                              >
                                {convo.unread}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-semibold text-[15px] truncate"
                                style={{ color: "var(--color-text-primary)" }}
                              >
                                {convo.name}
                              </span>
                              {ended ? (
                                <span
                                  className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                                  style={{
                                    background: "rgba(255,255,255,0.06)",
                                    color: "var(--color-text-muted)",
                                  }}
                                >
                                  Ended
                                </span>
                              ) : (
                                <span
                                  className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                                  style={{
                                    background: "rgba(74,222,128,0.12)",
                                    color: "#4ade80",
                                  }}
                                >
                                  Live
                                </span>
                              )}
                            </div>
                            <p
                              className="text-xs truncate mt-0.5"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {convo.lastMessage}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className="text-[10px] tabular-nums"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              {convo.time}
                            </span>
                            <ChevronRight
                              className="w-4 h-4 opacity-40 group-hover:opacity-80 transition-opacity"
                              style={{ color: "#ffb56b" }}
                            />
                          </div>
                        </motion.button>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              </div>
            )}
          </section>

          {/* Circle */}
          {circle.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" style={{ color: "#ff7a1a" }} />
                  <h2
                    className="text-[11px] font-bold uppercase tracking-[0.16em]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Your circle
                  </h2>
                </div>
                {liveNow.length > 0 && (
                  <span
                    className="flex items-center gap-1.5 text-[11px] font-semibold"
                    style={{ color: "#4ade80" }}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span
                        className="absolute inline-flex h-full w-full rounded-full animate-ping"
                        style={{ background: "#4ade80", opacity: 0.55 }}
                      />
                      <span
                        className="relative inline-flex h-1.5 w-1.5 rounded-full"
                        style={{ background: "#4ade80" }}
                      />
                    </span>
                    {liveNow.length} out now
                  </span>
                )}
              </div>

              <StaggerContainer className="space-y-2" amount={0.04}>
                {circle.map((friend) => (
                  <StaggerItem key={friend.id}>
                    <div
                      className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl"
                      style={{
                        background: "rgba(20,15,10,0.72)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
                      }}
                    >
                      <div
                        className="relative w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{
                          background: "rgba(255,122,26,0.14)",
                          color: "var(--color-text-primary)",
                          border: "1px solid rgba(255,122,26,0.28)",
                        }}
                      >
                        {friend.avatar}
                        {friend.currentEvent && (
                          <span
                            className="absolute bottom-0 right-0 w-3 h-3 rounded-full"
                            style={{ background: "#4ade80", border: "2px solid #140F0A" }}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <ProfileLink
                          name={friend.name}
                          avatar={friend.avatar}
                          className="text-sm font-semibold truncate block"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {friend.name}
                        </ProfileLink>
                        {friend.currentEvent ? (
                          <p className="text-[11px] truncate mt-0.5" style={{ color: "#4ade80" }}>
                            Live · {friend.currentEvent}
                          </p>
                        ) : (
                          <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                            Connected
                          </p>
                        )}
                      </div>
                      <ProfileLink
                        name={friend.name}
                        avatar={friend.avatar}
                        className="shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-colors"
                        style={{
                          background: "rgba(255,122,26,0.1)",
                          color: "#ffb56b",
                          border: "1px solid rgba(255,122,26,0.28)",
                        }}
                      >
                        View
                      </ProfileLink>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
