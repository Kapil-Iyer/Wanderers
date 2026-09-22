"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary. Without this file an unhandled render error
 * anywhere in the tree blanks the page with no way back.
 *
 * `reset()` re-renders the segment, which recovers from transient failures
 * (a fetch that threw, a bad payload) without a full reload.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Stands in for real error tracking, which the app does not have yet.
    // Until it does, this is the only record that anything went wrong.
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-6">
      <div className="max-w-md text-center">
        <h1 className="mb-3 text-3xl font-bold">Something went wrong</h1>
        <p className="mb-6 text-muted-foreground">
          That page hit an error on our end. Trying again usually works.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            href="/home"
            className="rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-accent"
          >
            Back to home
          </Link>
        </div>
        {error.digest ? (
          <p className="mt-6 text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
