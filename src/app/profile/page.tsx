"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Edit2, Plus, LogOut, BadgeCheck, Star, Quote } from "lucide-react";
import BottomNav from "@/components/ui/BottomNav";
import AppHeader from "@/components/ui/AppHeader";
import { ProfileLink } from "@/components/ProfileLink";
import { personalityTraits, mockBubbles, interestOptions } from "@/lib/mockData";
import { useConnections } from "@/contexts/ConnectionsContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { supabase } from "@/lib/supabase";
import { Parallax } from "@/components/motion/Parallax";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useGuest } from "@/contexts/GuestContext";
import { DEMO_PROFILE } from "@/lib/demoData";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const VIBE_LABELS: Record<string, string> = {
  late_night_grinder: "Late Night Grinder",
  coffee_regular: "Coffee Shop Regular",
  sports: "Sports",
  study_buddy: "Study Buddy",
  explorer: "Explorer",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function displayNameFromEmail(email: string | null | undefined): string {
  if (!email) return "Wanderer";
  const local = email.split("@")[0] ?? "Wanderer";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// "Your Journey" entries - past bubbles restyled as a timeline.
const journeyTimes = ["2 days ago", "5 days ago", "1 week ago", "2 weeks ago"];

export default function ProfilePage() {
  const { checking, authed } = useRequireAuth();
  const { isGuest, guestResolved, exitGuestMode } = useGuest();
  const router = useRouter();
  const { expanded: sidebarExpanded } = useSidebar();
  const { connectionsCount, getConnectedFriends } = useConnections();
  const connectedFriends = getConnectedFriends();
  const [editingInterests, setEditingInterests] = useState(false);
  const [userInterests, setUserInterests] = useState(
    isGuest ? DEMO_PROFILE.interests : interestOptions.slice(0, 6)
  );
  const [customInterest, setCustomInterest] = useState("");
  const [displayName, setDisplayName] = useState<string | null>(isGuest ? DEMO_PROFILE.name : null);
  const [vibeTags, setVibeTags] = useState<string[]>(isGuest ? DEMO_PROFILE.vibeTags : ["Waterloo"]);

  useEffect(() => {
    if (!guestResolved) return;
    // Guest mode never touches Supabase - the demo profile above is already
    // the full state, no real session/name lookup happens.
    if (isGuest) return;

    let cancelled = false;

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        if (!cancelled) setDisplayName("Wanderer");
        return;
      }

      const metaName =
        (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
        (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
        null;

      const { data: row } = await supabase
        .from("users")
        .select("name, vibe, email")
        .eq("id", user.id)
        .maybeSingle();

      const name =
        (row?.name && String(row.name).trim()) ||
        metaName ||
        displayNameFromEmail(row?.email ?? user.email);

      const tags: string[] = [];
      if (row?.vibe && VIBE_LABELS[row.vibe]) tags.push(VIBE_LABELS[row.vibe]);
      tags.push("University of Waterloo");

      if (!cancelled) {
        setDisplayName(name);
        setVibeTags(tags);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isGuest, guestResolved]);

  const initials = useMemo(
    () => (isGuest ? DEMO_PROFILE.initials : getInitials(displayName ?? "Wanderer")),
    [displayName, isGuest]
  );

  const toggleInterest = (interest: string) => {
    setUserInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const addCustomInterest = () => {
    const t = customInterest.trim();
    if (t && !userInterests.includes(t)) {
      setUserInterests(prev => [...prev, t]);
      setCustomInterest("");
    }
  };

  const stats = isGuest
    ? DEMO_PROFILE.stats
    : [
        { label: "Connections", value: String(connectionsCount), star: false },
        { label: "Events Attended", value: "12", star: false },
        { label: "Vibe Rating", value: "4.9", star: true },
      ];

  if (checking || !authed) return null;

  return (
    <div className="min-h-screen pb-12">
      <AppHeader title="Profile" profileInitials={initials} />

      {/* Hero band with warm glow */}
      <div className={`relative transition-[padding] duration-300 ease-out ${sidebarExpanded ? "lg:pl-64" : "lg:pl-3"}`}>
        <Parallax speed={22} className="absolute inset-x-0 top-0 h-56 pointer-events-none">
          <div className="w-full h-full"
            style={{ background: "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(255,122,26,0.12) 0%, transparent 70%)" }} />
        </Parallax>

        <div className="relative max-w-3xl mx-auto px-4 py-8">

          {/* Avatar + identity */}
          <motion.div className="flex flex-col items-center text-center"
            initial={{ opacity: 0, filter: "blur(12px)", y: 28 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.65, ease }}>
            <div className="relative">
              {/* glowing ring */}
              <div className="absolute -inset-1.5 rounded-full animate-pulse-glow pointer-events-none"
                style={{ background: "conic-gradient(from 180deg, #ff7a1a, #ffb56b, #ff7a1a)", filter: "blur(6px)", opacity: 0.6 }} />
              <div className="relative w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold"
                style={{
                  background: "linear-gradient(135deg, #ff7a1a, #ffb56b)",
                  color: "#2a1206",
                  boxShadow: "0 0 36px rgba(255,122,26,0.45)",
                  border: "3px solid #140F0A",
                }}>
                {initials}
              </div>
              {/* verified badge */}
              <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "#140F0A", border: "2px solid rgba(255,122,26,0.4)" }}>
                <BadgeCheck className="w-4 h-4" style={{ color: "#ffb56b" }} />
              </div>
              <motion.button type="button" aria-label="Change photo"
                className="absolute -bottom-1 left-1 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(20,15,10,0.92)", border: "2px solid rgba(255,122,26,0.3)", color: "var(--color-text-secondary)" }}
                whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                <Camera className="w-3 h-3" />
              </motion.button>
            </div>

            <h2 className="text-2xl font-display font-bold mt-4" style={{ color: "var(--color-text-primary)" }}>
              {displayName ?? "Loading…"}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>University of Waterloo</p>

            {/* bio quote */}
            <p className="flex items-center gap-1.5 text-sm italic mt-3 max-w-sm" style={{ color: "var(--color-text-secondary)" }}>
              <Quote className="w-3.5 h-3.5 shrink-0" style={{ color: "#ff7a1a" }} />
              Seeking the quiet corners and the loud laughter.
            </p>

            {/* vibe identity tags */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {vibeTags.map((tag, i) => (
                <motion.span key={tag}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(255,122,26,0.12)", border: "1px solid rgba(255,122,26,0.25)", color: "var(--color-text-primary)" }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.25 + i * 0.06, ease }}>
                  {tag}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Stats - three */}
          <motion.div className="grid grid-cols-3 gap-3 mt-8"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease }}>
            {stats.map((stat, i) => (
              <motion.div key={stat.label}
                className="rounded-2xl p-4 text-center"
                style={{
                  background: "rgba(10,7,5,0.55)",
                  border: "1px solid rgba(255,122,26,0.14)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "inset 0 1px 0 rgba(255,122,26,0.07)",
                }}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.08, ease }}
                whileHover={{ scale: 1.04, borderColor: "rgba(255,122,26,0.25)" }}
              >
                <p className="text-2xl font-display font-bold text-gradient flex items-center justify-center gap-1">
                  {stat.value}
                  {stat.star && <Star className="w-4 h-4 fill-current" style={{ color: "var(--color-text-primary)" }} />}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wider mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}>
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Connections - hidden for guests, no real friends to show */}
          {!isGuest && connectedFriends.length > 0 && (
            <Section label="Connections" delay={0.16}>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                {connectedFriends.map((friend, i) => (
                  <motion.div
                    key={friend.id}
                    className="flex flex-col items-center gap-2 shrink-0 w-16"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, delay: 0.18 + i * 0.05, ease }}
                  >
                    <ProfileLink name={friend.name} avatar={friend.avatar} className="block">
                      <motion.div
                        className="relative w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: "rgba(255,122,26,0.12)", color: "var(--color-text-primary)", border: "1px solid rgba(255,122,26,0.25)" }}
                        whileHover={{ scale: 1.08, boxShadow: "0 0 18px rgba(255,122,26,0.35)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        {friend.avatar}
                        {friend.currentEvent && (
                          <span className="animate-pulse-dot absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full"
                            style={{ background: "#4ade80", border: "2px solid #140F0A" }} />
                        )}
                      </motion.div>
                    </ProfileLink>
                    <span className="text-[10px] text-center truncate w-full" style={{ color: "var(--color-text-secondary)" }}>
                      {friend.name.split(" ")[0]}
                    </span>
                  </motion.div>
                ))}
              </div>
            </Section>
          )}

          {/* My Interests */}
          <Section label="My Interests" delay={0.26}
            action={
              <motion.button type="button"
                onClick={() => setEditingInterests(!editingInterests)}
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: "var(--color-text-primary)" }}
                whileHover={{ x: 2 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                <Edit2 className="w-3 h-3" />
                {editingInterests ? "Done" : "Edit"}
              </motion.button>
            }>
            <div className="flex flex-wrap gap-2">
              {userInterests.map((interest) => (
                <motion.button key={interest} type="button"
                  onClick={() => editingInterests && toggleInterest(interest)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, #ff7a1a, #ffb56b)",
                    color: "#2a1206",
                    cursor: editingInterests ? "pointer" : "default",
                  }}
                  whileHover={editingInterests ? { scale: 1.05 } : {}}>
                  {interest}
                </motion.button>
              ))}

              {editingInterests && (
                <>
                  <div className="flex gap-2 items-center w-full mt-1">
                    <input
                      value={customInterest}
                      onChange={e => setCustomInterest(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomInterest())}
                      placeholder="Add your own…"
                      className="h-8 flex-1 max-w-[180px] text-xs px-3 rounded-full outline-none"
                      style={{ background: "rgba(10,7,5,0.55)", border: "1px solid rgba(255,122,26,0.2)", color: "var(--color-text-primary)" }}
                    />
                    <motion.button type="button" onClick={addCustomInterest}
                      aria-label="Add interest"
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "rgba(255,122,26,0.15)", color: "var(--color-text-primary)" }}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                      <Plus className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {interestOptions.filter(i => !userInterests.includes(i)).map(interest => (
                      <motion.button key={interest} type="button"
                        onClick={() => toggleInterest(interest)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{ background: "rgba(10,7,5,0.55)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}
                        whileHover={{ scale: 1.05, background: "rgba(255,122,26,0.1)", borderColor: "rgba(255,122,26,0.25)", color: "var(--color-text-primary)" }}
                        whileTap={{ scale: 0.97 }}>
                        {interest}
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Section>

          {/* Personality */}
          <Section label="Personality" delay={0.32}>
            <div className="flex flex-wrap gap-2">
              {personalityTraits.map((trait) => (
                <span key={trait}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: "rgba(10,7,5,0.55)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                  {trait}
                </span>
              ))}
            </div>
          </Section>

          {/* Your Journey - timeline */}
          <Section label="Your Journey" delay={0.38}
            action={<span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{mockBubbles.length} bubbles</span>}>
            <div className="relative pl-6">
              {/* vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: "linear-gradient(to bottom, rgba(255,122,26,0.5), rgba(255,122,26,0.05))" }} />
              <div className="space-y-3">
                {mockBubbles.slice(0, 4).map((b, i) => (
                  <motion.div key={b.id}
                    className="relative"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.08, ease }}>
                    {/* node */}
                    <span className="absolute -left-[22px] top-4 w-3.5 h-3.5 rounded-full"
                      style={{ background: "linear-gradient(135deg, #ff7a1a, #ffb56b)", boxShadow: "0 0 10px rgba(255,122,26,0.5)", border: "2px solid #140F0A" }} />
                    <motion.div
                      className="flex items-center gap-3 p-3.5 rounded-2xl"
                      style={{ background: "rgba(10,7,5,0.55)", border: "1px solid rgba(255,255,255,0.08)" }}
                      whileHover={{ x: 4, borderColor: "rgba(255,122,26,0.2)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                      <span className="text-2xl shrink-0">{b.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{b.title}</p>
                        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          {b.joined} wanderers · {b.category}
                        </p>
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color: "var(--color-text-muted)" }}>{journeyTimes[i]}</span>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          {/* Log out / Sign up */}
          <motion.button type="button"
            onClick={() => {
              if (isGuest) exitGuestMode();
              router.push("/login");
            }}
            className="w-full mt-8 h-11 rounded-full flex items-center justify-center gap-2 font-medium text-sm"
            style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.4 }}
            whileHover={{ scale: 1.02, background: "rgba(239,68,68,0.12)" }}
            whileTap={{ scale: 0.97 }}
          >
            <LogOut className="w-4 h-4" />
            {isGuest ? "Sign Up" : "Log Out"}
          </motion.button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function Section({ label, delay = 0, action, children }: {
  label: string; delay?: number; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <motion.div className="mt-7"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em]"
          style={{ color: "var(--color-text-muted)" }}>
          {label}
        </h3>
        {action}
      </div>
      {children}
    </motion.div>
  );
}
