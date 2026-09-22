import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Member counts for a set of bubbles in a single query.
 *
 * Replaces the per-bubble `count: "exact"` calls that /api/bubbles/list,
 * /api/recommendations and /api/bubbles/mine each ran inside a Promise.all -
 * one round trip per bubble, so a 50-bubble feed cost 50 queries to annotate.
 *
 * Bubbles with no members are absent from the RPC result (GROUP BY has nothing
 * to group), so callers should treat a miss as 0. Every bubble normally has at
 * least its creator, but a bubble whose creator-join failed can exist with none.
 */
export async function getMemberCounts(
  admin: SupabaseClient<Database>,
  bubbleIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (bubbleIds.length === 0) return counts;

  const { data, error } = await admin.rpc("bubble_member_counts", {
    p_bubble_ids: bubbleIds,
  });

  if (error) {
    console.error("[memberCounts] bubble_member_counts failed:", error.message);
    return counts;
  }

  for (const row of data ?? []) {
    counts.set(row.bubble_id, Number(row.members_count));
  }
  return counts;
}
