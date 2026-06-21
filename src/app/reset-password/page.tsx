"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const hash = window.location.hash;
      if (!hash.includes("type=recovery")) {
        setError("Invalid or expired reset link. Please request a new one.");
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
      } else {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    }
    init();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.replace("/");
  };

  const inputClass = "pl-10 h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:ring-cyan-500/20";

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0d1117 100%)" }}>
      <div
        className="w-full max-w-md"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
          borderRadius: "1.5rem",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
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
          <p className="text-white/50 text-sm mt-2 font-medium">Set a new password</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
            {!ready && (
              <a href="/" className="block mt-2 text-cyan-400 hover:underline">← Back to login</a>
            )}
          </div>
        )}

        {!ready && !error && (
          <p className="text-center text-white/50 text-sm">Verifying reset link…</p>
        )}

        {ready && (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70 text-sm font-medium">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="password" type="password" placeholder="Min. 8 characters" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white/70 text-sm font-medium">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="confirmPassword" type="password" placeholder="Re-enter your password" required
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <Button
              type="submit" disabled={loading}
              className="w-full h-12 rounded-xl text-base font-semibold bg-cyan-500 hover:bg-cyan-400 text-cyan-950 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            >
              {loading ? "Updating…" : "Update Password"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
