/**
 * Auth session state - RN equivalent of web's useRequireAuth.ts, but as a
 * context (expo-router layouts need this available before they can decide
 * whether to redirect, not just inside a single page's effect).
 *
 * `authed` combines a real Supabase session with guest mode, matching the
 * web hook's semantics exactly. `checking` stays true until BOTH the guest
 * flag has resolved (see GuestContext) and the initial session lookup has
 * completed, so callers never flash the wrong screen before redirecting.
 */

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useGuest } from "@/contexts/GuestContext";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  authed: boolean;
  checking: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isGuest, guestResolved } = useGuest();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionChecked(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const checking = !guestResolved || !sessionChecked;
  const authed = !!session || isGuest;

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, authed, checking }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
