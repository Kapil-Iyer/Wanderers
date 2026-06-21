import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/auth/verify
 * Accept { email, token }. Verify OTP, upsert user into public.users, return session and user.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, name } = body ?? {};
    if (!email || !token) {
      return NextResponse.json(
        { success: false, error: "Email and token required" },
        { status: 400 }
      );
    }

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

    const upsertData: Record<string, unknown> = {
      id: data.user.id,
      email: data.user.email ?? email,
      campus_verified: true,
    };
    if (name) upsertData.name = name;

    await getSupabaseAdmin().from("users").upsert(upsertData, { onConflict: "id" });

    return NextResponse.json({
      session: data.session,
      user: data.user,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
