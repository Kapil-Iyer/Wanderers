import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  clearDeviceTrustCookie,
  isDeviceTrustedForEmail,
  setDeviceTrustCookie,
} from "@/lib/deviceTrust";
import { CAMPUS_EMAIL_ERROR, isEmailAllowed } from "@/lib/campusEmail";
import { isOwnerEmail } from "@/lib/ownerAccounts";
import { withMailRetry } from "@/lib/authRetry";

// Dev only: Supabase's default email sender can time out (504) locally.
// Set AUTH_RETURN_RECOVERY_LINK=true in .env.local to skip the real OTP
// email send and get the 6-digit code back directly in the response instead.
// Never enabled in production regardless of the env var.
const DEV_RETURN_RECOVERY_LINK =
  process.env.NODE_ENV !== "production" &&
  process.env.AUTH_RETURN_RECOVERY_LINK === "true";

function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, resend, rememberDevice } = body ?? {};
    const wantRemember = rememberDevice === true;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();
    // Campus gate — no-op unless enabled. Set REQUIRE_UW_EMAIL=true in Vercel
    // environment variables to enforce the UWaterloo email gate in production.
    if (!isEmailAllowed(emailTrimmed)) {
      return NextResponse.json({ success: false, error: CAMPUS_EMAIL_ERROR }, { status: 403 });
    }

    const supabase = authClient();
    const owner = isOwnerEmail(emailTrimmed);

    // Owners never use OTP - resend is a no-op hint
    if (resend && owner) {
      return NextResponse.json({
        success: true,
        skippedOtp: true,
        message: "Owner accounts sign in with password only - no OTP.",
      });
    }

    if (!resend) {
      if (!password || typeof password !== "string") {
        return NextResponse.json({ success: false, error: "Password required" }, { status: 400 });
      }

      // Step 1: verify password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password,
      });

      if (signInError || !data.session || !data.user) {
        return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
      }

      // Defense in depth - reject if the auth user record isn't allowed.
      // Set REQUIRE_UW_EMAIL=true in Vercel environment variables to enforce the UWaterloo email gate in production.
      if (!isEmailAllowed(data.user.email ?? emailTrimmed)) {
        await getSupabaseAdmin().auth.admin.signOut(data.session.access_token);
        return NextResponse.json({ success: false, error: CAMPUS_EMAIL_ERROR }, { status: 403 });
      }

      const skipOtp =
        owner ||
        (wantRemember && isDeviceTrustedForEmail(request, emailTrimmed, data.user.id));

      if (skipOtp) {
        await getSupabaseAdmin().from("users").upsert(
          {
            id: data.user.id,
            email: data.user.email ?? emailTrimmed,
            campus_verified: true,
          },
          { onConflict: "id" }
        );

        const res = NextResponse.json({
          success: true,
          skippedOtp: true,
          session: data.session,
          user: data.user,
          ...(owner ? { isOwner: true } : {}),
        });
        if (wantRemember || owner) {
          setDeviceTrustCookie(res, emailTrimmed, data.user.id);
        }
        return res;
      }

      // Step 2: sign out so OTP is the real auth factor (when required)
      await getSupabaseAdmin().auth.admin.signOut(data.session.access_token);
    }

    if (DEV_RETURN_RECOVERY_LINK) {
      // Admin generateLink never dispatches an email — sidesteps the SMTP
      // timeout entirely and hands the code straight back for local testing.
      const { data, error } = await getSupabaseAdmin().auth.admin.generateLink({
        type: "magiclink",
        email: emailTrimmed,
      });

      if (error) {
        console.error("[auth/login] (dev generateLink)", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      const res = NextResponse.json({
        success: true,
        requiresOtp: true,
        message: "Dev mode: OTP generated below (no email sent).",
        devOtp: data.properties?.email_otp ?? null,
      });
      if (!wantRemember && !resend) {
        clearDeviceTrustCookie(res);
      }
      return res;
    }

    // Send OTP (non-owners only). Retries a couple times on Supabase's
    // transient mailer timeouts (504 "Context deadline exceeded") before
    // giving up — see src/lib/authRetry.ts.
    const { error: otpError } = await withMailRetry(() =>
      supabase.auth.signInWithOtp({ email: emailTrimmed })
    );

    if (otpError) {
      console.error("[auth/login] OTP send error:", { message: otpError.message, status: otpError.status });
      return NextResponse.json(
        {
          success: false,
          error: otpError.message,
          ...(process.env.NODE_ENV !== "production" && {
            debug: { name: otpError.name, status: otpError.status },
          }),
        },
        { status: 400 }
      );
    }

    const res = NextResponse.json({ success: true, requiresOtp: true });
    if (!wantRemember && !resend) {
      clearDeviceTrustCookie(res);
    }
    return res;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
