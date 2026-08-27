import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CAMPUS_EMAIL_ERROR, isEmailAllowed } from "@/lib/campusEmail";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { withMailRetry } from "@/lib/authRetry";

// Dev only: Supabase's default email sender can time out (504) locally.
// Set AUTH_RETURN_RECOVERY_LINK=true in .env.local to skip the real email
// send and get the OTP code back directly in the response instead.
// Never enabled in production regardless of the env var.
const DEV_RETURN_RECOVERY_LINK =
  process.env.NODE_ENV !== "production" &&
  process.env.AUTH_RETURN_RECOVERY_LINK === "true";

/**
 * POST /api/auth/forgot-password
 * Sends a 6-digit OTP to the user's inbox (@uwaterloo.ca when campus gate is on).
 * Enter the code on the next screen to sign in (same verify flow as login OTP).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body ?? {};

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();
    if (!isEmailAllowed(emailTrimmed)) {
      return NextResponse.json({ success: false, error: CAMPUS_EMAIL_ERROR }, { status: 403 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (DEV_RETURN_RECOVERY_LINK) {
      const { data, error } = await getSupabaseAdmin().auth.admin.generateLink({
        type: "magiclink",
        email: emailTrimmed,
      });

      if (error) {
        console.error("[auth/forgot-password] (dev generateLink)", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        requiresOtp: true,
        message: "Dev mode: OTP generated below (no email sent).",
        devOtp: data.properties?.email_otp ?? null,
      });
    }

    const { error } = await withMailRetry(() =>
      supabase.auth.signInWithOtp({
        email: emailTrimmed,
        options: { shouldCreateUser: false },
      })
    );

    if (error) {
      console.error("[auth/forgot-password]", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      requiresOtp: true,
      message: "If an account exists for that email, we sent a 6-digit code.",
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
