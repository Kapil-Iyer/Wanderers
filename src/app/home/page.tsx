"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MapPin, ChevronsDown, Clock, Users, Instagram, ChevronLeft, ChevronRight } from "lucide-react";
import BottomNav from "@/components/ui/BottomNav";
import AppHeader from "@/components/ui/AppHeader";
import BubbleCard from "@/components/ui/BubbleCard";
import CampusEventCard from "@/components/ui/CampusEventCard";
import CreateBubbleModal from "@/components/ui/CreateBubbleModal";
import NotificationDrawer from "@/components/ui/NotificationDrawer";
import { mockBubbles, filterChips, mockFeedPosts, type FeedPost as FeedPostType } from "@/lib/mockData";
import FeedPost from "@/components/FeedPost";
import { useConnections } from "@/contexts/ConnectionsContext";
import { useConversations } from "@/contexts/ConversationsContext";
import EndEventModal from "@/components/EndEventModal";
import type { BubbleConversation } from "@/contexts/ConversationsContext";
import { Reveal, StaggerContainer, StaggerItem, AnimatedHeadline, CountUp, LineReveal, EASE } from "@/components/motion/Reveal";
import { Parallax } from "@/components/motion/Parallax";
import { getCategoryTheme } from "@/lib/categoryThemes";
import { useSidebar } from "@/contexts/SidebarContext";

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

type CampusEvent = {
  id: string; title: string; location: string; zone: string | null;
  date_time: string; organizer: string | null; category: string | null; source_url: string | null;
};

const EVENT_EMOJI: Record<string, string> = {
  sports: "🏀", academic: "📚", social: "🎉", arts: "🎨", career: "💼",
};

