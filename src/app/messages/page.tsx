"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle, MapPin, Sparkles } from "lucide-react";
import BottomNav from "@/components/ui/BottomNav";
import { ProfileLink } from "@/components/ProfileLink";
import { useConversations } from "@/contexts/ConversationsContext";
import { useConnections } from "@/contexts/ConnectionsContext";
import { Reveal, StaggerContainer, StaggerItem, EASE } from "@/components/motion/Reveal";
import { useSidebar } from "@/contexts/SidebarContext";

export default function MessagesPage() {
  const router = useRouter();
  const { expanded: sidebarExpanded } = useSidebar();
  const { conversations } = useConversations();
  const { getConnectedFriends } = useConnections();
  const circle = getConnectedFriends();
  const liveNow = circle.filter((f) => f.currentEvent);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className={`sticky top-0 z-50 transition-[margin] duration-300 ease-out ${sidebarExpanded ? "lg:ml-64" : "lg:ml-3"}`}
        style={{ background: "rgba(20,15,10,0.85)", borderBottom: "1px solid rgba(255,122,26,0.08)", backdropFilter: "blur(16px)" }}>
        <div className="px-5 sm:px-8 h-14 flex items-center max-w-[1400px] mx-auto">
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>Messages</span>
        </div>
      </header>

      <div className={`transition-[padding] duration-300 ease-out ${sidebarExpanded ? "lg:pl-64" : "lg:pl-3"}`}>
        <div className="max-w-2xl mx-auto px-5 sm:px-8">

          {/* Editorial title */}
          <section className="pt-10 pb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--color-text-primary)" }}>
              Stay in the loop
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.02] tracking-tight"
              style={{ color: "var(--color-text-primary)" }}>
              Your <span className="text-gradient">conversations.</span>
            </h1>
          </section>

          {/* Chats */}
          {conversations.length > 0 ? (
            <Reveal as="section" className="mb-10">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "var(--color-text-muted)" }}>
                Bubble chats
              </h2>
              <StaggerContainer className="rounded-3xl overflow-hidden"
                amount={0.05}>
                {conversations.map((convo) => (
                  <StaggerItem key={convo.id}>
                    <motion.button type="button"
                      onClick={() => router.push(`/chat/${convo.id}`)}
                      className="w-full flex items-center gap-3.5 p-4 text-left"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)" }}
                      whileHover={{ x: 4, background: "rgba(255,255,255,0.04)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    >
                      <div className="relative w-12 h-12 rounded-full flex items-center justify-center text-lg shrink-0"
                        style={{ background: "rgba(255,122,26,0.1)", border: "1px solid rgba(255,122,26,0.2)" }}>
                        {convo.avatar.length <= 2
                          ? <span className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>{convo.avatar}</span>
                          : convo.avatar}
                        {convo.unread > 0 && (
                          <span className="absolute inset-0 rounded-full animate-pulse-amber pointer-events-none" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{convo.name}</span>
                          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{convo.time}</span>
                        </div>
                        <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{convo.lastMessage}</p>
                      </div>
                      {convo.unread > 0 && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "linear-gradient(135deg, #ff7a1a, #ffb56b)", boxShadow: "0 0 10px rgba(255,122,26,0.4)" }}>
                          <span className="text-[10px] font-bold" style={{ color: "#2a1206" }}>{convo.unread}</span>
                        </div>
                      )}
                    </motion.button>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </Reveal>
          ) : (
            <Reveal className="mb-10">
              <div className="relative overflow-hidden rounded-3xl p-8 text-center"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,122,26,0.12)" }}>
                {/* warm pool */}
                <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse 60% 100% at 50% 100%, rgba(255,122,26,0.14), transparent 70%)" }} />
                <div className="relative">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(255,122,26,0.1)", border: "1px solid rgba(255,122,26,0.2)" }}>
                    <MessageCircle className="w-7 h-7" style={{ color: "#ff7a1a" }} />
                  </div>
                  <p className="font-display text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>No chats yet</p>
                  <p className="text-sm mt-1.5 max-w-[280px] mx-auto" style={{ color: "var(--color-text-secondary)" }}>
                    Join a bubble to unlock its group chat — or start your own and watch your people show up.
                  </p>
                  <Link href="/map">
                    <motion.div
                      className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full text-sm font-bold"
                      style={{ background: "linear-gradient(135deg, #ff7a1a, #ffb56b)", color: "#2a1206", boxShadow: "0 0 20px rgba(255,122,26,0.3)" }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                      <MapPin className="w-4 h-4" />
                      Find a bubble
                    </motion.div>
                  </Link>
                </div>
              </div>
            </Reveal>
          )}

          {/* Your circle — who you've connected with, who's out right now */}
          {circle.length > 0 && (
            <Reveal as="section" className="mb-10" delay={0.05}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "var(--color-text-muted)" }}>
                  Your circle
                </h2>
                {liveNow.length > 0 && (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#4ade80" }}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: "#4ade80", opacity: 0.6 }} />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#4ade80" }} />
                    </span>
                    {liveNow.length} out right now
                  </span>
                )}
              </div>
              <StaggerContainer className="space-y-2" amount={0.05}>
                {circle.map((friend) => (
                  <StaggerItem key={friend.id}>
                    <div className="flex items-center gap-3.5 p-3 rounded-2xl"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="relative w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: "rgba(255,122,26,0.12)", color: "var(--color-text-primary)", border: "1px solid rgba(255,122,26,0.25)" }}>
                        {friend.avatar}
                        {friend.currentEvent && (
                          <span className="animate-pulse-dot absolute bottom-0 right-0 w-3 h-3 rounded-full"
                            style={{ background: "#4ade80", border: "2px solid #140F0A" }} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <ProfileLink name={friend.name} avatar={friend.avatar}
                          className="text-sm font-semibold truncate block" style={{ color: "var(--color-text-primary)" }}>
                          {friend.name}
                        </ProfileLink>
                        {friend.currentEvent ? (
                          <p className="text-[11px] truncate" style={{ color: "var(--color-text-primary)" }}>Live · {friend.currentEvent}</p>
                        ) : (
                          <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>Connected</p>
                        )}
                      </div>
                      <ProfileLink name={friend.name} avatar={friend.avatar}
                        className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold"
                        style={{ background: "rgba(255,122,26,0.12)", color: "var(--color-text-primary)", border: "1px solid rgba(255,122,26,0.25)" }}>
                        View
                      </ProfileLink>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </Reveal>
          )}

          {/* Nudge to start something */}
          <Reveal delay={0.1}>
            <Link href="/home">
              <motion.div
                className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ background: "rgba(255,122,26,0.06)", border: "1px dashed rgba(255,122,26,0.3)" }}
                whileHover={{ scale: 1.01, background: "rgba(255,122,26,0.1)" }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}>
                <Sparkles className="w-5 h-5 shrink-0" style={{ color: "#ff7a1a" }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Quiet here?</p>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Start something on Home — your next chat is one bubble away.</p>
                </div>
              </motion.div>
            </Link>
          </Reveal>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
