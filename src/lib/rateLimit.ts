import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Per-(action, identifier) request throttle backed by the Postgres
 * check_rate_limit() function (supabase/migrations/20260920_auth_rate_limits.sql).
 * Needed because Vercel's functions are stateless/multi-instance, so an
 * in-memory counter wouldn't be shared across invocations.
 *
 * Fails open on infra errors - a Supabase hiccup should not itself lock
 * everyone out of auth.
 */
export async function checkRateLimit(
  action: string,
  identifier: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin().rpc("check_rate_limit", {
    p_key: `${action}:${identifier}`,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("[rateLimit] check_rate_limit failed, failing open:", error.message);
    return true;
  }

  return data === true;
}

export function rateLimitResponse() {
  return NextResponse.json(
    { success: false, error: "Too many attempts. Try again later." },
    { status: 429 }
  );
}
