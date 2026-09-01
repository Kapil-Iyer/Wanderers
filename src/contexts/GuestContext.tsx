"use client";

/**
 * GUEST MODE - a read-only demo experience for visitors who don't want to
 * (or can't yet) sign in with a @uwaterloo.ca email.
 *
 * Deliberately NOT a Supabase auth session of any kind - guest mode is pure
 * frontend state. No account is created, no row is written anywhere, no
 * Supabase call is ever made on a guest's behalf. Every page that shows
 * guests anything sources it from src/lib/demoData.ts instead.
 *
 * Persistence: sessionStorage, not localStorage - guest mode is meant to end
 * when the browser closes (per product spec), and sessionStorage is cleared
 * on tab/browser close while localStorage would survive it.
 *
 * `guestResolved` matters as much as `isGuest` itself: sessionStorage can't
 * be read during SSR, so `isGuest` necessarily starts false and gets
 * corrected in an effect. Relying on effect-ordering across components
 * (e.g. "layout effects settle before passive effects") to guarantee that
 * correction lands before any page's own data-fetching effect turned out to
 * NOT be reliable in practice here - a guest's Home page still fired real
 * /api/moments, /api/recommendations, /api/campus-events calls on first load
 * before isGuest flipped true. `guestResolved` is the explicit fix: every
 * consumer (useRequireAuth, and any page's own guest-gated fetch effect)
 * must wait for guestResolved === true before doing anything, instead of
 * trusting isGuest === false to mean "definitely not a guest".
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const GUEST_MODE_KEY = "wanderers_guest_mode";

type GuestContextValue = {
  isGuest: boolean;
  guestResolved: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
};

const GuestContext = createContext<GuestContextValue | null>(null);

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);
  const [guestResolved, setGuestResolved] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(GUEST_MODE_KEY) === "true") setIsGuest(true);
    } catch {
      /* sessionStorage unavailable (private mode etc.) - stay false */
    } finally {
      setGuestResolved(true);
    }
  }, []);

  const enterGuestMode = useCallback(() => {
    try {
      sessionStorage.setItem(GUEST_MODE_KEY, "true");
    } catch {
      /* best-effort - context state below still works for this tab */
    }
    setIsGuest(true);
  }, []);

  const exitGuestMode = useCallback(() => {
    try {
      sessionStorage.removeItem(GUEST_MODE_KEY);
    } catch {
      /* noop */
    }
    setIsGuest(false);
  }, []);

  // A guest who decides to actually sign up / log in for real (from any of
  // the auth screens, all reachable while isGuest is still true) should
  // immediately stop being treated as a guest - otherwise every isGuest
  // check across the app would keep showing them demo data on top of their
  // brand-new real session. This is the single place that transition is
  // guaranteed to be caught, regardless of which screen/flow they used.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        exitGuestMode();
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [exitGuestMode]);

  return (
    <GuestContext.Provider value={{ isGuest, guestResolved, enterGuestMode, exitGuestMode }}>
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) {
    throw new Error("useGuest must be used within GuestProvider");
  }
  return ctx;
}
