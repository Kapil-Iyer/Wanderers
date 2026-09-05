"use client";

import { useState } from "react";
import { AlertTriangle, ExternalLink, X } from "lucide-react";

type Diagnosis = {
  title: string;
  fix: string;
  link: string;
  linkLabel: string;
};

/** Maps each Google error code to the one setting that actually causes it. */
function diagnose(code: string | null): Diagnosis {
  switch (code) {
    case "ApiNotActivatedMapError":
      return {
        title: "Maps JavaScript API is not enabled",
        fix: "The key is valid but this Cloud project has not turned on the Maps JavaScript API. Enable it, then refresh.",
        link: "https://console.cloud.google.com/apis/library/maps-backend.googleapis.com",
        linkLabel: "Enable Maps JavaScript API",
      };
    case "RefererNotAllowedMapError":
      return {
        title: "This origin is not on the key's allowed list",
        fix: "Add http://localhost:3000/* to the key's website restrictions. Entries can take a few minutes to propagate.",
        link: "https://console.cloud.google.com/apis/credentials",
        linkLabel: "Edit key restrictions",
      };
    case "BillingNotEnabledMapError":
      return {
        title: "Billing is not enabled on this project",
        fix: "Link a billing account to the project that owns this key.",
        link: "https://console.cloud.google.com/billing",
        linkLabel: "Open Billing",
      };
    case "InvalidKeyMapError":
    case "ExpiredKeyMapError":
      return {
        title: "The API key is invalid",
        fix: "The key in .env.local does not match a key in this project. Copy it again from Credentials.",
        link: "https://console.cloud.google.com/apis/credentials",
        linkLabel: "Open Credentials",
      };
    case "ApiTargetBlockedMapError":
      return {
        title: "The key's API restrictions block Maps",
        fix: "Under API restrictions, allow Maps JavaScript API for this key.",
        link: "https://console.cloud.google.com/apis/credentials",
        linkLabel: "Edit API restrictions",
      };
    default:
      return {
        title: "Google rejected the Maps API key",
        fix: "Check billing, that Maps JavaScript API is enabled, and that the key allows localhost:3000.",
        link: "https://console.cloud.google.com/google/maps-apis/api-list",
        linkLabel: "Open Google Cloud console",
      };
  }
}

export default function MapsAuthNotice({ errorCode }: { errorCode: string | null }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const { title, fix, link, linkLabel } = diagnose(errorCode);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center px-3 pt-3">
      <div
        className="pointer-events-auto w-full max-w-md rounded-xl border p-3 backdrop-blur-xl"
        style={{
          background: "rgba(21, 12, 26, 0.94)",
          borderColor: "rgba(224, 51, 158, 0.28)",
          boxShadow: "0 10px 30px -12px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#FF5A36" }} />
          <div className="min-w-0 flex-1">
            <p
              className="text-[13px] font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {title}
            </p>
            <p
              className="mt-1 text-[12px] leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {fix}
            </p>
            {errorCode && (
              <p className="mt-1.5 font-mono text-[11px]" style={{ color: "#f9a8d4" }}>
                {errorCode}
              </p>
            )}
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold transition hover:opacity-80"
              style={{ color: "#f9a8d4" }}
            >
              {linkLabel}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-md p-1 transition hover:bg-white/10"
            style={{ color: "var(--color-text-muted)" }}
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
