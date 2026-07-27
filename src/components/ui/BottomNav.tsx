"use client";

import { useState, useEffect } from "react";
import { Home, Compass, MessageCircle, User } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import logo from "../../../components/ui/assets/logo.jpg";
import { ProfileLink } from "@/components/ProfileLink";
import { useConnections } from "@/contexts/ConnectionsContext";
import { useSidebar } from "@/contexts/SidebarContext";

const tabs = [
  { icon: Home,          label: "Home",       path: "/home" },
  { icon: Compass,       label: "My Bubbles", path: "/my-bubbles" },
  { icon: MessageCircle, label: "Messages",   path: "/messages" },
  { icon: User,          label: "Profile",    path: "/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Open by default when the app loads; collapses once the mouse moves
  // away (e.g. toward the right, into the page content), and reveals
  // again on hover of the left edge — same as a native auto-hide panel.
  // Shared via context so page headers can shift left in sync.
  const { expanded, setExpanded } = useSidebar();

  const { getConnectedFriends } = useConnections();
  const connectedFriends = getConnectedFriends();
  const activePath = mounted ? pathname : null;

  return (
    <>
      {/* ── Desktop sidebar (open on load, collapses when the mouse moves away) ── */}
      <nav
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:flex-col transition-[width] duration-300 ease-out overflow-hidden ${expanded ? "w-64" : "w-3"}`}
        style={{
          background: "rgba(20,15,10,0.92)",
          borderRight: "1px solid rgba(255,122,26,0.08)",
          backdropFilter: "blur(16px)",
        }}>

        {/* always-visible edge glow — hints that hovering here reveals the nav */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[3px] transition-opacity duration-200"
          style={{
            opacity: expanded ? 0 : 1,
            background: "linear-gradient(180deg, transparent, rgba(255,122,26,0.55), transparent)",
          }}
        />

        <div className="w-64 shrink-0 flex flex-col h-full">
          {/* Logo */}
          <div className="px-5 pt-5 pb-4 flex items-center gap-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="relative h-8 w-8 overflow-hidden rounded-full shrink-0"
              style={{ border: "1px solid rgba(255,122,26,0.3)", boxShadow: "0 0 12px rgba(255,122,26,0.2)" }}>
              <Image src={logo} alt="Wanderers" className="h-full w-full object-cover" priority />
            </div>
            <span className="font-display text-lg font-bold whitespace-nowrap" style={{ color: "var(--color-text-primary)" }}>
              <span className="text-gradient">W</span>anderers
            </span>
          </div>

          <div className="py-4 flex flex-col flex-1 min-h-0 overflow-y-auto">
            {/* Nav links */}
            <div className="flex flex-col gap-0.5 px-3">
              {tabs.map((tab) => {
                const active = activePath === tab.path;
                return (
                  <Link key={tab.path} href={tab.path}>
                    <motion.div
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium relative whitespace-nowrap"
                      style={{
                        color: active ? "#FAFAFA" : "var(--color-text-secondary)",
                        background: active ? "rgba(255,122,26,0.1)" : "transparent",
                      }}
                      whileHover={{ x: 3, color: "#FAFAFA" }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    >
                      {active && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-xl"
                          style={{ background: "rgba(255,122,26,0.08)", border: "1px solid rgba(255,122,26,0.18)" }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <tab.icon className="w-4.5 h-4.5 relative z-10 shrink-0"
                        style={{ color: active ? "#ff7a1a" : undefined, strokeWidth: active ? 2.5 : 1.8 }} />
                      <span className="relative z-10">{tab.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Connected friends */}
            {connectedFriends.length > 0 && (
              <div className="mt-4 pt-4 px-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] px-2 mb-2 whitespace-nowrap"
                  style={{ color: "var(--color-text-muted)" }}>
                  Connected
                </p>
                <div className="space-y-0.5">
                  {connectedFriends.slice(0, 9).map((friend, i) => (
                    <motion.div key={friend.id}
                      className="friend-row flex items-center gap-2 px-2 py-1.5 rounded-lg"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ x: 3, background: "rgba(255,255,255,0.04)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.2 + i * 0.06 }}
                    >
                      <div className="relative shrink-0">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{ background: "rgba(255,122,26,0.15)", color: "var(--color-text-primary)", border: "1px solid rgba(255,122,26,0.2)" }}>
                          {friend.avatar}
                        </div>
                        {friend.currentEvent && (
                          <div className="animate-pulse-dot absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                            style={{ background: "#4ade80", border: "2px solid #140F0A" }} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <ProfileLink name={friend.name} avatar={friend.avatar}
                          className="text-xs font-medium truncate block"
                          style={{ color: "var(--color-text-primary)" }}>
                          {friend.name}
                        </ProfileLink>
                        {friend.currentEvent && (
                          <p className="text-[10px] truncate" style={{ color: "var(--color-text-primary)" }}>{friend.currentEvent}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{
          background: "rgba(20,15,10,0.92)",
          borderTop: "1px solid rgba(255,122,26,0.08)",
          backdropFilter: "blur(16px)",
        }}>
        <div className="max-w-3xl mx-auto flex items-stretch">
          {tabs.map((tab) => {
            const active = activePath === tab.path;
            return (
              <Link key={tab.path} href={tab.path} className="flex-1">
                <motion.div
                  className="flex flex-col items-center py-3 gap-1 relative"
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {active && (
                    <motion.div
                      layoutId="bottom-nav-active"
                      className="absolute inset-x-3 inset-y-1 rounded-xl"
                      style={{ background: "rgba(255,122,26,0.08)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <tab.icon className="w-5 h-5 relative z-10"
                    style={{
                      color: active ? "#ff7a1a" : "var(--color-text-muted)",
                      strokeWidth: active ? 2.5 : 1.8,
                      filter: active ? "drop-shadow(0 0 6px rgba(255,122,26,0.5))" : undefined,
                    }} />
                  <span className="text-[10px] font-medium relative z-10"
                    style={{ color: active ? "#ff7a1a" : "var(--color-text-muted)" }}>
                    {tab.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
