/**
 * Owner / bootstrap accounts - skip OTP forever; password login only.
 * Add emails here (lowercase) to treat them as owners.
 */

export const OWNER_EMAILS = ["a@uwaterloo.ca"] as const;

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  return (OWNER_EMAILS as readonly string[]).includes(normalized);
}
