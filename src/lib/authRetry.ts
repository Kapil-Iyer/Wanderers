/**
 * Supabase's built-in auth mailer occasionally times out under load (free-tier
 * SMTP is slow/rate-limited) and GoTrue surfaces that as a 504 with message
 * "Context deadline exceeded". That's a transient hiccup, not a real failure —
 * retrying the same call a couple of times with a short backoff usually
 * succeeds. This is a stopgap; the real fix is configuring custom SMTP in the
 * Supabase dashboard (Authentication -> Settings -> SMTP Settings).
 */

type SupabaseAuthError = { message?: string; status?: number } | null | undefined;

function isTransientMailError(error: SupabaseAuthError): boolean {
  if (!error) return false;
  if (error.status === 504) return true;
  const message = error.message?.toLowerCase() ?? "";
  return message.includes("deadline exceeded") || message.includes("timeout");
}

/**
 * Retries a Supabase auth call (e.g. signInWithOtp, resetPasswordForEmail)
 * when it fails with a transient mailer timeout. `fn` should return the same
 * shape Supabase does: `{ error }` (any other fields are passed through
 * untouched on success).
 */
export async function withMailRetry<T extends { error: SupabaseAuthError }>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 400
): Promise<T> {
  let result = await fn();
  let tries = 1;

  while (isTransientMailError(result.error) && tries < attempts) {
    await new Promise((resolve) => setTimeout(resolve, baseDelayMs * tries));
    result = await fn();
    tries += 1;
  }

  return result;
}
