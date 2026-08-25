"use client";

/**
 * AUTH MODAL - Wanderers Warmth visuals (amber glass + Framer Motion)
 * wrapping the password + 2FA-OTP + forgot-password auth logic from
 * jivesh/auth.
 *
 * Flow:
 *   signup  → POST /api/auth/signup {name,email,password} → back to login
 *   login   → POST /api/auth/login  {email,password,rememberDevice}
 *             → session if device trusted (7d), else OTP "verify" step
 *   verify  → POST /api/auth/verify {email,token,rememberDevice} → setSession → /home
 *   forgot  → POST /api/auth/forgot-password → email link (sign-in + change password)
 *
 * Campus gate: when enabled, only @uwaterloo.ca emails (client + server).
 * Set REQUIRE_UW_EMAIL=true (and NEXT_PUBLIC_REQUIRE_UW_EMAIL=true for this
 * client-side check) in Vercel environment variables to enforce the UWaterloo
 * email gate in production. When off/missing, any valid email is allowed.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mail, User, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { CAMPUS_EMAIL_ERROR, isEmailAllowed, isCampusGateEnabled } from "@/lib/campusEmail";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const panelVariants = {
  enter:  { opacity: 0, filter: "blur(8px)", y: 16, scale: 0.97 },
  center: { opacity: 1, filter: "blur(0px)", y: 0,  scale: 1 },
  exit:   { opacity: 0, filter: "blur(4px)", y: -10, scale: 0.98 },
};

type Mode = "choice" | "signup" | "login" | "verify" | "forgot";

export default function AuthModal() {
  const [mode, setMode] = useState<Mode>("choice");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [showSignupPwd, setShowSignupPwd] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  const router = useRouter();

  const go = (m: Mode) => { setError(null); setMode(m); };

  // auto-dismiss success toast (dev messages linger longer so there's time to copy the link/code)
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), success.startsWith("Dev mode") ? 15000 : 3000);
    return () => clearTimeout(t);
  }, [success]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value?.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value?.trim().toLowerCase();
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement)?.value;

    if (!name) { setError("Full name required"); return; }
    if (!email) { setError("Email required"); return; }
    if (!isEmailAllowed(email)) { setError(CAMPUS_EMAIL_ERROR); return; }
    if (!password || password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to sign up");
      setSuccess("Account created! Please log in.");
      setMode("login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("loginEmail") as HTMLInputElement)?.value?.trim().toLowerCase();
    const password = (form.elements.namedItem("loginPassword") as HTMLInputElement)?.value;

    if (!email) { setError("Email required"); return; }
    if (!isEmailAllowed(email)) { setError(CAMPUS_EMAIL_ERROR); return; }
    if (!password) { setError("Password required"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberDevice }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to log in");

      // Trusted device - password only, no OTP for ~7 days
      if (data.skippedOtp && data.session) {
        const { supabase } = await import("@/lib/supabase");
        await supabase.auth.setSession(data.session);
        router.replace("/home");
        return;
      }

      setPendingEmail(email);
      setMode("verify");
      // Dev only: server skipped the real email send and returned the code directly.
      if (data.devOtp) {
        setOtp(String(data.devOtp));
        setSuccess(`Dev mode: OTP auto-filled (${data.devOtp}) — no email was sent.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const email = (e.currentTarget.elements.namedItem("forgotEmail") as HTMLInputElement)?.value?.trim().toLowerCase();
    if (!email) { setError("Email required"); return; }
    if (!isEmailAllowed(email)) { setError(CAMPUS_EMAIL_ERROR); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to send email");
      // Dev only: server skipped the real email send and returned the link directly.
      setSuccess(
        data.devRecoveryLink
          ? `Dev mode: no email sent — copy this link: ${data.devRecoveryLink}`
          : data.message || "Check your email - open the link to sign in and change your password."
      );
      setMode("login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !pendingEmail) return;
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, resend: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to resend code");
      setSuccess("Code resent!");
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEmail || otp.length < 6) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingEmail,
          token: otp,
          rememberDevice,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      const { supabase } = await import("@/lib/supabase");
      if (data.session) await supabase.auth.setSession(data.session);
      router.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm relative">
      <div
        className="relative overflow-hidden rounded-3xl p-8"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,122,26,0.15)",
          backdropFilter: "blur(24px)",
          boxShadow: "inset 0 1px 0 rgba(255,122,26,0.1), 0 32px 80px -20px rgba(0,0,0,0.7)",
        }}
      >
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,122,26,0.12) 0%, transparent 70%)" }}
        />

        {/* Wordmark */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-4xl font-display font-bold"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            style={{
              background: "linear-gradient(135deg, #ff7a1a 0%, #ffb56b 100%)",
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

        {/* Banners */}
        <AnimatePresence>
          {success && (
            <motion.div
              key="success"
              className="mb-5 p-3 rounded-xl text-sm"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80" }}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              {success}
            </motion.div>
          )}
          {error && (
            <motion.div
              key="error"
              className="mb-5 p-3 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
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
              <AmberButton onClick={() => go("signup")}>Sign Up</AmberButton>
              <GhostButton onClick={() => go("login")}>Log In</GhostButton>
              {/* Only show the campus hint when the gate is actually enforced (NEXT_PUBLIC_REQUIRE_UW_EMAIL=true) */}
              {isCampusGateEnabled() && (
                <p className="text-xs text-center pt-1" style={{ color: "var(--color-text-muted)" }}>
                  @uwaterloo.ca email required
                </p>
              )}
            </motion.div>
          )}

          {mode === "signup" && (
            <motion.form key="signup" variants={panelVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease }} className="space-y-4" onSubmit={handleSignUp} autoComplete="off">
              <Field id="name" name="name" icon={<User className="w-4 h-4" />} placeholder="Your full name" label="Full Name" required autoComplete="off" />
              <Field id="email" name="email" type="email" icon={<Mail className="w-4 h-4" />} placeholder="you@uwaterloo.ca" label="Waterloo Email" required autoComplete="off" />
              <Field id="password" name="password" type={showSignupPwd ? "text" : "password"} icon={<Lock className="w-4 h-4" />} placeholder="Min. 8 characters" label="Password" required autoComplete="new-password"
                trailing={<EyeToggle show={showSignupPwd} onToggle={() => setShowSignupPwd((p) => !p)} />} />
              <Field id="confirmPassword" name="confirmPassword" type={showSignupConfirm ? "text" : "password"} icon={<Lock className="w-4 h-4" />} placeholder="Re-enter your password" label="Confirm Password" required autoComplete="new-password"
                trailing={<EyeToggle show={showSignupConfirm} onToggle={() => setShowSignupConfirm((p) => !p)} />} />
              <AmberButton type="submit" loading={loading}>{loading ? "Creating account…" : "Create Account"}</AmberButton>
              <BackButton onClick={() => go("choice")} />
            </motion.form>
          )}

          {mode === "login" && (
            <motion.form key="login" variants={panelVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease }} className="space-y-4" onSubmit={handleLogin} autoComplete="off">
              <Field id="loginEmail" name="loginEmail" type="email" icon={<Mail className="w-4 h-4" />} placeholder="you@uwaterloo.ca" label="Waterloo Email" required autoComplete="off" />
              <Field id="loginPassword" name="loginPassword" type={showLoginPwd ? "text" : "password"} icon={<Lock className="w-4 h-4" />} placeholder="Your password" label="Password" required autoComplete="current-password"
                trailing={<EyeToggle show={showLoginPwd} onToggle={() => setShowLoginPwd((p) => !p)} />} />
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-[#ff7a1a]"
                />
                <span className="text-xs leading-snug" style={{ color: "var(--color-text-secondary)" }}>
                  Remember this device for 7 days
                  <span className="block mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    Skip the email code on this browser until then.
                  </span>
                </span>
              </label>
              <div className="flex justify-end -mt-1">
                <button type="button" onClick={() => go("forgot")} className="text-xs transition-colors" style={{ color: "var(--color-text-primary)" }}>
                  Forgot password?
                </button>
              </div>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {rememberDevice
                  ? "First time (or after a week): we'll email a 6-digit code once. Owner accounts never need a code."
                  : "We'll send a 6-digit code every time you log in (owners excepted)."}
              </p>
              <AmberButton type="submit" loading={loading}>
                {loading ? "Signing in…" : "Log In"}
              </AmberButton>
              <BackButton onClick={() => go("choice")} />
            </motion.form>
          )}

          {mode === "forgot" && (
            <motion.form key="forgot" variants={panelVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease }} className="space-y-4" onSubmit={handleForgot} autoComplete="off">
              <Field id="forgotEmail" name="forgotEmail" type="email" icon={<Mail className="w-4 h-4" />} placeholder="you@uwaterloo.ca" label="Waterloo Email" required autoComplete="off" />
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                We&apos;ll email a link to <span style={{ color: "var(--color-text-secondary)" }}>your Waterloo inbox</span>.
                Opening it signs you in and lets you set a new password.
              </p>
              <AmberButton type="submit" loading={loading}>
                {loading ? "Sending…" : "Send email"}
              </AmberButton>
              <BackButton onClick={() => go("login")} label="Back to Login" />
            </motion.form>
          )}

          {mode === "verify" && (
            <motion.form key="verify" variants={panelVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease }} className="space-y-5 text-center" onSubmit={handleVerify}>
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ background: "rgba(255,122,26,0.15)", border: "1px solid rgba(255,122,26,0.3)" }}>
                <Mail className="w-7 h-7" style={{ color: "#ff7a1a" }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>Check your email</h2>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  Sent a 6-digit code to <span style={{ color: "var(--color-text-primary)" }}>{pendingEmail}</span>
                </p>
              </div>
              <input
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(null); }}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                className="w-full text-center text-2xl tracking-[0.5em] h-14 rounded-2xl font-mono outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,122,26,0.2)", color: "var(--color-text-primary)" }}
              />
              <AmberButton type="submit" loading={loading} disabled={otp.length < 6}>{loading ? "Verifying…" : "Verify Code"}</AmberButton>
              <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0}
                className="block w-full text-sm transition-colors disabled:opacity-40"
                style={{ color: "var(--color-text-primary)" }}>
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
              </button>
              <BackButton onClick={() => { go("choice"); setOtp(""); setPendingEmail(""); setResendCooldown(0); }} />
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Field({
  id, name, type = "text", icon, placeholder, label, required, autoComplete, trailing,
}: {
  id: string; name: string; type?: string; icon: React.ReactNode;
  placeholder: string; label: string; required?: boolean; autoComplete?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}>{icon}</span>
        <input
          id={id} name={name} type={type} placeholder={placeholder} required={required} autoComplete={autoComplete}
          className={`w-full pl-10 ${trailing ? "pr-10" : "pr-4"} h-11 rounded-xl outline-none text-sm transition-all`}
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-primary)" }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(255,122,26,0.5)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
        />
        {trailing}
      </div>
    </div>
  );
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} tabIndex={-1}
      aria-label={show ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
      style={{ color: "var(--color-text-muted)" }}>
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
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
        background: "linear-gradient(135deg, #ff7a1a 0%, #ffb56b 100%)",
        color: "#2a1206",
        boxShadow: "0 0 24px rgba(255,122,26,0.25)",
        opacity: loading || disabled ? 0.6 : 1,
      }}
      whileHover={{ scale: 1.03, boxShadow: "0 0 32px rgba(255,122,26,0.4)" }}
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
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-text-primary)" }}
      whileHover={{ scale: 1.02, background: "rgba(255,255,255,0.07)" }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {children}
    </motion.button>
  );
}

function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 mx-auto text-sm transition-colors"
      style={{ color: "var(--color-text-secondary)" }}>
      <ArrowLeft className="w-3.5 h-3.5" /> {label}
    </button>
  );
}
