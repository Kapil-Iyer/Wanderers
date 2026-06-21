"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Mail, User, Lock, Eye, EyeOff } from "lucide-react";

export default function AuthModal() {
  const [mode, setMode] = useState<"choice" | "signup" | "login" | "verify" | "forgot">("choice");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // show/hide password toggles
  const [showSignupPwd, setShowSignupPwd] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  const router = useRouter();

  // auto-dismiss success after 3s
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value?.trim().toLowerCase();
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value?.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement)?.value;

    if (!name) { setError("Full name required"); return; }
    if (!email) { setError("Email required"); return; }
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
    if (!password) { setError("Password required"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to send code");
      setPendingEmail(email);
      setMode("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("forgotEmail") as HTMLInputElement)?.value?.trim().toLowerCase();
    if (!email) { setError("Email required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to send reset email");
      setSuccess("Password reset link sent! Check your email.");
      setMode("login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
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
        body: JSON.stringify({ email: pendingEmail, token: otp }),
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

  const inputClass = "pl-10 h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:ring-cyan-500/20";
  const pwdInputClass = "pl-10 pr-10 h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:ring-cyan-500/20";

  const EyeToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
      tabIndex={-1}
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div
      className="w-full max-w-md animate-fade-in"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
        borderRadius: "1.5rem",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(24px)",
        padding: "2rem",
      }}
    >
      <div className="text-center mb-8">
        <h1
          className="text-4xl font-extrabold tracking-tight"
          style={{
            background: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 50%, #0891b2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Wanderers
        </h1>
        <p className="text-white/50 text-sm mt-2 font-medium">Find your people. Start something.</p>
      </div>

      {success && (
        <div className="mb-5 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {mode === "choice" && (
        <div className="space-y-3">
          <Button
            onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
            className="w-full h-12 text-base font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-cyan-950 shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign Up
          </Button>
          <Button
            onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
            variant="outline"
            className="w-full h-12 text-base font-semibold rounded-xl border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Log In
          </Button>
          <p className="text-xs text-center text-white/30 pt-1">University of Waterloo students only</p>
        </div>
      )}

      {mode === "signup" && (
        <form onSubmit={handleSignUp} className="space-y-4 animate-fade-in" autoComplete="off">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/70 text-sm font-medium">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input id="name" name="name" placeholder="Your full name" required autoComplete="off" className={inputClass} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/70 text-sm font-medium">Waterloo Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input id="email" name="email" type="email" placeholder="you@uwaterloo.ca" required autoComplete="off" className={inputClass} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/70 text-sm font-medium">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input id="password" name="password" type={showSignupPwd ? "text" : "password"} placeholder="Min. 8 characters" required autoComplete="new-password" className={pwdInputClass} />
              <EyeToggle show={showSignupPwd} onToggle={() => setShowSignupPwd(p => !p)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white/70 text-sm font-medium">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input id="confirmPassword" name="confirmPassword" type={showSignupConfirm ? "text" : "password"} placeholder="Re-enter your password" required autoComplete="new-password" className={pwdInputClass} />
              <EyeToggle show={showSignupConfirm} onToggle={() => setShowSignupConfirm(p => !p)} />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-semibold bg-cyan-500 hover:bg-cyan-400 text-cyan-950 shadow-lg shadow-cyan-500/25 disabled:opacity-50">
            {loading ? "Creating account…" : "Create Account"}
          </Button>
          <button type="button" onClick={() => { setMode("choice"); setError(null); }} className="w-full text-sm text-white/50 hover:text-white transition-colors">← Back</button>
        </form>
      )}

      {mode === "login" && (
        <form onSubmit={handleLogin} className="space-y-4 animate-fade-in" autoComplete="off">
          <div className="space-y-2">
            <Label htmlFor="loginEmail" className="text-white/70 text-sm font-medium">Waterloo Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input id="loginEmail" name="loginEmail" type="email" placeholder="you@uwaterloo.ca" required autoComplete="off" className={inputClass} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="loginPassword" className="text-white/70 text-sm font-medium">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input id="loginPassword" name="loginPassword" type={showLoginPwd ? "text" : "password"} placeholder="Your password" required autoComplete="new-password" className={pwdInputClass} />
              <EyeToggle show={showLoginPwd} onToggle={() => setShowLoginPwd(p => !p)} />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={() => { setMode("forgot"); setError(null); setSuccess(null); }} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              Forgot password?
            </button>
          </div>
          <p className="text-xs text-white/40">We&apos;ll send a 6-digit code to your inbox to verify it&apos;s you.</p>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-semibold bg-cyan-500 hover:bg-cyan-400 text-cyan-950 shadow-lg shadow-cyan-500/25 disabled:opacity-50">
            {loading ? "Sending code…" : "Log In"}
          </Button>
          <button type="button" onClick={() => { setMode("choice"); setError(null); }} className="w-full text-sm text-white/50 hover:text-white transition-colors">← Back</button>
        </form>
      )}

      {mode === "forgot" && (
        <form onSubmit={handleForgot} className="space-y-4 animate-fade-in" autoComplete="off">
          <div className="space-y-2">
            <Label htmlFor="forgotEmail" className="text-white/70 text-sm font-medium">Waterloo Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input id="forgotEmail" name="forgotEmail" type="email" placeholder="you@uwaterloo.ca" required autoComplete="off" className={inputClass} />
            </div>
          </div>
          <p className="text-xs text-white/40">We&apos;ll send you a link to reset your password.</p>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-semibold bg-cyan-500 hover:bg-cyan-400 text-cyan-950 shadow-lg shadow-cyan-500/25 disabled:opacity-50">
            {loading ? "Sending…" : "Send Reset Link"}
          </Button>
          <button type="button" onClick={() => { setMode("login"); setError(null); }} className="w-full text-sm text-white/50 hover:text-white transition-colors">← Back to Login</button>
        </form>
      )}

      {mode === "verify" && (
        <form onSubmit={handleVerify} className="space-y-5 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Check your email</h2>
          <p className="text-sm text-white/50">
            We sent a 6-digit code to <span className="text-white/80">{pendingEmail}</span>
          </p>
          <Input
            value={otp}
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(null); }}
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            className="text-center text-2xl tracking-[0.5em] h-14 rounded-xl font-mono bg-white/5 border-white/10 text-white placeholder:text-white/20"
          />
          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-semibold bg-cyan-500 hover:bg-cyan-400 text-cyan-950 disabled:opacity-50"
            disabled={loading || otp.length < 6}
          >
            {loading ? "Verifying…" : "Verify"}
          </Button>
          <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0}
            className="block w-full text-sm text-cyan-400 hover:text-cyan-300 disabled:text-white/30 disabled:cursor-not-allowed transition-colors">
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
          </button>
          <button type="button" onClick={() => { setMode("choice"); setOtp(""); setPendingEmail(""); setError(null); setResendCooldown(0); }}
            className="block w-full text-sm text-white/50 hover:text-white transition-colors">
            ← Back
          </button>
        </form>
      )}
    </div>
  );
}
