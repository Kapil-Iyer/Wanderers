"use client";

/**
 * AUTH MODAL - Campus Aurora visuals (violet/cyan glass + Framer Motion)
 * wrapping the password + 2FA-OTP + forgot-password auth logic from
 * jivesh/auth.
 *
 * Flow:
 *   signup  → POST /api/auth/signup {name,email,password} → back to login
 *   login   → POST /api/auth/login  {email,password,rememberDevice}
 *             → session if device trusted (7d), else OTP "verify" step
 *   verify  → POST /api/auth/verify {email,token,rememberDevice} → setSession → /home
 *   forgot  → POST /api/auth/forgot-password → OTP email → verify → /home
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

// Gmail SMTP (used for OTP delivery so mail reaches @uwaterloo.ca inboxes,
// which reject Resend's default sending domain) is intermittently slow from
// Supabase's infra and times out (504) more often than not before eventually
// succeeding. Retry the OTP-only request a couple of times before surfacing
// an error, instead of failing on the first transient timeout.
async function requestOtp(email: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, resend: true }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.success, error: data.error };
}

async function sendOtpWithRetry(email: string, attempts = 3, delayMs = 1500): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    const { ok } = await requestOtp(email);
    if (ok) return true;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

async function requestForgotOtp(
  email: string
): Promise<{ ok: boolean; error?: string; devOtp?: string | null }> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  return {
    ok: res.ok && data.success,
    error: data.error,
    devOtp: data.devOtp ?? null,
  };
}

async function sendForgotOtpWithRetry(
  email: string,
  attempts = 3,
  delayMs = 1500
): Promise<{ ok: boolean; devOtp?: string | null }> {
  for (let i = 0; i < attempts; i++) {
    const result = await requestForgotOtp(email);
    if (result.ok) return { ok: true, devOtp: result.devOtp };
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return { ok: false };
}

const panelVariants = {
  enter:  { opacity: 0, filter: "blur(8px)", y: 16, scale: 0.97 },
  center: { opacity: 1, filter: "blur(0px)", y: 0,  scale: 1 },
  exit:   { opacity: 0, filter: "blur(4px)", y: -10, scale: 0.98 },
};

type Mode = "choice" | "signup" | "login" | "verify" | "forgot";
type VerifyPurpose = "login" | "forgot";

export default function AuthModal() {
  const [mode, setMode] = useState<Mode>("choice");
  const [pendingEmail, setPendingEmail] = useState("");
  const [verifyPurpose, setVerifyPurpose] = useState<VerifyPurpose>("login");
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

      // Wrong password/email - don't retry, it'll never succeed.
      if (res.status === 401) throw new Error(data.error || "Invalid email or password");

      // Password step already came back with success + skippedOtp here, or
      // the whole call succeeded on the first try - no retry needed.
      if (res.ok && data.success) {
        if (data.skippedOtp && data.session) {
          const { supabase } = await import("@/lib/supabase");
          await supabase.auth.setSession(data.session);
          router.replace("/home");
          return;
        }
        setPendingEmail(email);
        setVerifyPurpose("login");
        setMode("verify");
        return;
      }

      // Password was correct but the OTP send itself failed (commonly a
      // transient Gmail SMTP timeout) - retry just the OTP step.
      const otpSent = await sendOtpWithRetry(email);
      if (!otpSent) {
        throw new Error("Couldn't send the login code after a few tries - check your connection and try again.");
      }
      setPendingEmail(email);
      setVerifyPurpose("login");
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
      const { ok, devOtp } = await sendForgotOtpWithRetry(email);
      if (!ok) {
        throw new Error("Couldn't send the code after a few tries - check your connection and try again.");
      }
      setPendingEmail(email);
      setVerifyPurpose("forgot");
      setOtp("");
      setMode("verify");
      if (devOtp) {
        setOtp(String(devOtp));
        setSuccess(`Dev mode: OTP auto-filled (${devOtp}) — no email was sent.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !pendingEmail) return;
    setError(null);
    setLoading(true);
    try {
      if (verifyPurpose === "forgot") {
        const { ok, devOtp } = await sendForgotOtpWithRetry(pendingEmail);
        if (!ok) throw new Error("Couldn't resend the code - please try again in a moment.");
        if (devOtp) {
          setOtp(String(devOtp));
          setSuccess(`Dev mode: OTP auto-filled (${devOtp}) — no email was sent.`);
        }
      } else {
        const otpSent = await sendOtpWithRetry(pendingEmail);
        if (!otpSent) throw new Error("Couldn't resend the code - please try again in a moment.");
      }
      setSuccess((prev) => (prev?.startsWith("Dev mode") ? prev : "Code resent!"));
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setLoading(false);
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
          background: "linear-gradient(160deg, rgba(24,22,42,0.92) 0%, rgba(14,13,26,0.92) 100%)",
          border: "1px solid rgba(167,139,250,0.35)",
          backdropFilter: "blur(24px)",
          boxShadow:
            "inset 0 1px 0 rgba(196,181,253,0.16), 0 0 0 1px rgba(139,92,246,0.08), 0 24px 70px -12px rgba(139,92,246,0.35), 0 40px 100px -20px rgba(0,0,0,0.85)",
        }}
      >
        {/* Gradient hairline along the top edge so the card reads as its own lit surface */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent 0%, #8b5cf6 50%, transparent 100%)" }}
        />
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(224,51,158,0.18) 0%, transparent 70%)" }}
        />

        {/* Wordmark */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-4xl font-display font-bold"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #E0339E 100%)",
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
              <GradientButton onClick={() => go("signup")}>Sign Up</GradientButton>
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
              <GradientButton type="submit" loading={loading}>{loading ? "Creating account…" : "Create Account"}</GradientButton>
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
                  className="mt-0.5 w-4 h-4 rounded accent-[#8b5cf6]"
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
              <GradientButton type="submit" loading={loading}>
                {loading ? "Signing in…" : "Log In"}
              </GradientButton>
              <BackButton onClick={() => go("choice")} />
            </motion.form>
          )}

          {mode === "forgot" && (
            <motion.form key="forgot" variants={panelVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease }} className="space-y-4" onSubmit={handleForgot} autoComplete="off">
              <Field id="forgotEmail" name="forgotEmail" type="email" icon={<Mail className="w-4 h-4" />} placeholder="you@uwaterloo.ca" label="Waterloo Email" required autoComplete="off" />
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                We&apos;ll send a 6-digit code to your <span style={{ color: "var(--color-text-secondary)" }}>@uwaterloo.ca</span> inbox.
                Enter it on the next screen to sign in.
              </p>
              <GradientButton type="submit" loading={loading}>
                {loading ? "Sending…" : "Send code"}
              </GradientButton>
              <BackButton onClick={() => go("login")} label="Back to Login" />
            </motion.form>
          )}

          {mode === "verify" && (
            <motion.form key="verify" variants={panelVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease }} className="space-y-5 text-center" onSubmit={handleVerify}>
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}>
                <Mail className="w-7 h-7" style={{ color: "#8b5cf6" }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>Check your email</h2>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  {verifyPurpose === "forgot"
                    ? "Enter the code we sent to sign back in."
                    : "Enter the code to finish signing in."}{" "}
                  <span style={{ color: "var(--color-text-primary)" }}>{pendingEmail}</span>
                </p>
              </div>
              <input
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(null); }}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                className="w-full text-center text-2xl tracking-[0.5em] h-14 rounded-2xl font-mono outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.25)", color: "var(--color-text-primary)" }}
              />
              <GradientButton type="submit" loading={loading} disabled={otp.length < 6}>
                {loading ? "Verifying…" : verifyPurpose === "forgot" ? "Sign in" : "Verify Code"}
              </GradientButton>
              <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0}
                className="block w-full text-sm transition-colors disabled:opacity-40"
                style={{ color: "var(--color-text-primary)" }}>
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
              </button>
              <BackButton
                onClick={() => {
                  setOtp("");
                  setPendingEmail("");
                  setResendCooldown(0);
                  go(verifyPurpose === "forgot" ? "forgot" : "choice");
                }}
              />
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
          onFocus={(e) => (e.target.style.borderColor = "rgba(224,51,158,0.55)")}
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

function GradientButton({ children, onClick, type = "button", loading = false, disabled = false }: {
  children: React.ReactNode; onClick?: () => void; type?: "button" | "submit";
  loading?: boolean; disabled?: boolean;
}) {
  return (
    <motion.button
      type={type} onClick={onClick} disabled={loading || disabled}
      className="w-full h-12 rounded-full font-bold text-sm relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #8b5cf6 0%, #E0339E 100%)",
        color: "#fff",
        boxShadow: "0 0 24px rgba(139,92,246,0.3)",
        opacity: loading || disabled ? 0.6 : 1,
      }}
      whileHover={{ scale: 1.03, boxShadow: "0 0 32px rgba(224,51,158,0.45)" }}
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
