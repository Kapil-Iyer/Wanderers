"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, MapPin, Bell, ChevronsDown, Clock, Users } from "lucide-react";
import BottomNav from "@/components/ui/BottomNav";
import BubbleCard from "@/components/ui/BubbleCard";
import CreateBubbleModal from "@/components/ui/CreateBubbleModal";
import StartSomethingFab from "@/components/ui/StartSomethingFab";
import NotificationDrawer from "@/components/ui/NotificationDrawer";
import { mockBubbles, filterChips, mockFeedPosts, type FeedPost as FeedPostType } from "@/lib/mockData";
import FeedPost from "@/components/FeedPost";
import { useConnections } from "@/contexts/ConnectionsContext";
import { useConversations } from "@/contexts/ConversationsContext";
import EndEventModal from "@/components/EndEventModal";
import type { BubbleConversation } from "@/contexts/ConversationsContext";
import { Reveal, StaggerContainer, StaggerItem, AnimatedHeadline, CountUp, LineReveal, EASE } from "@/components/motion/Reveal";
import { getCategoryTheme } from "@/lib/categoryThemes";

type UpcomingBubble = {
  id: string; emoji: string; title: string; startingIn: string;
  joined: number; maxPeople: number; recommendationReason?: string;
};

function formatMomentTime(iso: string): string {
  const d = new Date(iso);
  const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState("Happening Now");
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [endEventBubble, setEndEventBubble] = useState<BubbleConversation | null>(null);
  const [feedPosts, setFeedPosts] = useState<FeedPostType[]>(mockFeedPosts);
  const [upcomingForYou, setUpcomingForYou] = useState<UpcomingBubble[]>(
    mockBubbles.slice(0, 6).map((b) => ({ ...b, recommendationReason: "Loading…" }))
  );

  const router = useRouter();
  const momentsRef = useRef<HTMLDivElement>(null);
  const { filteredConnectionRequests } = useConnections();
  const { joinedBubbles, removeBubbleFromJoined } = useConversations();
  const pendingCount = filteredConnectionRequests.length;

  // Live hero stats (derived from current bubble set)
  const happeningNow = useMemo(() => mockBubbles.filter((b) => b.startingIn.includes("min")), []);
  const liveBubbleCount = happeningNow.length;
  const wanderersOut = useMemo(() => mockBubbles.reduce((sum, b) => sum + b.joined, 0), []);

  useEffect(() => {
    fetch("/api/moments")
      .then((r) => r.json())
      .then((data: { success?: boolean; data?: Array<{ id: string; cloudinary_url: string; created_at: string }> }) => {
        if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
          setFeedPosts(data.data.map((m) => ({
            id: m.id, username: "Wanderer", userAvatar: "✨", activity: "Wander Moment",
            zone: "—", caption: "#wandermoment", timestamp: formatMomentTime(m.created_at),
            participants: [], likes: 0, comments: [], imageUrl: m.cloudinary_url,
          })));
        }
      })
      .catch(() => setFeedPosts(mockFeedPosts));
  }, []);

  useEffect(() => {
    import("@/lib/supabase")
      .then((m) => m.supabase.auth.getSession())
      .then(({ data }) => {
        const userId = data?.session?.user?.id;
        const url = userId ? `/api/recommendations?user_id=${encodeURIComponent(userId)}` : "/api/recommendations";
        return fetch(url).then((r) => r.json());
      })
      .then((data: { recommended_bubbles?: Array<{ id: string; title?: string; emoji?: string; startingIn?: string; joined?: number; maxPeople?: number; recommendationReason?: string }> }) => {
        const list = data?.recommended_bubbles;
        if (Array.isArray(list) && list.length > 0) {
          setUpcomingForYou(list.map((b) => ({
            id: b.id, emoji: b.emoji ?? "🫧", title: b.title ?? "Activity",
            startingIn: b.startingIn ?? "Soon", joined: b.joined ?? 0, maxPeople: b.maxPeople ?? 8,
            recommendationReason: b.recommendationReason ?? "For you",
          })));
        }
      })
      .catch(() => {});
  }, []);

  const addPost = (post: Omit<FeedPostType, "id" | "timestamp"> & { imageUrl?: string }) => {
    const { imageUrl, ...rest } = post;
    setFeedPosts((prev) => [{ ...rest, ...(imageUrl && { imageUrl }), id: `f-${Date.now()}`, timestamp: "JUST NOW" }, ...prev]);
  };

  const filteredBubbles = useMemo(() => {
    if (activeFilter === "Happening Now") return mockBubbles.filter((b) => b.startingIn.includes("min"));
    if (activeFilter === "Starting Soon") return mockBubbles.filter((b) => b.startingIn.includes("hr"));
    return mockBubbles.filter((b) => b.category === activeFilter);
  }, [activeFilter]);

  const scrollToMoments = () => momentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen pb-40" style={{ background: "var(--color-bg)" }}>

      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-40"
        style={{ background: "rgba(9,9,11,0.8)", borderBottom: "1px solid rgba(249,115,22,0.07)", backdropFilter: "blur(16px)" }}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 lg:pl-72 max-w-[1400px] mx-auto">
          <button className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            <MapPin className="w-3.5 h-3.5" style={{ color: "#F97316" }} />
            University of Waterloo
            <ChevronDown className="w-3 h-3" style={{ color: "var(--color-text-muted)" }} />
          </button>

          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={`Notifications${pendingCount ? `, ${pendingCount} pending` : ""}`}
              className="relative w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-secondary)" }}
              whileHover={{ scale: 1.08, color: "#F97316" }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Bell className="w-4 h-4" />
              {pendingCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ background: "linear-gradient(135deg, #F97316, #FBBF24)", color: "#1a0a00", boxShadow: "0 0 8px rgba(249,115,22,0.5)" }}
                >
                  {pendingCount}
                </span>
              )}
            </motion.button>

            <motion.button
              type="button"
              onClick={() => router.push("/profile")}
              aria-label="Your profile"
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #F97316, #FBBF24)", color: "#1a0a00", boxShadow: "0 0 12px rgba(249,115,22,0.3)" }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              JD
            </motion.button>
          </div>
        </div>
      </header>

      <div className="lg:pl-64">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8">

          {/* ── CINEMATIC HERO — two-column ── */}
          <section className="relative pt-12 pb-10 sm:pt-16 sm:pb-12">
            {/* hero orbs */}
            <div className="absolute inset-0 -z-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-[15%] w-80 h-80 rounded-full animate-float-orb"
                style={{ background: "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 65%)" }} />
              <div className="absolute top-10 right-[5%] w-72 h-72 rounded-full animate-float-orb"
                style={{ background: "radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 65%)", animationDelay: "-6s" }} />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12 items-start">

              {/* Left — 60% */}
              <div className="lg:col-span-3">
                <motion.div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
                  style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: "#4ade80", opacity: 0.6 }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#4ade80" }} />
                  </span>
                  <span className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: "#FBBF24" }}>
                    University of Waterloo — Live
                  </span>
                </motion.div>

                <AnimatedHeadline
                  text="Campus is alive."
                  accentWords={["alive."]}
                  className="font-display text-5xl sm:text-7xl font-bold leading-[1.02] tracking-tight"
                  delay={0.1}
                />

                <motion.p
                  className="mt-5 text-base sm:text-lg max-w-md leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
                >
                  Real students, real moments — happening within walking distance. Find your people, start something.
                </motion.p>

                {/* live stat counters */}
                <motion.div
                  className="flex items-center gap-8 mt-8"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7, ease: EASE }}
                >
                  <HeroStat value={liveBubbleCount} label="bubbles active" />
                  <div className="w-px h-10" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <HeroStat value={wanderersOut} label="wanderers out" />
                </motion.div>

                {/* Polaroid moments teaser */}
                <motion.div
                  className="mt-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9, ease: EASE }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: "#F97316" }}>
                    Recent moments from your campus
                  </p>
                  <PolaroidStack posts={feedPosts.slice(0, 3)} onClick={scrollToMoments} />
                </motion.div>
              </div>

              {/* Right — 40% live panel */}
              <div className="lg:col-span-2 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: EASE }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4 flex items-center gap-2" style={{ color: "#F97316" }}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: "#F97316", opacity: 0.5 }} />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#F97316" }} />
                    </span>
                    What's happening
                  </p>
                </motion.div>
                <div className="flex flex-col gap-3">
                  {happeningNow.slice(0, 4).map((b, i) => (
                    <LiveTickerCard key={b.id} bubble={b} index={i} />
                  ))}
                </div>
              </div>
            </div>

            {/* scroll cue */}
            <motion.div
              className="hidden sm:flex items-center gap-2 mt-12 text-xs font-medium relative z-10"
              style={{ color: "var(--color-text-muted)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.6 }}
            >
              <motion.span animate={{ y: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
                <ChevronsDown className="w-4 h-4" style={{ color: "#F97316" }} />
              </motion.span>
              Scroll to explore what's happening
            </motion.div>
          </section>

          <LineReveal className="h-px w-full mb-12" />

          {/* ── UPCOMING FOR YOU ── */}
          <Reveal className="mb-14" as="section">
            <SectionHeader kicker="Picked for you" title="Upcoming for you" />
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-5 px-5 sm:-mx-8 sm:px-8">
              {upcomingForYou.map((b) => (
                <motion.div
                  key={b.id}
                  className="flex-shrink-0 w-52 rounded-3xl overflow-hidden cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}
                  whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 48px -16px rgba(249,115,22,0.3)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                >
                  <Link href={`/chat/bubble-${b.id}`} className="block">
                    <div className="h-24 flex items-center justify-center relative"
                      style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.22), rgba(251,191,36,0.1))" }}>
                      <span className="text-4xl">{b.emoji}</span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-semibold line-clamp-1" style={{ color: "var(--color-text-primary)" }}>{b.title}</p>
                      <p className="text-[11px] mt-1 line-clamp-2 leading-snug" style={{ color: "var(--color-text-secondary)" }}>{b.recommendationReason || "For you"}</p>
                      <p className="text-[11px] mt-2 font-medium" style={{ color: "#F97316" }}>{b.startingIn} · {b.joined}/{b.maxPeople}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </Reveal>

          {/* ── ACTIVE NEARBY ── */}
          <section className="mb-16">
            <Reveal>
              <SectionHeader kicker="Within walking distance" title="Active nearby" />
            </Reveal>

            {/* filter chips with shared sliding indicator */}
            <Reveal delay={0.05}>
              <div className="flex gap-2 overflow-x-auto pb-3 -mx-5 px-5 sm:-mx-8 sm:px-8 mb-7">
                {filterChips.map((chip) => {
                  const active = activeFilter === chip;
                  return (
                    <motion.button
                      key={chip}
                      type="button"
                      onClick={() => setActiveFilter(chip)}
                      className="relative px-4 py-2 rounded-full text-xs whitespace-nowrap"
                      style={{
                        background: active ? "transparent" : "rgba(255,255,255,0.04)",
                        border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)",
                        color: active ? "#1a0a00" : "var(--color-text-secondary)",
                        fontWeight: active ? 700 : 500,
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      {active && (
                        <motion.div
                          layoutId="active-chip-indicator"
                          className="absolute inset-0 rounded-full"
                          style={{ background: "linear-gradient(135deg, #F97316, #FBBF24)", boxShadow: "0 0 14px rgba(249,115,22,0.28)" }}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{chip}</span>
                    </motion.button>
                  );
                })}
              </div>
            </Reveal>

            <AnimatePresence mode="wait">
              {filteredBubbles.length === 0 ? (
                <motion.div
                  key="empty"
                  className="text-center py-16"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <div className="text-5xl mb-3">🫧</div>
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Nothing in this category yet — be the first to start something.</p>
                </motion.div>
              ) : (
                <StaggerContainer
                  key={activeFilter}
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                >
                  {filteredBubbles.map((bubble) => (
                    <StaggerItem key={bubble.id}>
                      <BubbleCard bubble={bubble} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </AnimatePresence>
          </section>

          <LineReveal className="h-px w-full mb-12" />

          {/* ── RECENT MOMENTS ── */}
          <section className="mb-8" ref={momentsRef}>
            <Reveal>
              <SectionHeader kicker="Captured by wanderers" title="Recent moments" />
            </Reveal>
            <Reveal delay={0.05}>
              <MomentsTicker base={1247} />
            </Reveal>
            <div className="max-w-xl mx-auto mt-8">
              {feedPosts.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: "var(--color-text-secondary)" }}>
                  No moments yet. End an event and post one!
                </p>
              ) : (
                <StaggerContainer className="space-y-6">
                  {feedPosts.map((post) => (
                    <StaggerItem key={post.id}>
                      <FeedPost post={post} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* FAB + drawer + modals + nav */}
      <StartSomethingFab onClick={() => setCreateOpen(true)} />
      <NotificationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEndEvent={(b) => { setDrawerOpen(false); setEndEventBubble(b); }}
      />
      <CreateBubbleModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {endEventBubble && (
        <EndEventModal
          bubble={endEventBubble}
          onAddPost={addPost}
          onClose={() => { removeBubbleFromJoined(endEventBubble.id); setEndEventBubble(null); }}
        />
      )}
      <BottomNav />
    </div>
  );
}

/* ── helpers ── */

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl sm:text-4xl font-bold text-gradient leading-none">
        <CountUp to={value} />
      </div>
      <p className="text-xs mt-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{label}</p>
    </div>
  );
}

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: "#F97316" }}>{kicker}</p>
      <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
    </div>
  );
}

/* Compact live card for the hero's "What's happening" panel */
function LiveTickerCard({ bubble, index }: { bubble: (typeof mockBubbles)[number]; index: number }) {
  const reduce = useReducedMotion();
  const theme = getCategoryTheme(bubble.category);
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(10px)", y: 20 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, filter: "blur(0px)", y: 0 }}
      transition={{ duration: 0.55, delay: 0.5 + index * 0.12, ease: EASE }}
      whileHover={{ x: 4, scale: 1.01 }}
    >
      <Link
        href={`/chat/bubble-${bubble.id}`}
        className="flex items-center gap-3.5 p-3.5 rounded-2xl relative overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderLeft: `3px solid ${theme.from}`,
          boxShadow: `inset 4px 0 16px -8px ${theme.from}50`,
          backdropFilter: "blur(8px)",
          display: "flex",
        }}
      >
        <span className="text-2xl shrink-0">{bubble.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{bubble.title}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
              <MapPin className="w-3 h-3" style={{ color: theme.accent }} />{bubble.zone ?? bubble.distance}
            </span>
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
              <Clock className="w-3 h-3" style={{ color: theme.accent }} />{bubble.startingIn}
            </span>
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
              <Users className="w-3 h-3" style={{ color: theme.accent }} />{bubble.joined}/{bubble.maxPeople}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* Polaroid stack — 222.place inspired, warm photo borders, slight rotation */
function PolaroidStack({ posts, onClick }: { posts: FeedPostType[]; onClick: () => void }) {
  const rotations = [-6, 3, -2];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="See recent moments"
      className="relative flex items-end h-36 pl-2"
      style={{ width: 3 * 86 + 40 }}
    >
      {posts.map((post, i) => (
        <motion.div
          key={post.id}
          className="absolute rounded-md overflow-hidden"
          style={{
            left: i * 78,
            bottom: 0,
            width: 104,
            height: 128,
            background: "#FAF7F2",
            padding: "6px 6px 22px 6px",
            boxShadow: "0 12px 32px -8px rgba(0,0,0,0.6)",
            rotate: `${rotations[i % rotations.length]}deg`,
            zIndex: i,
          }}
          initial={{ opacity: 0, y: 24, rotate: rotations[i % rotations.length] - 8 }}
          animate={{ opacity: 1, y: 0, rotate: rotations[i % rotations.length] }}
          transition={{ duration: 0.6, delay: 1.0 + i * 0.12, ease: [0.34, 1.56, 0.64, 1] }}
          whileHover={{ y: -8, rotate: 0, zIndex: 10, scale: 1.05 }}
        >
          <div
            className="w-full h-full rounded-sm overflow-hidden flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.25), rgba(120,60,20,0.5))" }}
          >
            {post.imageUrl ? (
              <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">{post.userAvatar.length <= 2 ? "📸" : post.userAvatar}</span>
            )}
          </div>
          <p className="absolute bottom-1 left-0 right-0 text-center text-[8px] font-medium" style={{ color: "#52525B" }}>
            {post.zone ?? "—"} · {post.timestamp.toLowerCase()}
          </p>
        </motion.div>
      ))}
    </button>
  );
}

/* Cycling moments counter — ticks upward every 2s, 222.place style */
function MomentsTicker({ base }: { base: number }) {
  const [count, setCount] = useState(base);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + Math.ceil(Math.random() * 3)), 2000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          className="font-display text-xl font-bold text-gradient inline-block tabular-nums"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          {count.toLocaleString()}
        </motion.span>
      </AnimatePresence>
      {" "}moments captured and counting
    </p>
  );
}
