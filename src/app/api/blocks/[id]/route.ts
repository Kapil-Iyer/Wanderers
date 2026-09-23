import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/blocks/[id]
 * Block user [id]. Enforced both at the DB level (RLS on `blocks`) and at
 * the application level - see the blocked-user filtering added to
 * /api/bubbles/[id]/messages, /api/moments, and /api/connections.
 *
 * DELETE /api/blocks/[id]
 * Unblock user [id].
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
  }

  const { id: blockedId } = await context.params;
  if (!blockedId) {
    return NextResponse.json({ success: false, error: "User id required" }, { status: 400 });
  }
  if (blockedId === user.id) {
    return NextResponse.json({ success: false, error: "Cannot block yourself" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("blocks")
    .upsert({ blocker_id: user.id, blocked_id: blockedId }, { onConflict: "blocker_id,blocked_id" });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: { blocked: true } });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
  }

  const { id: blockedId } = await context.params;
  if (!blockedId) {
    return NextResponse.json({ success: false, error: "User id required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: { blocked: false } });
}
