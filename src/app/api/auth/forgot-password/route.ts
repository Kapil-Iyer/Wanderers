import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CAMPUS_EMAIL_ERROR, isEmailAllowed } from "@/lib/campusEmail";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { withMailRetry } from "@/lib/authRetry";

// Dev only: Supabase's default email sender can time out (504) locally.
// Set AUTH_RETURN_RECOVERY_LINK=true in .env.local to skip the real email
// send and get the recovery link back directly in the response instead.
// Never enabled in production regardless of the env var.
const DEV_RETURN_RECOVERY_LINK =
  process.env.NODE_ENV !== "production" &&
  process.env.AUTH_RETURN_RECOVERY_LINK === "true";

/**
 * POST /api/auth/forgot-password
 * Emails a reset / sign-in link to the user's inbox (no on-page verify button).
 * Clicking the link signs them in and lands on /change-password.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body ?? {};

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();
    // Campus gate — no-op unless enabled. Set REQUIRE_UW_EMAIL=true in Vercel
    // environment variables to enforce the UWaterloo email gate in production.
    if (!isEmailAllowed(emailTrimmed)) {
      return NextResponse.json({ success: false, error: CAMPUS_EMAIL_ERROR }, { status: 403 });
    }

    const origin = request.headers.get("origin") || "http://127.0.0.1:3000";
    const site =
      (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "") ||
      "http://127.0.0.1:3000";

    // One email link → auto sign-in → change password screen
    const redirectTo = `${site}/auth/callback?next=${encodeURIComponent("/change-password")}`;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (DEV_RETURN_RECOVERY_LINK) {
      // Admin generateLink never dispatches an email — sidesteps the SMTP
      // timeout entirely and hands the link straight back for local testing.
      const { data, error } = await getSupabaseAdmin().auth.admin.generateLink({
        type: "recovery",
        email: emailTrimmed,
        options: { redirectTo },
      });

      if (error) {
        console.error("[auth/forgot-password] (dev generateLink)", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "Dev mode: recovery link generated below (no email sent).",
        devRecoveryLink: data.properties?.action_link ?? null,
      });
    }

    // Retries a couple times on Supabase's transient mailer timeouts (504
    // "Context deadline exceeded") before giving up — see src/lib/authRetry.ts.
    const { error } = await withMailRetry(() =>
      supabase.auth.resetPasswordForEmail(emailTrimmed, { redirectTo })
    );

    if (error) {
      console.error("[auth/forgot-password]", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Always succeed the same way (don't leak whether the account exists)
    return NextResponse.json({
      success: true,
      message:
        "If an account exists for that email, we sent a link. Open it to sign in and set a new password.",
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
