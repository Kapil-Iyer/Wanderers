import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, resend } = body ?? {};

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();

    if (!resend) {
      if (!password || typeof password !== "string") {
        return NextResponse.json({ success: false, error: "Password required" }, { status: 400 });
      }

      // Step 1: verify password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password,
      });

      if (signInError || !data.session) {
        return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
      }

      // Step 2: sign out so OTP is the real auth factor
      await getSupabaseAdmin().auth.admin.signOut(data.session.access_token);
    }

    // Send OTP
    const { error: otpError } = await supabase.auth.signInWithOtp({ email: emailTrimmed });

    if (otpError) {
      console.error("[auth/login] OTP send error:", { message: otpError.message, status: otpError.status });
      return NextResponse.json(
        {
          success: false,
          error: otpError.message,
          ...(process.env.NODE_ENV !== "production" && { debug: { name: otpError.name, status: otpError.status } }),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
