import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ensureUserInPublic } from "@/lib/ensureUser";

/**
 * POST /api/bubbles/join
 * Join a bubble. Duplicate join returns 400. Expired/full return 400 with message.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdmin();
    const { error: ensureError } = await ensureUserInPublic(admin, user);
    if (ensureError) {
      return NextResponse.json(
        { success: false, error: `Could not ensure user: ${ensureError}` },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const bubble_id = (body?.bubble_id ?? body?.bubbleId ?? "").toString().trim();
    if (!bubble_id) {
      return NextResponse.json(
        { success: false, error: "bubble_id required" },
        { status: 400 }
      );
    }

    const { data: bubble, error: fetchError } = await admin
      .from("bubbles")
      .select("id, expires_at, max_members, status")
      .eq("id", bubble_id)
      .single();

    if (fetchError || !bubble) {
      return NextResponse.json(
        { success: false, error: "Bubble not found" },
        { status: 404 }
      );
    }

    if (new Date(bubble.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Bubble expired" },
        { status: 400 }
      );
    }

    if (bubble.status === "expired") {
      return NextResponse.json(
        { success: false, error: "Bubble is no longer open" },
        { status: 400 }
      );
    }

    const { data: existing } = await admin
      .from("bubble_members")
      .select("user_id")
      .eq("bubble_id", bubble_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { count } = await admin
        .from("bubble_members")
        .select("user_id", { count: "exact", head: true })
        .eq("bubble_id", bubble_id);
      return NextResponse.json({
        success: true,
        data: { members_count: count ?? 1, already_member: true },
      });
    }

    const { count, error: countError } = await admin
      .from("bubble_members")
      .select("user_id", { count: "exact", head: true })
      .eq("bubble_id", bubble_id);

    if (countError) {
      return NextResponse.json(
        { success: false, error: "Failed to count members" },
        { status: 500 }
      );
    }

    const memberCount = count ?? 0;
    if (bubble.max_members != null && memberCount >= bubble.max_members) {
      return NextResponse.json(
        { success: false, error: "Bubble full" },
        { status: 400 }
      );
    }

    const { error: insertError } = await admin.from("bubble_members").insert({
      bubble_id,
      user_id: user.id,
    });

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 400 }
      );
    }

    const newCount = memberCount + 1;
    if (newCount >= 2) {
      await admin
        .from("bubbles")
        .update({ status: "active" })
        .eq("id", bubble_id);
    }

    return NextResponse.json({
      success: true,
      data: { members_count: newCount },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
