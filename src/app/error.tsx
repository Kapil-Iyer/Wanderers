"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
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
    <div className="flex min-h-screen items-center justify-center bg-muted px-6">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Something went wrong</h1>
        <p className="mb-6 text-xl text-muted-foreground">
          That&apos;s on us - give it another try.
        </p>
        <button
          type="button"
          onClick={reset}
          className="text-primary underline hover:text-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
