import * as Sentry from "@sentry/nextjs";

// Inert until SENTRY_DSN is set (see .env.example) - Sentry.init() with an
// empty/undefined dsn just no-ops instead of sending anything.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
});
