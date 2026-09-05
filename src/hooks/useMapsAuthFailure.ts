"use client";

import { useEffect, useState } from "react";

export type MapsAuthState = {
  authFailed: boolean;
  /** Google's specific code, e.g. "ApiNotActivatedMapError". */
  errorCode: string | null;
};

/**
 * Google Maps JS reports key/billing problems two ways, neither of which
 * rejects the loader promise:
 *   - it calls a global `gm_authFailure` callback
 *   - it logs "Google Maps JavaScript API error: <Code>" to the console
 *
 * We capture both so the UI can name the exact misconfiguration instead of
 * echoing Google's generic "this page can't load Google Maps correctly".
 */
export function useMapsAuthFailure(): MapsAuthState {
  const [authFailed, setAuthFailed] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    const w = window as typeof window & { gm_authFailure?: () => void };
    const previousHandler = w.gm_authFailure;
    w.gm_authFailure = () => {
      setAuthFailed(true);
      previousHandler?.();
    };

    const originalError = console.error;
    const capture = (...args: unknown[]) => {
      const text = args
        .map((a) => (typeof a === "string" ? a : ""))
        .join(" ");
      const match = text.match(
        /Google Maps JavaScript API (?:error|warning):\s*([A-Za-z]+)/
      );
      if (match) {
        setAuthFailed(true);
        setErrorCode(match[1]);
      }
      originalError.apply(console, args as []);
    };
    console.error = capture;

    return () => {
      w.gm_authFailure = previousHandler;
      if (console.error === capture) console.error = originalError;
    };
  }, []);

  return { authFailed, errorCode };
}
