"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown in the root layout itself, which
 * `error.tsx` cannot catch. It replaces the whole document, so it has to
 * render its own <html> and <body> and cannot rely on Providers or global
 * styles having loaded - hence the inline styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0f",
          color: "#f4f4f5",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 12px" }}>
            Wanderers couldn&apos;t load
          </h1>
          <p style={{ color: "#a1a1aa", lineHeight: 1.5, margin: "0 0 24px" }}>
            Something failed while starting the app. Reloading usually fixes it.
          </p>
          <button
            onClick={reset}
            style={{
              border: "none",
              borderRadius: 9999,
              padding: "10px 22px",
              fontSize: 14,
              fontWeight: 500,
              background: "#f4f4f5",
              color: "#0b0b0f",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          {error.digest ? (
            <p style={{ marginTop: 24, fontSize: 12, color: "#71717a" }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
