"use client";

/**
 * AUTH MODAL - Wanderers Warmth design revamp
 * No magic link (Supabase limit 2/hr). Only @uwaterloo.ca.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mail, User, ArrowLeft } from "lucide-react";

const OTP_DISABLED = true;
const WATERLOO_SUFFIX = "@uwaterloo.ca";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const panelVariants = {
  enter:  { opacity: 0, filter: "blur(8px)", y: 16, scale: 0.97 },
  center: { opacity: 1, filter: "blur(0px)", y: 0,  scale: 1 },
  exit:   { opacity: 0, filter: "blur(4px)", y: -10, scale: 0.98 },
};

export default function AuthModal() {
  const [mode, setMode] = useState<"choice" | "signup" | "login" | "verify">("choice");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingRedirect, setPendingRedirect] = useState<"onboarding" | "home">("onboarding");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const go = (m: typeof mode) => { setError(null); setMode(m); };

  const signInAnon = async (redirectTo: "onboarding" | "home") => {
    setLoading(true);
    setError(null);
    try {
      const { data: sd } = await import("@/lib/supabase").then(m => m.supabase.auth.getSession());
      if (sd?.session?.access_token) {
        await fetch("/api/auth/ensure-profile", { method: "POST", headers: { Authorization: `Bearer ${sd.session.access_token}` } });
        router.push(redirectTo === "home" ? "/home" : "/onboarding");
        return;
      }
      const { data, error: e } = await import("@/lib/supabase").then(m => m.supabase.auth.signInAnonymously());
      if (e) throw new Error(e.message);
      const token = data?.session?.access_token;
      if (token) await fetch("/api/auth/ensure-profile", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      router.push(redirectTo === "home" ? "/home" : "/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement)?.value?.trim().toLowerCase();
    if (OTP_DISABLED) {
      if (!email) { setError("Email required"); return; }
      if (!email.endsWith(WATERLOO_SUFFIX)) { setError("Only @uwaterloo.ca emails allowed"); return; }
      await signInAnon("onboarding");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign up failed");
      setPendingEmail(email); setPendingRedirect("onboarding"); setMode("verify");
    } catch (err) { setError(err instanceof Error ? err.message : "Sign up failed"); }
    finally { setLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const email = (e.currentTarget.elements.namedItem("loginEmail") as HTMLInputElement)?.value?.trim().toLowerCase();
    if (OTP_DISABLED) {
      if (!email) { setError("Email required"); return; }
      if (!email.endsWith(WATERLOO_SUFFIX)) { setError("Only @uwaterloo.ca emails allowed"); return; }
      await signInAnon("home");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setPendingEmail(email); setPendingRedirect("home"); setMode("verify");
    } catch (err) { setError(err instanceof Error ? err.message : "Login failed"); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (OTP_DISABLED || !pendingEmail || otp.length < 6) return;
    setError(null); setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: pendingEmail, token: otp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      const { supabase } = await import("@/lib/supabase");
      if (data.session) await supabase.auth.setSession(data.session);
      router.push("/onboarding");
    } catch (err) { setError(err instanceof Error ? err.message : "Verification failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-sm relative">
      {/* Glass card */}
      <div
        className="relative overflow-hidden rounded-3xl p-8"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(249,115,22,0.15)",
          backdropFilter: "blur(24px)",
          boxShadow: "inset 0 1px 0 rgba(249,115,22,0.1), 0 32px 80px -20px rgba(0,0,0,0.7)",
        }}
      >
        {/* Ambient orb inside card */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)" }}
        />

        {/* Wordmark */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-4xl font-display font-bold"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            style={{
              background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Wanderers
          </motion.h1>
          <motion.p
            className="text-sm mt-2"
            style={{ color: "var(--color-text-secondary)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Find your people. Start something.
          </motion.p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-5 p-3 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Panels */}
        <AnimatePresence mode="wait">
          {mode === "choice" && (
            <motion.div key="choice" variants={panelVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease }} className="space-y-3">
              <AmberButton onClick={() => go("signup")} loading={false}>
                Sign Up
              </AmberButton>
              <GhostButton onClick={() => go("login")}>
                Log In
              </GhostButton>
            </motion.div>
          )}

          {mode === "signup" && (
            <motion.form key="signup" variants={panelVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease }} className="space-y-4" onSubmit={handleSignUp}>
              <WarmInput id="name" name="name" icon={<User className="w-4 h-4" />} placeholder="Your first name" label="First Name (optional)" />
              <WarmInput id="email" name="email" type="email" icon={<Mail className="w-4 h-4" />} placeholder="you@uwaterloo.ca" label="Email" required />
              <p className="text-xs" style={{ color: "#fbbf24aa" }}>Only @uwaterloo.ca — no email sent.</p>
              <AmberButton type="submit" loading={loading}>
                {loading ? "One moment…" : "Continue →"}
              </AmberButton>
              <BackButton onClick={() => go("choice")} />
            </motion.form>
          )}

          {mode === "login" && (
            <motion.form key="login" variants={panelVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease }} className="space-y-4" onSubmit={handleLogin}>
              <WarmInput id="loginEmail" name="loginEmail" type="email" icon={<Mail className="w-4 h-4" />} placeholder="you@uwaterloo.ca" label="Email" required />
              <p className="text-xs" style={{ color: "#fbbf24aa" }}>Only @uwaterloo.ca — no email sent.</p>
              <AmberButton type="submit" loading={loading}>
                {loading ? "One moment…" : "Continue →"}
              </AmberButton>
              <BackButton onClick={() => go("choice")} />
            </motion.form>
          )}

          {mode === "verify" && (
            <motion.form key="verify" variants={panelVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease }} className="space-y-5 text-center" onSubmit={handleVerify}>
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)" }}>
                <Mail className="w-7 h-7" style={{ color: "#F97316" }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>Check your email</h2>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  Sent a 6-digit code to {pendingEmail}
                </p>
              </div>
              <input
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full text-center text-2xl tracking-[0.5em] h-14 rounded-2xl font-mono outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(249,115,22,0.2)", color: "var(--color-text-primary)" }}
              />
              <AmberButton type="submit" loading={loading} disabled={otp.length < 6}>
                {loading ? "Verifying…" : "Verify Code"}
              </AmberButton>
              <button type="button" onClick={() => router.push("/onboarding")}
                className="block w-full text-sm transition-colors"
                style={{ color: "var(--color-text-secondary)" }}>
                Skip for now →
              </button>
              <BackButton onClick={() => { go("choice"); setOtp(""); setPendingEmail(""); }} />
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function WarmInput({ id, name, type = "text", icon, placeholder, label, required }: {
  id: string; name: string; type?: string; icon: React.ReactNode;
  placeholder: string; label: string; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}>{icon}</span>
        <input
          id={id} name={name} type={type} placeholder={placeholder} required={required}
          className="w-full pl-10 pr-4 h-11 rounded-xl outline-none text-sm transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--color-text-primary)",
          }}
          onFocus={e => (e.target.style.borderColor = "rgba(249,115,22,0.5)")}
          onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
        />
      </div>
    </div>
  );
}

function AmberButton({ children, onClick, type = "button", loading = false, disabled = false }: {
  children: React.ReactNode; onClick?: () => void; type?: "button" | "submit";
  loading?: boolean; disabled?: boolean;
}) {
  return (
    <motion.button
      type={type} onClick={onClick} disabled={loading || disabled}
      className="w-full h-12 rounded-full font-bold text-sm relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
        color: "#1a0a00",
        boxShadow: "0 0 24px rgba(249,115,22,0.25)",
        opacity: loading || disabled ? 0.6 : 1,
      }}
      whileHover={{ scale: 1.03, boxShadow: "0 0 32px rgba(249,115,22,0.4)" }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {children}
    </motion.button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <motion.button
      type="button" onClick={onClick}
      className="w-full h-12 rounded-full font-semibold text-sm"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "var(--color-text-primary)",
      }}
      whileHover={{ scale: 1.02, background: "rgba(255,255,255,0.07)" }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {children}
    </motion.button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 mx-auto text-sm transition-colors"
      style={{ color: "var(--color-text-secondary)" }}>
      <ArrowLeft className="w-3.5 h-3.5" /> Back
    </button>
  );
}
