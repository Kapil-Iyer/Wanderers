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

  const { getConnectedFriends } = useConnections();
  const connectedFriends = getConnectedFriends();
  const activePath = mounted ? pathname : null;

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <nav className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col"
        style={{
          background: "rgba(9,9,11,0.92)",
          borderRight: "1px solid rgba(249,115,22,0.08)",
          backdropFilter: "blur(16px)",
        }}>

        {/* Logo */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="relative h-8 w-8 overflow-hidden rounded-full"
            style={{ border: "1px solid rgba(249,115,22,0.3)", boxShadow: "0 0 12px rgba(249,115,22,0.2)" }}>
            <Image src={logo} alt="Wanderers" className="h-full w-full object-cover" priority />
          </div>
          <span className="font-display text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
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
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium relative"
                    style={{
                      color: active ? "#FAFAFA" : "var(--color-text-secondary)",
                      background: active ? "rgba(249,115,22,0.1)" : "transparent",
                    }}
                    whileHover={{ x: 3, color: "#FAFAFA" }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.18)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <tab.icon className="w-4.5 h-4.5 relative z-10"
                      style={{ color: active ? "#F97316" : undefined, strokeWidth: active ? 2.5 : 1.8 }} />
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
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] px-2 mb-2"
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
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: "rgba(249,115,22,0.15)", color: "#F97316", border: "1px solid rgba(249,115,22,0.2)" }}>
                        {friend.avatar}
                      </div>
                      {friend.currentEvent && (
                        <div className="animate-pulse-dot absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                          style={{ background: "#4ade80", border: "2px solid #09090B" }} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <ProfileLink name={friend.name} avatar={friend.avatar}
                        className="text-xs font-medium truncate block"
                        style={{ color: "var(--color-text-primary)" }}>
                        {friend.name}
                      </ProfileLink>
                      {friend.currentEvent && (
                        <p className="text-[10px] truncate" style={{ color: "#F97316" }}>{friend.currentEvent}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{
          background: "rgba(9,9,11,0.92)",
          borderTop: "1px solid rgba(249,115,22,0.08)",
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
                      style={{ background: "rgba(249,115,22,0.08)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <tab.icon className="w-5 h-5 relative z-10"
                    style={{
                      color: active ? "#F97316" : "var(--color-text-muted)",
                      strokeWidth: active ? 2.5 : 1.8,
                      filter: active ? "drop-shadow(0 0 6px rgba(249,115,22,0.5))" : undefined,
                    }} />
                  <span className="text-[10px] font-medium relative z-10"
                    style={{ color: active ? "#F97316" : "var(--color-text-muted)" }}>
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
