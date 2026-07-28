"use client";

/** Old reset URL → same as callback with change-password next. */
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordRedirect() {
  const router = useRouter();
  useEffect(() => {
    const q = window.location.search;
    const hash = window.location.hash;
    const next = encodeURIComponent("/change-password");
    const join = q ? `${q}&next=${next}` : `?next=${next}`;
    router.replace(`/auth/callback${join}${hash}`);
  }, [router]);
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#0e0a07" }}
    >
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        Opening…
      </p>
    </main>
  );
}
