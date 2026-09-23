"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Only catches errors thrown by the root layout itself (very rare - normal
 * page-level errors hit error.tsx instead). Has to render its own <html>/
 * <body> since it replaces the root layout entirely when it's active.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
          <div>
            <h1 style={{ marginBottom: 16, fontSize: 32, fontWeight: 700 }}>Something went wrong</h1>
            <p style={{ marginBottom: 24, fontSize: 18, opacity: 0.7 }}>
              That&apos;s on us - give it another try.
            </p>
            <button type="button" onClick={reset} style={{ textDecoration: "underline", cursor: "pointer" }}>
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
