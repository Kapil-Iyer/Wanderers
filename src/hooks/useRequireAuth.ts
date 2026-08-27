"use client";

/**
 * Route guard for pages that require a signed-in user (Home, My Bubbles,
 * Profile, Messages, Map, Onboarding). Without this, visiting one of these
 * URLs directly (e.g. wanderers.space/home) rendered the full app shell for
 * anyone, signed in or not — falling back to a generic "Wanderer" label and
 * whatever public data the page's own API calls happen to return.
 *
 * Checks the session on mount and on every auth state change, and redirects
 * to the landing page ("/") the moment there isn't one. `checking` lets the
 * page render nothing (or a blank/loading state) instead of flashing real
 * content before the redirect fires.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function useRequireAuth() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        setAuthed(false);
        setChecking(false);
        router.replace("/");
        return;
      }
      setAuthed(true);
      setChecking(false);
    };

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAuthed(false);
        router.replace("/");
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return { checking, authed };
}
