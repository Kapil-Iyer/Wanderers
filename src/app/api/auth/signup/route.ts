import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

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

    const emailTrimmed = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({ email: emailTrimmed, password });

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
        campus_verified: false,
      },
      { onConflict: "id" }
    );

    return NextResponse.json({ success: true, session: data.session });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
