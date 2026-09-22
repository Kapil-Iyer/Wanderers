import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { CAMPUS_EMAIL_ERROR, isEmailAllowed } from "@/lib/campusEmail";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

const MAX_NAME_LENGTH = 80;

/**
 * Signup was the one unthrottled auth route. Two buckets, because they stop
 * different things: keying only on email does nothing against mass account
 * creation (just vary the address), and keying only on IP lets a single
 * address be hammered from a botnet.
 */
const SIGNUPS_PER_IP = 10;
const SIGNUPS_PER_EMAIL = 3;
const SIGNUP_WINDOW_SECONDS = 60 * 60;

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (
    (fwd ? fwd.split(",")[0].trim() : null) ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body ?? {};

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (name != null && (typeof name !== "string" || name.trim().length > MAX_NAME_LENGTH)) {
      return NextResponse.json(
        { success: false, error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    const emailTrimmed = email.trim().toLowerCase();

    if (!(await checkRateLimit("auth-signup-ip", clientIp(request), SIGNUPS_PER_IP, SIGNUP_WINDOW_SECONDS))) {
      return rateLimitResponse();
    }
    if (!(await checkRateLimit("auth-signup-email", emailTrimmed, SIGNUPS_PER_EMAIL, SIGNUP_WINDOW_SECONDS))) {
      return rateLimitResponse();
    }
    // Campus gate — no-op unless enabled. Set REQUIRE_UW_EMAIL=true in Vercel
    // environment variables to enforce the UWaterloo email gate in production.
    if (!isEmailAllowed(emailTrimmed)) {
      return NextResponse.json({ success: false, error: CAMPUS_EMAIL_ERROR }, { status: 403 });
    }

    const { data, error } = await supabase.auth.signUp({
      email: emailTrimmed,
      password,
      options: {
        data: { name: name?.trim() || null },
      },
    });

    if (error) {
      console.error("[auth/signup] Supabase signUp error:", { message: error.message, status: error.status });
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ success: false, error: "Signup failed" }, { status: 400 });
    }

    await getSupabaseAdmin().from("users").upsert(
      {
        id: data.user.id,
        email: data.user.email ?? emailTrimmed,
        name: name?.trim() || null,
        campus_verified: true,
      },
      { onConflict: "id" }
    );

    return NextResponse.json({ success: true, session: data.session });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
