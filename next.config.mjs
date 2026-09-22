// Allows the app's actual external dependencies: Google Maps JS API (script
// + tiles + street view iframe), Google Fonts, Supabase (REST + Realtime
// websocket). style-src needs 'unsafe-inline' because the app renders
// inline `style={{}}` throughout rather than CSS modules/classes - a
// nonce-based approach would mean touching hundreds of components for
// marginal gain over what the other directives already block.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://maps.googleapis.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io",
  "frame-src 'self' https://www.google.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@react-google-maps/api", "gsap", "@gsap/react"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=()" },
        ],
      },
    ];
  },
};

// Inert (no-op wrapper) until SENTRY_AUTH_TOKEN/SENTRY_ORG/SENTRY_PROJECT are
// set - source map upload is skipped silently without them, per the plugin's
// own behavior. Error reporting itself (sentry.server.config.ts etc.) is
// separately gated on SENTRY_DSN, not this.
import { withSentryConfig } from "@sentry/nextjs/config";

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: false,
  telemetry: false,
});
