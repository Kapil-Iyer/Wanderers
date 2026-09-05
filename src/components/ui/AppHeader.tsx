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
        <MapPin className="w-2.5 h-2.5 shrink-0" style={{ color: "#8b5cf6" }} />
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
                "linear-gradient(165deg, rgba(28,22,42,0.98) 0%, rgba(10,9,20,0.98) 100%)",
              border: "1px solid rgba(139,92,246,0.24)",
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
                      color: active ? "#E0339E" : "var(--color-text-secondary)",
                    }}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate" style={{ color: active ? "#E0339E" : "var(--color-text-primary)" }}>
                        {campus.label}
                      </span>
                      {!campus.live && (
                        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                          Coming soon
                        </span>
                      )}
                    </span>
                    {active ? (
                      <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#E0339E" }} />
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
  const headerRef = useRef<HTMLElement>(null);

  /**
   * One light source for the whole header: pointer position drives the
   * specular wash, the top edge highlight and the brand tile's tilt. Written
   * straight to CSS custom properties so moving the mouse never re-renders.
   */
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        el.style.setProperty("--lx", `${(x * 100).toFixed(2)}%`);
        el.style.setProperty("--ly", `${(y * 100).toFixed(2)}%`);
        el.style.setProperty("--ty", `${((x - 0.5) * 13).toFixed(2)}deg`);
        el.style.setProperty("--tx", `${((0.5 - y) * 9).toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      el.style.setProperty("--lx", "50%");
      el.style.setProperty("--ly", "0%");
      el.style.setProperty("--tx", "0deg");
      el.style.setProperty("--ty", "0deg");
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const handleStartSomething = () => {
    if (onStartSomething) {
      onStartSomething();
      return;
    }
    router.push("/home?create=1");
  };

  return (
    <header
      ref={headerRef}
      className={`app-header sticky top-0 z-50 transition-[margin] duration-300 ease-out ${
        sidebarExpanded ? "lg:ml-64" : "lg:ml-3"
      }`}
    >
      {/* Pointer-tracked specular wash across the panel */}
      <div className="app-header__sheen" aria-hidden />
      {/* Lit hairline along the panel's top edge */}
      <div className="app-header__edge" aria-hidden />
      {/* Soft aurora wash under header */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 -z-10 translate-y-full opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(139,92,246,0.18), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex items-center justify-between gap-3 px-4 sm:px-6 h-16 max-w-[1400px] mx-auto flex-nowrap">
        {/* Brand → Home + campus picker */}
        <div className="app-brand-stage flex items-center gap-3 shrink-0 min-w-0">
          <Link
            href="/home"
            className={`app-brand-tile h-10 w-10 overflow-hidden rounded-xl shrink-0 ${
              sidebarExpanded ? "lg:hidden" : ""
            }`}
            aria-label="Wanderers home"
          >
            <Image src={logo} alt="" className="h-full w-full object-cover" priority />
            <div className="app-brand-tile__gloss" aria-hidden />
          </Link>
          <div className="min-w-0">
            <Link
              href="/home"
              className={`block ${sidebarExpanded ? "lg:hidden" : ""}`}
              aria-label="Wanderers home"
            >
              <span className="app-brand-wordmark font-display text-xl font-bold leading-none block tracking-tight">
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

        {/* Primary nav — keys seated in a milled rail */}
        <nav
          className="app-nav-rail hidden md:flex items-center gap-0.5 p-1.5 rounded-2xl"
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
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`app-nav-key ${active ? "app-nav-key--active" : ""}`}
              >
                {active && (
                  <motion.span
                    layoutId="app-nav-keycap"
                    className="app-nav-keycap"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    aria-hidden
                  />
                )}
                <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2.4 : 1.8} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {center ? (
          <div className="hidden xl:flex flex-1 justify-center min-w-0 px-2">{center}</div>
        ) : null}

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleStartSomething}
            aria-label="Start Something - create a new bubble"
            className="app-cap flex items-center gap-1.5 h-9 px-3 sm:px-3.5 rounded-xl text-xs font-bold shrink-0"
            style={{
              background: "linear-gradient(180deg, #a480f8 0%, #8b5cf6 38%, #E0339E 100%)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.28)",
            }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="hidden sm:inline">Start Something</span>
            <span className="sm:hidden">Start</span>
          </button>

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
                  className="app-cap app-cap--quiet w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: on
                      ? "linear-gradient(180deg, rgba(224,51,158,0.26), rgba(224,51,158,0.06))"
                      : "rgba(255,255,255,0.04)",
                    border: on
                      ? "1px solid rgba(224,51,158,0.35)"
                      : "1px solid rgba(255,255,255,0.08)",
                    color: on ? "#f472c8" : "var(--color-text-secondary)",
                  }}
                  aria-current={on ? "page" : undefined}
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              );
            })}
          </div>

          {onNotificationsClick && (
            <button
              type="button"
              onClick={onNotificationsClick}
              aria-label={`Notifications${notificationCount ? `, ${notificationCount} pending` : ""}`}
              className="app-cap app-cap--quiet w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(180deg, rgba(26,20,38,0.9) 0%, rgba(14,11,20,0.95) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--color-text-secondary)",
              }}
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6, #E0339E)",
                    color: "#fff",
                    boxShadow: "0 0 8px rgba(224,51,158,0.5)",
                  }}
                >
                  {notificationCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push("/profile")}
            aria-label="Your profile"
            className="app-cap w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
            style={{
              background: "linear-gradient(180deg, #a480f8 0%, #8b5cf6 40%, #E0339E 100%)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.28)",
            }}
          >
            {profileInitials ?? <User className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
