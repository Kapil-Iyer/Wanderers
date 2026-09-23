import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthUser } from "@/lib/auth";
import { getMemberCounts } from "@/lib/memberCounts";

/**
 * GET /api/bubbles/[id]
 * Return one bubble's info (for the chat header when opened from Home).
 * Auth required - real activity/status for a real bubble.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Independent of each other, and this runs on every chat header load, so
    // pay for one round trip rather than two.
    const [{ data: bubble, error }, countById] = await Promise.all([
      admin
        .from("bubbles")
        .select("id, activity, zone, start_time, duration_minutes, max_members, status")
        .eq("id", id)
        .maybeSingle(),
      getMemberCounts(admin, [id]),
    ]);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    if (!bubble) {
      return NextResponse.json({ success: false, error: "Bubble not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { ...bubble, members_count: countById.get(id) ?? 0 },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
