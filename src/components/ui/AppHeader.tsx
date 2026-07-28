"use client";

/**
 * Shared app header - persistent on every main page so Home / Messages /
 * Profile are one tap away (including from chat).
 */

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Home, MessageCircle, Compass, User, Bell, MapPin, Plus, ChevronDown, Check } from "lucide-react";
import logo from "../../../components/ui/assets/logo.jpg";
import { useSidebar } from "@/contexts/SidebarContext";

const navLinks = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/my-bubbles", label: "Explore", icon: Compass },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

const CAMPUS_STORAGE_KEY = "wanderers-campus-id";

const campuses = [
  { id: "uwaterloo", label: "University of Waterloo", short: "Waterloo", live: true },
  { id: "mcmaster", label: "McMaster University", short: "McMaster", live: false },
  { id: "uguelph", label: "University of Guelph", short: "Guelph", live: false },
  { id: "ubc", label: "University of British Columbia", short: "UBC", live: false },
] as const;

type CampusId = (typeof campuses)[number]["id"];

function CampusPicker({ visible }: { visible: boolean }) {
  const [open, setOpen] = useState(false);
  const [campusId, setCampusId] = useState<CampusId>("uwaterloo");
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CAMPUS_STORAGE_KEY) as CampusId | null;
      if (saved && campuses.some((c) => c.id === saved)) setCampusId(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!visible) return null;

  const selected = campuses.find((c) => c.id === campusId) ?? campuses[0];

  const selectCampus = (id: CampusId) => {
    setCampusId(id);
    try {
      localStorage.setItem(CAMPUS_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative mt-1 hidden sm:block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1 max-w-[200px] text-[10px] font-medium rounded-md px-1 -ml-1 py-0.5 transition-colors hover:bg-white/5"
        style={{ color: "var(--color-text-muted)" }}
      >
        <MapPin className="w-2.5 h-2.5 shrink-0" style={{ color: "#ff7a1a" }} />
        <span className="truncate">{selected.label}</span>
        <ChevronDown
          className={`w-2.5 h-2.5 shrink-0 opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label="Campus"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-[60] mt-1.5 min-w-[240px] overflow-hidden rounded-xl py-1"
            style={{
              background:
                "linear-gradient(165deg, rgba(36,28,22,0.98) 0%, rgba(14,10,7,0.98) 100%)",
              border: "1px solid rgba(255,181,107,0.22)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.06) inset, 0 16px 40px -12px rgba(0,0,0,0.75)",
            }}
          >
            {campuses.map((campus) => {
              const active = campus.id === campusId;
              return (
                <li key={campus.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selectCampus(campus.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-white/5"
                    style={{
                      color: active ? "#ffb56b" : "var(--color-text-secondary)",
                    }}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate" style={{ color: active ? "#ffb56b" : "var(--color-text-primary)" }}>
                        {campus.label}
                      </span>
                      {!campus.live && (
                        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                          Coming soon
                        </span>
                      )}
                    </span>
                    {active ? (
                      <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#ff7a1a" }} />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

type AppHeaderProps = {
  /** Optional page label shown next to brand on small screens */
  title?: string;
  /** Home-only: campus / notification extras */
  showCampus?: boolean;
  notificationCount?: number;
  onNotificationsClick?: () => void;
  profileInitials?: string;
  /** Extra content in the center (e.g. home quick-nav) */
  center?: React.ReactNode;
  /** Opens create-bubble flow; if omitted, navigates to /home?create=1 */
  onStartSomething?: () => void;
};

export default function AppHeader({
  title,
  showCampus = false,
  notificationCount = 0,
  onNotificationsClick,
  profileInitials,
  center,
  onStartSomething,
}: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { expanded: sidebarExpanded } = useSidebar();

  const handleStartSomething = () => {
    if (onStartSomething) {
      onStartSomething();
      return;
    }
    router.push("/home?create=1");
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-[margin] duration-300 ease-out ${
        sidebarExpanded ? "lg:ml-64" : "lg:ml-3"
      }`}
      style={{
        background:
          "linear-gradient(180deg, rgba(22,16,12,0.97) 0%, rgba(14,10,7,0.9) 100%)",
        borderBottom: "1px solid rgba(255,181,107,0.18)",
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.06) inset, 0 12px 40px -16px rgba(0,0,0,0.7), 0 4px 16px rgba(255,122,26,0.06)",
        backdropFilter: "blur(22px) saturate(1.2)",
      }}
    >
      {/* Top edge light */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 5%, rgba(255,181,107,0.55) 50%, transparent 95%)",
        }}
        aria-hidden
      />
      {/* Soft amber wash under header */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 -z-10 translate-y-full opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(255,122,26,0.18), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-16 max-w-[1400px] mx-auto">
        {/* Brand → Home + campus picker */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <Link
            href="/home"
            className="relative h-10 w-10 overflow-hidden rounded-xl shrink-0 transition-transform duration-200 hover:scale-105 hover:-rotate-1"
            aria-label="Wanderers home"
            style={{
              border: "1px solid rgba(255,122,26,0.4)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.18) inset, 0 6px 18px rgba(255,122,26,0.3), 0 2px 0 rgba(0,0,0,0.25)",
            }}
          >
            <Image src={logo} alt="" className="h-full w-full object-cover" priority />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.18) 0%, transparent 45%)",
              }}
              aria-hidden
            />
          </Link>
          <div className="min-w-0">
            <Link href="/home" className="block" aria-label="Wanderers home">
              <span className="font-display text-xl font-bold leading-none block tracking-tight">
                <span className="text-gradient">Wanderers</span>
              </span>
            </Link>
            {title ? (
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.16em] block mt-1 truncate max-w-[140px] sm:max-w-[220px]"
                style={{ color: "var(--color-text-muted)" }}
              >
                {title}
              </span>
            ) : (
              <CampusPicker visible={showCampus} />
            )}
          </div>
        </div>

        {/* Primary nav - pill rail */}
        <nav
          className="hidden md:flex items-center gap-0.5 p-1.5 rounded-2xl"
          style={{
            background:
              "linear-gradient(165deg, rgba(36,28,22,0.85) 0%, rgba(12,9,7,0.9) 100%)",
            border: "1px solid rgba(255,181,107,0.14)",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.05) inset, 0 8px 24px -12px rgba(0,0,0,0.55)",
          }}
          aria-label="Main"
        >
          {navLinks.map((link) => {
            const active =
              pathname === link.href ||
              (link.href === "/messages" && pathname?.startsWith("/chat")) ||
              (link.href !== "/home" &&
                link.href !== "/messages" &&
                pathname?.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <motion.span
                  className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
                  style={{
                    color: active ? "#2a1206" : "var(--color-text-secondary)",
                    background: active
                      ? "linear-gradient(145deg, #ff9a4a, #ff7a1a 50%, #e56a0f)"
                      : "transparent",
                    boxShadow: active
                      ? "0 1px 0 rgba(255,255,255,0.35) inset, 0 4px 14px rgba(255,122,26,0.4)"
                      : "none",
                  }}
                  whileHover={
                    active
                      ? { scale: 1.02 }
                      : { backgroundColor: "rgba(255,255,255,0.06)", color: "#FAFAFA" }
                  }
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2.4 : 1.8} />
                  {link.label}
                </motion.span>
              </Link>
            );
          })}
        </nav>

        {center ? (
          <div className="hidden xl:flex flex-1 justify-center min-w-0 px-2">{center}</div>
        ) : null}

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            type="button"
            onClick={handleStartSomething}
            aria-label="Start Something - create a new bubble"
            className="flex items-center gap-1.5 h-9 px-3 sm:px-3.5 rounded-xl text-xs font-bold shrink-0"
            style={{
              background: "linear-gradient(145deg, #ff9a4a, #ff7a1a 45%, #e56a0f)",
              color: "#2a1206",
              border: "1px solid rgba(255,210,160,0.4)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.35) inset, 0 4px 14px rgba(255,122,26,0.35)",
            }}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="hidden sm:inline">Start Something</span>
            <span className="sm:hidden">Start</span>
          </motion.button>

          <div className="flex md:hidden items-center gap-1">
            {[
              { href: "/home", icon: Home, label: "Home", match: (p: string) => p === "/home" },
              {
                href: "/messages",
                icon: MessageCircle,
                label: "Messages",
                match: (p: string) => p.startsWith("/messages") || p.startsWith("/chat"),
              },
              {
                href: "/my-bubbles",
                icon: Compass,
                label: "Explore",
                match: (p: string) => p.startsWith("/my-bubbles"),
              },
            ].map(({ href, icon: Icon, label, match }) => {
              const on = pathname ? match(pathname) : false;
              return (
                <Link
                  key={href}
                  href={href}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: on
                      ? "linear-gradient(145deg, rgba(255,122,26,0.25), rgba(255,122,26,0.08))"
                      : "rgba(255,255,255,0.04)",
                    border: on
                      ? "1px solid rgba(255,122,26,0.35)"
                      : "1px solid rgba(255,255,255,0.08)",
                    color: on ? "#ff7a1a" : "var(--color-text-secondary)",
                    boxShadow: on ? "0 1px 0 rgba(255,255,255,0.08) inset" : "none",
                  }}
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              );
            })}
          </div>

          {onNotificationsClick && (
            <motion.button
              type="button"
              onClick={onNotificationsClick}
              aria-label={`Notifications${notificationCount ? `, ${notificationCount} pending` : ""}`}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(165deg, rgba(40,32,26,0.9) 0%, rgba(18,13,10,0.95) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--color-text-secondary)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 12px rgba(0,0,0,0.35)",
              }}
              whileHover={{ scale: 1.06, color: "var(--color-text-primary)" }}
              whileTap={{ scale: 0.94 }}
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{
                    background: "linear-gradient(135deg, #ff7a1a, #ffb56b)",
                    color: "#2a1206",
                    boxShadow: "0 0 8px rgba(255,122,26,0.5)",
                  }}
                >
                  {notificationCount}
                </span>
              )}
            </motion.button>
          )}

          <motion.button
            type="button"
            onClick={() => router.push("/profile")}
            aria-label="Your profile"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
            style={{
              background: "linear-gradient(145deg, #ff9a4a, #ff7a1a 40%, #e56a0f)",
              color: "#2a1206",
              border: "1px solid rgba(255,210,160,0.4)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.4) inset, 0 6px 16px rgba(255,122,26,0.4), 0 2px 0 rgba(0,0,0,0.2)",
            }}
            whileHover={{ scale: 1.08, y: -1 }}
            whileTap={{ scale: 0.94 }}
          >
            {profileInitials ?? <User className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
    </header>
  );
}