// "Thu · 4:00 PM"
function formatEventTime(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString(undefined, { weekday: "short" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}

export default function HomePage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [endEventBubble, setEndEventBubble] = useState<BubbleConversation | null>(null);
  const [feedPosts, setFeedPosts] = useState<FeedPostType[]>(mockFeedPosts);
  const defaultUpcoming = useMemo<UpcomingBubble[]>(
    () =>
      mockBubbles.slice(0, 6).map((b) => ({
        id: b.id,
        emoji: b.emoji,
        title: b.title,
        startingIn: b.startingIn,
        joined: b.joined,
        maxPeople: b.maxPeople,
        recommendationReason: "For you",
      })),
    []
  );
  const [upcomingForYou, setUpcomingForYou] = useState<UpcomingBubble[]>(defaultUpcoming);
  const [momentIndex, setMomentIndex] = useState(0);
  const [momentsPaused, setMomentsPaused] = useState(false);
  const [campusEvents, setCampusEvents] = useState<CampusEvent[]>([]);
  const [prefill, setPrefill] = useState<{ activity?: string; zone?: string } | undefined>();
  const [profileInitials, setProfileInitials] = useState("?");

  // Header / deep-link: /home?create=1 opens the create modal
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "1") {
      setPrefill(undefined);
      setCreateOpen(true);
      router.replace("/home", { scroll: false });
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    import("@/lib/supabase")
      .then((m) => m.supabase.auth.getSession())
      .then(async ({ data }) => {
        const user = data?.session?.user;
        if (!user || cancelled) return;
        const meta =
          (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
          (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
          "";
        const { data: row } = await import("@/lib/supabase").then((m) =>
          m.supabase.from("users").select("name").eq("id", user.id).maybeSingle()
        );
        const name = (row?.name && String(row.name).trim()) || meta || user.email?.split("@")[0] || "W";
        const parts = name.split(/\s+/).filter(Boolean);
        const initials =
          parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name.slice(0, 2).toUpperCase();
        if (!cancelled) setProfileInitials(initials);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const { expanded: sidebarExpanded } = useSidebar();
  const upcomingRef = useRef<HTMLDivElement>(null);
  const nearbyRef = useRef<HTMLElement>(null);
  const momentsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
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
      .then((data: {
        success?: boolean;
        data?: Array<{
          id: string;
          image_url?: string;
          cloudinary_url?: string;
          caption?: string | null;
          activity?: string;
          zone?: string | null;
          username?: string;
          user_avatar?: string;
          created_at: string;
        }>;
      }) => {
        if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
          setFeedPosts(data.data.map((m) => ({
            id: m.id,
            username: m.username || "Wanderer",
            userAvatar: m.user_avatar || "✨",
            activity: m.activity || "Campus moment",
            zone: m.zone || undefined,
            caption: (m.caption || "").trim() || "A moment from campus",
            timestamp: formatMomentTime(m.created_at),
            participants: [],
            likes: 0,
            comments: [],
            imageUrl: m.image_url ?? m.cloudinary_url,
          })));
        }
      })
      .catch(() => setFeedPosts(mockFeedPosts));
  }, []);

  useEffect(() => {
    if (feedPosts.length <= 1 || momentsPaused) return;
    const id = setInterval(() => setMomentIndex((i) => (i + 1) % feedPosts.length), 3000);
    return () => clearInterval(id);
  }, [feedPosts.length, momentsPaused]);

  useEffect(() => {
    import("@/lib/supabase")
      .then((m) => m.supabase.auth.getSession())
      .then(({ data }) => {
        const userId = data?.session?.user?.id;
        const url = userId ? `/api/recommendations?user_id=${encodeURIComponent(userId)}` : "/api/recommendations";
        return fetch(url).then((r) => {
          if (!r.ok) throw new Error("recommendations failed");
          return r.json();
        });
      })
      .then((data: { recommended_bubbles?: Array<{ id: string; title?: string; emoji?: string; startingIn?: string; joined?: number; maxPeople?: number; recommendationReason?: string }> }) => {
        const list = data?.recommended_bubbles;
        if (Array.isArray(list) && list.length > 0) {
          setUpcomingForYou(list.map((b) => ({
            id: b.id, emoji: b.emoji ?? "🫧", title: b.title ?? "Activity",
            startingIn: b.startingIn ?? "Soon", joined: b.joined ?? 0, maxPeople: b.maxPeople ?? 8,
            recommendationReason: b.recommendationReason ?? "For you",
          })));
        } else {
          setUpcomingForYou(defaultUpcoming);
        }
      })
      .catch(() => setUpcomingForYou(defaultUpcoming));
  }, [defaultUpcoming]);

  const addPost = (post: Omit<FeedPostType, "id" | "timestamp"> & { imageUrl?: string }) => {
    const { imageUrl, ...rest } = post;
    setFeedPosts((prev) => [{ ...rest, ...(imageUrl && { imageUrl }), id: `f-${Date.now()}`, timestamp: "JUST NOW" }, ...prev]);
  };

  // Happening on Campus - upcoming campus events (public; falls back server-side)
  useEffect(() => {
    fetch("/api/campus-events")
      .then((r) => r.json())
      .then((d: { success?: boolean; data?: CampusEvent[] }) => {
        if (d?.success && Array.isArray(d.data)) setCampusEvents(d.data.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const filteredBubbles = useMemo(() => {
    // Startable campus catalog - always 0 members until someone starts (matches Explore).
    const source = mockBubbles;
    if (activeFilter === "Happening Now") {
      return source.filter((b) => b.startingIn.includes("min") || b.startingIn === "Now");
    }
    if (activeFilter === "Starting Soon") {
      return source.filter((b) => b.startingIn.includes("hr"));
    }
    if (activeFilter === "All") return source;
    return source.filter((b) => b.category === activeFilter);
  }, [activeFilter]);

  const scrollToMoments = () => momentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen pb-12">

      <AppHeader
        showCampus
        notificationCount={pendingCount}
        onNotificationsClick={() => setDrawerOpen(true)}
        profileInitials={profileInitials}
        onStartSomething={() => {
          setPrefill(undefined);
          setCreateOpen(true);
        }}
      />

      <div className={`transition-[padding] duration-300 ease-out ${sidebarExpanded ? "lg:pl-64" : "lg:pl-3"}`}>
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8">

          {/* ── CINEMATIC HERO - two-column ── */}
          <section className="relative pt-12 pb-10 sm:pt-16 sm:pb-12">
            {/* hero orbs - CSS keyframe handles the idle drift, Parallax (GSAP ScrollTrigger)
                adds a scroll-linked layer on top so they sink at different rates as you scroll past */}
            <div className="absolute inset-0 -z-0 pointer-events-none overflow-hidden">
              <Parallax speed={-22} className="absolute top-0 left-[15%] w-80 h-80" start="top bottom" end="bottom top">
                <div className="w-full h-full rounded-full animate-float-orb"
                  style={{ background: "radial-gradient(circle, rgba(255,122,26,0.1) 0%, transparent 65%)" }} />
              </Parallax>
              <Parallax speed={28} className="absolute top-10 right-[5%] w-72 h-72" start="top bottom" end="bottom top">
                <div className="w-full h-full rounded-full animate-float-orb"
                  style={{ background: "radial-gradient(circle, rgba(255,181,107,0.06) 0%, transparent 65%)", animationDelay: "-6s" }} />
              </Parallax>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12 items-start">

              {/* Left - 60% */}
              <div className="lg:col-span-3">
                <motion.div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
                  style={{ background: "rgba(10,7,5,0.7)", border: "1px solid rgba(255,122,26,0.3)", backdropFilter: "blur(8px)" }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: "#4ade80", opacity: 0.6 }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#4ade80" }} />
                  </span>
                  <span className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: "var(--color-text-primary)" }}>
                    University of Waterloo
                  </span>
                  <span className="w-1 h-1 rounded-full" style={{ background: "var(--color-text-primary)", opacity: 0.5 }} />
                  <span className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: "#4ade80" }}>
                    Live
                  </span>
                </motion.div>

                <AnimatedHeadline
                  text="Campus is alive."
                  accentWords={["alive."]}
                  accentClassName="text-gradient-3d"
                  className="font-display text-5xl sm:text-7xl font-bold leading-[1.02] tracking-tight"
                  delay={0.1}
                />

                <motion.p
                  className="mt-5 text-base sm:text-lg max-w-md leading-relaxed"
                  style={{ color: "var(--color-text-secondary)", textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
                >
                  Real students, real moments happening within walking distance. Find your people, start something.
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
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: "var(--color-text-primary)" }}>
                    Recent moments from your campus
                  </p>
                  <PolaroidStack posts={feedPosts.slice(0, 3)} onClick={scrollToMoments} />
                </motion.div>
              </div>

              {/* Right - 40% live panel */}
              <div className="lg:col-span-2 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: EASE }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: "#ff7a1a", opacity: 0.5 }} />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#ff7a1a" }} />
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
                <ChevronsDown className="w-4 h-4" style={{ color: "#ff7a1a" }} />
              </motion.span>
              Scroll to explore what's happening
            </motion.div>
          </section>

          <LineReveal className="h-px w-full mb-12" />

          {/* ── UPCOMING FOR YOU ── */}
          <div ref={upcomingRef}>
          <Reveal className="mb-14" as="section">
            <SectionHeader kicker="Picked for you" title="Upcoming for you" />
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-5 px-5 sm:-mx-8 sm:px-8">
              {upcomingForYou.map((b) => (
                <motion.div
                  key={b.id}
                  className="flex-shrink-0 w-52 rounded-3xl overflow-hidden cursor-pointer"
                  style={{ background: "rgba(10,7,5,0.95)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}
                  whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 48px -16px rgba(255,122,26,0.3)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                >
                  <Link href={`/chat/bubble-${b.id}`} className="block">
                    <div className="h-24 flex items-center justify-center relative"
                      style={{ background: "linear-gradient(135deg, rgba(255,122,26,0.22), rgba(255,181,107,0.1)), rgba(8,6,4,0.97)" }}>
                      <span className="text-4xl">{b.emoji}</span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-semibold line-clamp-1" style={{ color: "var(--color-text-primary)" }}>{b.title}</p>
                      <p className="text-[11px] mt-1 line-clamp-2 leading-snug font-medium" style={{ color: "var(--color-text-secondary)" }}>{b.recommendationReason || "For you"}</p>
                      <p className="text-[11px] mt-2 font-medium" style={{ color: "var(--color-text-primary)" }}>{b.startingIn} · {b.joined}/{b.maxPeople}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </Reveal>
          </div>

          {/* ── ACTIVE NEARBY ── */}
          <section className="mb-16" ref={nearbyRef}>
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
                        background: active ? "transparent" : "rgba(10,7,5,0.6)",
                        border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.14)",
                        color: active ? "#2a1206" : "var(--color-text-primary)",
                        fontWeight: active ? 700 : 600,
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      {active && (
                        <motion.div
                          layoutId="active-chip-indicator"
                          className="absolute inset-0 rounded-full"
                          style={{ background: "linear-gradient(135deg, #ff7a1a, #ffb56b)", boxShadow: "0 0 14px rgba(255,122,26,0.28)" }}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{chip}</span>
                    </motion.button>
                  );
                })}
              </div>
            </Reveal>

            {/* ── HAPPENING ON CAMPUS - same card template as bubbles ── */}
            {campusEvents.length > 0 && (
              <Reveal delay={0.08}>
                <div className="mb-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: "#ff7a1a" }}>
                    Happening on campus
                  </p>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {campusEvents.map((ev) => (
                      <CampusEventCard
                        key={ev.id}
                        emoji={EVENT_EMOJI[ev.category ?? ""] ?? "📅"}
                        title={ev.title}
                        location={ev.location}
                        timeLabel={formatEventTime(ev.date_time)}
                        organizer={ev.organizer}
                        onStartBubble={() => {
                          setPrefill({ activity: ev.title, zone: ev.zone ?? ev.location });
                          setCreateOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            <AnimatePresence mode="wait">
              {filteredBubbles.length === 0 ? (
                <motion.div
                  key="empty"
                  className="text-center py-16"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <div className="text-5xl mb-3">🫧</div>
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Nothing in this category yet - be the first to start something.</p>
                </motion.div>
              ) : (
                <StaggerContainer
                  key={activeFilter}
                  className="grid grid-cols-3 gap-3 sm:gap-4 auto-rows-fr"
                >
                  {filteredBubbles.map((bubble) => (
                    <StaggerItem key={bubble.id} className="h-full">
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
            <div
              className="relative max-w-md mx-auto mt-6"
              onMouseEnter={() => setMomentsPaused(true)}
              onMouseLeave={() => setMomentsPaused(false)}
            >
              {feedPosts.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: "var(--color-text-secondary)" }}>
                  No moments yet. End an event and post one!
                </p>
              ) : (
                <>
                  <div className="relative">
                    {feedPosts.length > 1 && (
                      <>
                        <button
                          type="button"
                          aria-label="Previous moment"
                          onClick={() =>
                            setMomentIndex((i) => (i - 1 + feedPosts.length) % feedPosts.length)
                          }
                          className="absolute -left-2 sm:-left-11 top-1/2 z-10 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-80"
                          style={{
                            background: "rgba(18,13,10,0.85)",
                            border: "1px solid rgba(255,181,107,0.22)",
                            color: "#ffb56b",
                          }}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Next moment"
                          onClick={() => setMomentIndex((i) => (i + 1) % feedPosts.length)}
                          className="absolute -right-2 sm:-right-11 top-1/2 z-10 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-80"
                          style={{
                            background: "rgba(18,13,10,0.85)",
                            border: "1px solid rgba(255,181,107,0.22)",
                            color: "#ffb56b",
                          }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={feedPosts[momentIndex % feedPosts.length].id}
                        initial={{ opacity: 0, x: 48 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -48 }}
                        transition={{ duration: 0.4, ease: EASE }}
                      >
                        <FeedPost post={feedPosts[momentIndex % feedPosts.length]} />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {feedPosts.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-4">
                      {feedPosts.map((post, i) => (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => setMomentIndex(i)}
                          aria-label={`Show moment ${i + 1}`}
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: i === momentIndex % feedPosts.length ? 20 : 6,
                            background:
                              i === momentIndex % feedPosts.length
                                ? "#ff7a1a"
                                : "rgba(255,255,255,0.2)",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <LineReveal className="h-px w-full mb-12" />

          {/* ── ABOUT US ── */}
          <div ref={aboutRef}>
          <Reveal as="section" className="mb-16 pb-4">
            <div
              className="rounded-3xl px-6 py-10 sm:px-12 sm:py-12 text-center"
              style={{ background: "rgba(10,7,5,0.6)", border: "1px solid rgba(255,122,26,0.12)" }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--color-accent-start)" }}>
                About us
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
                Looking to wander?
              </h2>
              <p className="text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-5" style={{ color: "var(--color-text-secondary)" }}>
                Create a bubble to start an event, or join one to keep yourself busy around campus.
              </p>
              <p className="text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-8" style={{ color: "var(--color-text-secondary)" }}>
                Wanderers is a University of Waterloo campus app for finding people nearby in real time.
                Spot open hangouts, study sessions, coffee runs, and pickup games - then join a bubble or
                start your own so empty pockets of time turn into real moments with real students.
              </p>
              <a
                href="https://instagram.com/uw_wanderers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold"
                style={{ background: "linear-gradient(135deg, #ff7a1a, #ffb56b)", color: "#2a1206", boxShadow: "0 0 16px rgba(255,122,26,0.3)" }}
              >
                <Instagram className="w-4 h-4" />
                @uw_wanderers
              </a>
            </div>
          </Reveal>
          </div>
        </div>
      </div>

      {/* drawer + modals + nav */}
      <NotificationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEndEvent={(b) => { setDrawerOpen(false); setEndEventBubble(b); }}
      />
      <CreateBubbleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        prefill={prefill}
        onCreated={() => {
          /* Catalog stays startable; new bubbles are available from Messages / chat. */
        }}
      />
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
      <div className="text-3xl sm:text-4xl font-bold leading-none" style={{ color: "var(--color-text-primary)" }}>
        <CountUp to={value} />
      </div>
      <p className="text-xs mt-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>{label}</p>
    </div>
  );
}

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: "var(--color-text-primary)" }}>{kicker}</p>
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
          background: "rgba(10,9,8,0.72)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderLeft: `3px solid ${theme.from}`,
          boxShadow: `inset 4px 0 16px -8px ${theme.from}50`,
          backdropFilter: "blur(10px)",
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

/* Polaroid stack teaser - compact dark frame */
function PolaroidStack({ posts, onClick }: { posts: FeedPostType[]; onClick: () => void }) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (posts.length <= 1 || reduce) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % posts.length), 3000);
    return () => clearInterval(id);
  }, [posts.length, reduce]);

  if (posts.length === 0) return null;
  const post = posts[index % posts.length];

  return (
    <div style={{ width: 108 }}>
      <button
        type="button"
        onClick={onClick}
        aria-label="See recent moments"
        className="relative block w-full overflow-hidden rounded-xl"
        style={{
          height: 132,
          background: "linear-gradient(165deg, #1a1510, #0c0907)",
          border: "1px solid rgba(255,181,107,0.2)",
          boxShadow: "0 12px 28px -10px rgba(0,0,0,0.65)",
          padding: 6,
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={post.id}
            className="absolute inset-[6px] rounded-lg overflow-hidden flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.35)" }}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.45, ease: EASE }}
            whileHover={{ scale: 1.03 }}
          >
            {post.imageUrl ? (
              <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">{post.userAvatar.length <= 2 ? "📸" : post.userAvatar}</span>
            )}
          </motion.div>
        </AnimatePresence>
      </button>

      {posts.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1">
          {posts.map((p, i) => (
            <span
              key={p.id}
              className="h-1 rounded-full transition-all"
              style={{
                width: i === index ? 12 : 4,
                background: i === index ? "#ff7a1a" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* Cycling moments counter - ticks upward every 2s, 222.place style */
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
          className="text-xl font-bold inline-block tabular-nums"
          style={{ color: "var(--color-text-primary)" }}
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
