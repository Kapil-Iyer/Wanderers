"use client";

/**
 * Route guard for pages that require a signed-in user OR guest mode (Home,
 * My Bubbles, Profile, Messages, Map, Onboarding). Without this, visiting
 * one of these URLs directly (e.g. wanderers.space/home) rendered the full
 * app shell for anyone, signed in or not — falling back to a generic
 * "Wanderer" label and whatever public data the page's own API calls happen
 * to return.
 *
 * Checks the session on mount and on every auth state change, and redirects
 * to /login the moment there isn't one - UNLESS the visitor is in guest mode
 * (see src/contexts/GuestContext.tsx), in which case they're let through
 * with no redirect and no Supabase call at all. `authed` covers both a real
 * session and guest mode; pages that must tell the two apart (to render
 * demo data instead of fetching real data) should read `useGuest().isGuest`
 * themselves. `checking` lets the page render nothing (or a blank/loading
 * state) instead of flashing real content before the redirect fires.
 *
 * Waits on `guestResolved` before doing anything: guest status can't be read
 * during SSR (no sessionStorage there), so `isGuest` necessarily starts
 * false and gets corrected client-side in an effect. Without waiting for
 * that correction explicitly, this hook would see isGuest=false on first
 * run, treat a guest as a signed-out real user, and redirect them to
 * /login before the correction ever landed.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useGuest } from "@/contexts/GuestContext";

export function useRequireAuth() {
  const router = useRouter();
  const { isGuest, guestResolved } = useGuest();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    // Don't even look at isGuest until guest mode has actually been checked -
    // it starts false either way, and treating that as a real "not a guest"
    // answer here would send a guest to /login before the correction lands.
    if (!guestResolved) return;

    if (isGuest) {
      setAuthed(true);
      setChecking(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        setAuthed(false);
        setChecking(false);
        router.replace("/login");
        return;
      }
      setAuthed(true);
      setChecking(false);
    };

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAuthed(false);
        router.replace("/login");
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router, isGuest, guestResolved]);

  return { checking, authed };
}
