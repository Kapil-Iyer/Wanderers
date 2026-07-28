import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CAMPUS_EMAIL_ERROR, isUWaterlooEmail } from "@/lib/campusEmail";

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
    if (!isUWaterlooEmail(emailTrimmed)) {
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

    const { error } = await supabase.auth.resetPasswordForEmail(emailTrimmed, {
      redirectTo,
    });

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
