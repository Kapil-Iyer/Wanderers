"use client";

/**
 * Change password - reached after clicking the forgot-password email link
 * (auto-signed in via /auth/callback?next=/change-password).
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/home"), 900);
  };

  if (checking) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(180deg, #0e0a07 0%, #16110c 100%)" }}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Loading…
        </p>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(180deg, #0e0a07 0%, #16110c 100%)" }}
    >
      <div
        className="w-full max-w-md p-8 rounded-3xl"
        style={{
          background: "linear-gradient(165deg, rgba(36,28,22,0.95) 0%, rgba(14,10,7,0.98) 100%)",
          border: "1px solid rgba(255,181,107,0.16)",
          boxShadow: "0 20px 50px -20px rgba(0,0,0,0.7)",
        }}
      >
        <h1 className="font-display text-2xl font-bold text-gradient">Change password</h1>
        <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>
          You&apos;re signed in. Set a new password for next time, or skip and go to Home.
        </p>

        {error && (
          <div
            className="mt-4 p-3 rounded-xl text-sm"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
          >
            {error}
          </div>
        )}

        {done ? (
          <p className="mt-6 text-sm font-semibold" style={{ color: "#4ade80" }}>
            Password updated - heading to Home…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                New password
              </span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full h-11 pl-10 pr-4 rounded-xl text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                Confirm password
              </span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full h-11 pl-10 pr-4 rounded-xl text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full text-sm font-bold disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #ff7a1a, #ffb56b)",
                color: "#2a1206",
              }}
            >
              {loading ? "Saving…" : "Update password"}
            </button>
            <button
              type="button"
              onClick={() => router.replace("/home")}
              className="w-full text-sm py-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Skip for now → Home
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
