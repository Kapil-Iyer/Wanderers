import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/bubbles/[id]/star
 * Star a bubble for the current user only. Starring is per-person: it keeps
 * this bubble in *your* conversations past the 5-day auto-cleanup window
 * (see supabase/migrations/20260826_bubble_stars_and_cleanup.sql) without
 * affecting any other member's view of it.
 *
 * DELETE /api/bubbles/[id]/star
 * Unstar it - it'll be pruned from your list 5 days after it expires, same
 * as any other bubble you didn't star.
 */

async function requireMember(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  bubbleId: string
) {
  const { data } = await admin
    .from("bubble_members")
    .select("user_id")
    .eq("bubble_id", bubbleId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const { id: bubbleId } = await context.params;
    if (!bubbleId) {
      return NextResponse.json({ success: false, error: "Bubble id required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!(await requireMember(admin, user.id, bubbleId))) {
      return NextResponse.json({ success: false, error: "Not a member of this bubble" }, { status: 403 });
    }

    const { error } = await admin
      .from("bubble_stars")
      .upsert({ bubble_id: bubbleId, user_id: user.id }, { onConflict: "user_id,bubble_id" });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: { starred: true } });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const { id: bubbleId } = await context.params;
    if (!bubbleId) {
      return NextResponse.json({ success: false, error: "Bubble id required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("bubble_stars")
      .delete()
      .eq("bubble_id", bubbleId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: { starred: false } });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
