"use client";

/**
 * Auth callback - email-link landing (magic link or password recovery).
 * Establishes session, then redirects to `next` (default /home).
 * Forgot-password uses next=/change-password.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function safeNextPath(raw: string | null): string {
  if (!raw) return "/home";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return "/home";
  return decoded;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    let cancelled = false;
    let settled = false;

    const params = new URLSearchParams(window.location.search);
    const nextPath = safeNextPath(params.get("next"));

    async function finish(sessionAccessToken: string) {
      if (cancelled || settled) return;
      settled = true;
      setMessage("Verified - signing you in…");
      try {
        await fetch("/api/auth/ensure-profile", {
          method: "POST",
          headers: { Authorization: `Bearer ${sessionAccessToken}` },
        });
      } catch {
        /* best-effort */
      }
      if (cancelled) return;
      setStatus("done");
      setMessage("You're in! Redirecting…");
      router.replace(nextPath);
    }

    async function fail(msg: string) {
      if (cancelled || settled) return;
      settled = true;
      setStatus("error");
      setMessage(msg);
    }

    async function handleCallback() {
      try {
        const { supabase } = await import("@/lib/supabase");

        const code = params.get("code");
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.session?.access_token) {
            await finish(data.session.access_token);
            return;
          }
        }

        const hash = window.location.hash.replace(/^#/, "");
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          const access_token = hashParams.get("access_token");
          const refresh_token = hashParams.get("refresh_token");
          if (access_token && refresh_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (!error && data.session?.access_token) {
              await finish(data.session.access_token);
              return;
            }
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          await finish(session.access_token);
          return;
        }

        await new Promise((r) => setTimeout(r, 1200));
        if (cancelled || settled) return;
        const again = await supabase.auth.getSession();
        if (again.data.session?.access_token) {
          await finish(again.data.session.access_token);
          return;
        }

        await fail("Could not verify that link. Request a new one from Forgot password.");
      } catch {
        await fail("Something went wrong. Try again.");
      }
    }

    handleCallback();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(180deg, #0e0a07 0%, #16110c 100%)" }}
    >
      <div className="text-center max-w-sm">
        {status === "loading" && (
          <p className="text-lg" style={{ color: "var(--color-text-primary)" }}>
            {message}
          </p>
        )}
        {status === "done" && (
          <p className="text-lg" style={{ color: "#4ade80" }}>
            {message}
          </p>
        )}
        {status === "error" && (
          <>
            <p className="text-lg" style={{ color: "#f87171" }}>
              {message}
            </p>
            <a
              href="/"
              className="mt-4 inline-block text-sm font-semibold"
              style={{ color: "#ffb56b" }}
            >
              Back to sign in
            </a>
          </>
        )}
      </div>
    </div>
  );
}
