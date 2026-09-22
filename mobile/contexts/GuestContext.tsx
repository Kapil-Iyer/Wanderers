/**
 * GUEST MODE - ported from src/contexts/GuestContext.tsx (web).
 *
 * Same shape and rules as web: guest mode is pure frontend state, no Supabase
 * call is ever made on a guest's behalf, every guest-visible screen sources
 * data from lib/demoData.ts instead. Any real SIGNED_IN event exits guest mode.
 *
 * One accepted behavior difference from web: web uses sessionStorage so guest
 * mode clears when the browser tab closes; AsyncStorage has no equivalent of
 * "clears on close" (there's no browser), so on mobile guest mode persists
 * across app relaunches until the user signs in for real or explicitly exits.
 *
 * `guestResolved` still matters here for the same reason it does on web:
 * AsyncStorage reads are async, so `isGuest` necessarily starts false and
 * gets corrected in an effect - every consumer must wait for guestResolved
 * before trusting isGuest === false to mean "definitely not a guest".
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
    (async () => {
      try {
        const value = await AsyncStorage.getItem(GUEST_MODE_KEY);
        if (value === "true") setIsGuest(true);
      } catch {
        /* AsyncStorage unavailable - stay false */
      } finally {
        setGuestResolved(true);
      }
    })();
  }, []);

  const enterGuestMode = useCallback(() => {
    AsyncStorage.setItem(GUEST_MODE_KEY, "true").catch(() => {});
    setIsGuest(true);
  }, []);

  const exitGuestMode = useCallback(() => {
    AsyncStorage.removeItem(GUEST_MODE_KEY).catch(() => {});
    setIsGuest(false);
  }, []);

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
