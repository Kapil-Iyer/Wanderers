/**
 * Ensure auth user exists in public.users and is a member of the bubble.
 * Auto-joins open/active non-expired bubbles (idempotent).
 * Used by messages GET/POST so send/history never 403 after a soft join.
 */

import type { User, SupabaseClient } from "@supabase/supabase-js";
import { ensureUserInPublic } from "@/lib/ensureUser";

export async function ensureBubbleMembership(
  admin: SupabaseClient,
  user: User,
  bubbleId: string
): Promise<{ ok: true; members_count: number } | { ok: false; status: number; error: string }> {
  const { error: ensureError } = await ensureUserInPublic(admin, user);
  if (ensureError) {
    return { ok: false, status: 500, error: `Could not ensure user: ${ensureError}` };
  }

  const { data: existing } = await admin
    .from("bubble_members")
    .select("user_id")
    .eq("bubble_id", bubbleId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { count } = await admin
      .from("bubble_members")
      .select("user_id", { count: "exact", head: true })
      .eq("bubble_id", bubbleId);
    return { ok: true, members_count: count ?? 1 };
  }

  const { data: bubble, error: fetchError } = await admin
    .from("bubbles")
    .select("id, expires_at, max_members, status")
    .eq("id", bubbleId)
    .maybeSingle();

  if (fetchError || !bubble) {
    return { ok: false, status: 404, error: "Bubble not found" };
  }

  if (bubble.status === "expired" || new Date(bubble.expires_at) < new Date()) {
    return { ok: false, status: 400, error: "Bubble expired" };
  }

  const { count, error: countError } = await admin
    .from("bubble_members")
    .select("user_id", { count: "exact", head: true })
    .eq("bubble_id", bubbleId);

  if (countError) {
    return { ok: false, status: 500, error: "Failed to count members" };
  }

  const memberCount = count ?? 0;
  if (bubble.max_members != null && memberCount >= bubble.max_members) {
    return { ok: false, status: 400, error: "Bubble full" };
  }

  const { error: insertError } = await admin.from("bubble_members").insert({
    bubble_id: bubbleId,
    user_id: user.id,
  });

  if (insertError) {
    // Race: another request inserted first - treat as success
    if (insertError.code === "23505") {
      const { count: again } = await admin
        .from("bubble_members")
        .select("user_id", { count: "exact", head: true })
        .eq("bubble_id", bubbleId);
      return { ok: true, members_count: again ?? memberCount + 1 };
    }
    return { ok: false, status: 400, error: insertError.message };
  }

  const newCount = memberCount + 1;
  if (newCount >= 2) {
    await admin.from("bubbles").update({ status: "active" }).eq("id", bubbleId);
  }

  return { ok: true, members_count: newCount };
}
