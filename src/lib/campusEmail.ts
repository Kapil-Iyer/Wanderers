/**
 * Campus email gate — restricts sign up / log in to @uwaterloo.ca addresses,
 * but ONLY when the gate is enabled.
 *
 * Set REQUIRE_UW_EMAIL=true in Vercel environment variables to enforce the
 * UWaterloo email gate in production. When REQUIRE_UW_EMAIL is false, missing,
 * or any other value, any valid email address is allowed through.
 *
 * Next.js note: server code reads REQUIRE_UW_EMAIL. Client components (AuthModal)
 * can only read NEXT_PUBLIC_* vars, so also set NEXT_PUBLIC_REQUIRE_UW_EMAIL=true
 * for the browser-side check to enforce too. The server routes are the real gate;
 * the client check is only a friendly pre-validation.
 */

export const CAMPUS_EMAIL_DOMAIN = "uwaterloo.ca";

export const CAMPUS_EMAIL_ERROR =
  "Only @uwaterloo.ca emails can use Wanderers. Use your Waterloo email.";

/**
 * Whether the @uwaterloo.ca gate is currently enforced.
 * Set REQUIRE_UW_EMAIL=true (and NEXT_PUBLIC_REQUIRE_UW_EMAIL=true for the client)
 * in Vercel environment variables to enforce the UWaterloo email gate in production.
 */
export function isCampusGateEnabled(): boolean {
  return (
    process.env.REQUIRE_UW_EMAIL === "true" ||
    process.env.NEXT_PUBLIC_REQUIRE_UW_EMAIL === "true"
  );
}

/** Pure domain check: true for addresses ending in @uwaterloo.ca (case-insensitive). */
export function isUWaterlooEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  // Reject empty local part: "@uwaterloo.ca"
  if (!trimmed.includes("@") || trimmed.startsWith("@")) return false;
  return trimmed.endsWith(`@${CAMPUS_EMAIL_DOMAIN}`);
}

/**
 * Whether an email may sign up / log in.
 * - Gate OFF (default) → any valid email is allowed.
 * - Gate ON            → only @uwaterloo.ca addresses.
 */
export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!isCampusGateEnabled()) return true;
  return isUWaterlooEmail(email);
}
