import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getMemberCounts } from "@/lib/memberCounts";

/**
 * Membership is append-only - nothing removes a user from a bubble when it
 * ends - so this grows for the lifetime of an account. Unbounded, a user with
 * a term's worth of joins sends hundreds of ids into an `.in()` filter on
 * every app load. Newest joins first, since that is what the UI shows.
 */
const MAX_JOINED = 100;

/**
 * GET /api/bubbles/mine
 * List bubbles the authenticated user has joined (from bubble_members).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data: memberships, error: memError } = await admin
      .from("bubble_members")
      .select("bubble_id, joined_at")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false })
      .limit(MAX_JOINED);

    if (memError) {
      return NextResponse.json(
        { success: false, error: memError.message },
        { status: 500 }
      );
    }

    const bubbleIds = (memberships ?? []).map((m) => m.bubble_id);
    if (bubbleIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const { data: bubbles, error } = await admin
      .from("bubbles")
      .select(
        "id, activity, zone, emoji, start_time, duration_minutes, max_members, status, expires_at, creator_id"
      )
      .in("id", bubbleIds)
      .order("start_time", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // This user's own stars - per-person, so only their rows matter for
    // whether *they* see a bubble stay past the 5-day auto-cleanup window.
    const { data: starred } = await admin
      .from("bubble_stars")
      .select("bubble_id")
      .eq("user_id", user.id)
      .in("bubble_id", bubbleIds);
    const starredIds = new Set((starred ?? []).map((s) => s.bubble_id));

    // One query for every bubble's member count, not one query per bubble.
    const rows = bubbles ?? [];
    const countById = await getMemberCounts(admin, rows.map((b) => b.id));

    const withCount = rows.map((b) => ({
      ...b,
      members_count: countById.get(b.id) ?? 0,
      starred: starredIds.has(b.id),
    }));

    return NextResponse.json({
      success: true,
      data: withCount,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
