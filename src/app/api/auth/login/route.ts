import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  clearDeviceTrustCookie,
  isDeviceTrustedForEmail,
  setDeviceTrustCookie,
} from "@/lib/deviceTrust";

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
    const supabase = authClient();

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

      // Trusted device within 7 days → skip OTP and keep session
      if (wantRemember && isDeviceTrustedForEmail(request, emailTrimmed, data.user.id)) {
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
        });
        // Refresh trust window another 7 days from this login
        setDeviceTrustCookie(res, emailTrimmed, data.user.id);
        return res;
      }

      // Step 2: sign out so OTP is the real auth factor (when required)
      await getSupabaseAdmin().auth.admin.signOut(data.session.access_token);

      if (!wantRemember) {
        // User opted out — clear any existing trust on this browser
        const resAfterClear = NextResponse.json({ success: true, requiresOtp: true });
        clearDeviceTrustCookie(resAfterClear);
        // still send OTP below — rebuild response after OTP success
      }
    }

    // Send OTP
    const { error: otpError } = await supabase.auth.signInWithOtp({ email: emailTrimmed });

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
