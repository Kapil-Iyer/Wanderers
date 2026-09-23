import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * DELETE /api/account
 * Permanently deletes the current user's account and data.
 *
 * Most tables cascade from public.users (bubbles, bubble_members,
 * bubble_stars, connections, blocks, reports - all `on delete cascade`,
 * see supabase/migrations). A few don't, by original design (see comments
 * in 20260820_baseline_schema.sql): messages.user_id and
 * meetup_photos.user_id are nullable with no cascade, so a deleted user's
 * chat messages and Wander Moments photos stay visible to the rest of the
 * bubble instead of vanishing - we null out the author instead of deleting
 * the content. direct_messages has non-nullable sender/receiver FKs with no
 * cascade at all (and the feature is unused - see database.types.ts), so
 * those rows are hard-deleted outright; leaving them would block the
 * auth.users delete with a foreign-key violation.
 *
 * Deleting the auth.users row cascades to public.users, which then cascades
 * everything else.
 */
export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const { error: messagesError } = await admin
    .from("messages")
    .update({ user_id: null })
    .eq("user_id", user.id);
  if (messagesError) {
    return NextResponse.json({ success: false, error: messagesError.message }, { status: 500 });
  }

  const { error: momentsError } = await admin
    .from("meetup_photos")
    .update({ user_id: null })
    .eq("user_id", user.id);
  if (momentsError) {
    return NextResponse.json({ success: false, error: momentsError.message }, { status: 500 });
  }

  const { error: dmError } = await admin
    .from("direct_messages")
    .delete()
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
  if (dmError) {
    return NextResponse.json({ success: false, error: dmError.message }, { status: 500 });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
