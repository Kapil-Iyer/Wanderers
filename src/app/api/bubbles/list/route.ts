import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/bubbles/list
 * List active bubbles for the "Active Nearby" feed / map.
 *
 * - status in ('open', 'active') AND expires_at > now()  (excludes 'expired')
 * - joins users to include creator_name
 * - includes members_count (from bubble_members)
 * - ordered by start_time ascending
 *
 * Auth required - these are real, student-created bubbles (activity,
 * creator name, location). Guests see a hardcoded demo set on the frontend
 * instead of ever calling this route (see src/lib/demoData.ts).
 *
 * NOTE: kept 'active' alongside 'open' so bubbles don't vanish from the feed the
 * moment a 2nd person joins (join route flips status → 'active'). Only 'expired'
 * bubbles are excluded.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: bubbles, error } = await admin
      .from("bubbles")
      .select(
        "id, creator_id, activity, zone, exact_location, emoji, description, time_window, start_time, duration_minutes, max_members, status, expires_at, lat, lng, created_at"
      )
      .in("status", ["open", "active"])
      .gt("expires_at", now)
      .order("start_time", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const rows = bubbles ?? [];

    // Batch-fetch creator names (avoids relying on a specific FK-embed alias).
    const creatorIds = [...new Set(rows.map((b) => b.creator_id).filter(Boolean))];
    const nameById = new Map<string, string | null>();
    if (creatorIds.length > 0) {
      const { data: creators } = await admin.from("users").select("id, name").in("id", creatorIds);
      for (const c of creators ?? []) nameById.set(c.id, c.name);
    }

    // Member counts per bubble.
    const withMeta = await Promise.all(
      rows.map(async (b) => {
        const { count } = await admin
          .from("bubble_members")
          .select("user_id", { count: "exact", head: true })
          .eq("bubble_id", b.id);
        return {
          ...b,
          creator_name: nameById.get(b.creator_id) ?? null,
          members_count: count ?? 0,
        };
      })
    );

    return NextResponse.json({ success: true, data: withMeta });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
