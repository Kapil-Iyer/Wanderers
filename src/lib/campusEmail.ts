/**
 * Campus email gate - only @uwaterloo.ca addresses may sign up / log in.
 */

export const CAMPUS_EMAIL_DOMAIN = "uwaterloo.ca";

export const CAMPUS_EMAIL_ERROR =
  "Only @uwaterloo.ca emails can use Wanderers. Use your Waterloo email.";

/** True for addresses ending in @uwaterloo.ca (case-insensitive). */
export function isUWaterlooEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  // Reject empty local part: "@uwaterloo.ca"
  if (!trimmed.includes("@") || trimmed.startsWith("@")) return false;
  return trimmed.endsWith(`@${CAMPUS_EMAIL_DOMAIN}`);
}
