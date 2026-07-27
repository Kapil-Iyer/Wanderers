import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { clearDeviceTrustCookie, setDeviceTrustCookie } from "@/lib/deviceTrust";

/**
 * POST /api/auth/verify
 * Accept { email, token, rememberDevice? }. Verify OTP, upsert user, optionally
 * trust this device for 7 days (skip OTP on next logins).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, name, rememberDevice } = body ?? {};
    if (!email || !token) {
      return NextResponse.json(
        { success: false, error: "Email and token required" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: "Verification failed" },
        { status: 401 }
      );
    }

    const emailTrimmed = String(email).trim().toLowerCase();
    const upsertData: Record<string, unknown> = {
      id: data.user.id,
      email: data.user.email ?? emailTrimmed,
      campus_verified: true,
    };
    if (name) upsertData.name = name;

    await getSupabaseAdmin().from("users").upsert(upsertData, { onConflict: "id" });

    const res = NextResponse.json({
      session: data.session,
      user: data.user,
      success: true,
    });

    if (rememberDevice === true) {
      setDeviceTrustCookie(res, emailTrimmed, data.user.id);
    } else {
      clearDeviceTrustCookie(res);
    }

    return res;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
